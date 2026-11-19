#!/usr/bin/env python3
"""
scripts/echo360_helper.py
Lightweight, tailored Echo360 helper extracted from soraxas/echo360.
- Connects to UNSW Echo360 (echo360.net.au)
- Supports one-time interactive Chrome login for 2FA / SSO
- Caches session cookies in .echo360_session/
- Fetches Transcripts (.txt and .vtt)
- Downloads Audio-Only stream (.m4a, ~35MB) via ffmpeg
"""

import os
import sys
import json
import re
import argparse
import subprocess
from urllib.parse import urlparse
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSION_DIR = os.path.join(BASE_DIR, ".echo360_session")
COOKIES_FILE = os.path.join(SESSION_DIR, "cookies.json")

MEDIA_ID_RE = re.compile(
    r'(?:\\?"mediaId\\?"\s*:\s*\\?"([0-9a-fA-F-]{36})|(?:echoplayer/media|/media)/([0-9a-fA-F-]{36}))'
)
NESTED_VIDEO_MEDIA_ID_RE = re.compile(
    r'"video"\s*:\s*\{[\s\S]{0,400}?"media"\s*:\s*\{[\s\S]{0,200}?"id"\s*:\s*"([0-9a-fA-F-]{36})"'
)
CAPTIONS_VTT_RE = re.compile(r'https://captions\.[^"\'\s\\]+?\.vtt')
M3U8_AUDIO_RE = re.compile(r'URI="([^"]*s0q\d+\.m3u8[^"]*)"', re.IGNORECASE)
ANY_M3U8_RE = re.compile(r'https?://[^"\'\s\\<>]+?\.m3u8[^"\'\s\\<>]*', re.IGNORECASE)
DIRECT_STREAM_RE = re.compile(
    r'https?://[^"\'\s\\<>]+?(?:s\dq\d+\.(?:mp4|m4a)|/audio[^"\'\s\\<>]*\.(?:m4a|mp3|mp4))[^"\'\s\\<>]*',
    re.IGNORECASE
)


def normalize_escaped_text(raw):
    if not raw:
        return ""
    return (
        raw.replace("\\/", "/")
        .replace("\\u002f", "/")
        .replace("\\u002F", "/")
        .replace("\\u0026", "&")
        .replace("&amp;", "&")
    )


def extract_explicit_media_id(text):
    if not text:
        return None
    m = MEDIA_ID_RE.search(text)
    if m:
        return m.group(1) or m.group(2)
    m2 = NESTED_VIDEO_MEDIA_ID_RE.search(text)
    if m2:
        return m2.group(1)
    return None


def pick_best_stream_url(media_container, base_domain):
    if not isinstance(media_container, dict):
        return None

    candidates = []
    order = 0

    def to_full_url(raw_url):
        val = normalize_escaped_text(str(raw_url).strip())
        if not val:
            return None
        if val.startswith("/"):
            return f"{base_domain}{val}"
        if val.startswith("http://") or val.startswith("https://"):
            return val
        return None

    def collect_files(arr, is_secondary=False):
        nonlocal order
        if not isinstance(arr, list):
            return
        for entry in arr:
            order += 1
            if isinstance(entry, str):
                url = to_full_url(entry)
                if not url:
                    continue
                if is_secondary:
                    prio = 5
                elif re.search(r"s0q\d+\.m3u8", url, re.I):
                    prio = 1
                elif re.search(r"\.m3u8(?:[?#]|$)", url, re.I):
                    prio = 2
                else:
                    prio = 4
                candidates.append((prio, sys.maxsize, order, url))
                continue
            if not isinstance(entry, dict):
                continue
            raw_url = next(
                (entry.get(k) for k in ("s3Url", "uri", "url", "hlsUrl", "sourceUrl", "manifestUrl", "src")
                 if isinstance(entry.get(k), str) and entry.get(k).strip()),
                None,
            )
            if not raw_url:
                continue
            url = to_full_url(raw_url)
            if not url:
                continue

            size_val = entry.get("size")
            width_val = entry.get("width")
            if isinstance(size_val, (int, float)) and size_val > 0:
                size_metric = int(size_val)
            elif isinstance(width_val, (int, float)) and width_val > 0:
                size_metric = int(width_val) * 1_000_000
            else:
                size_metric = sys.maxsize

            is_audio = (
                entry.get("audioOnly") is True
                or "audio" in str(entry.get("mediaType") or entry.get("type") or "").lower()
                or bool(re.search(r"s0q\d+\.(?:m4a|mp4)", url, re.I))
                or bool(re.search(r"\.(?:m4a|mp3)(?:[?#]|$)", url, re.I))
            )

            if is_secondary:
                prio = 5
            elif re.search(r"s0q\d+\.m3u8", url, re.I):
                prio = 1
            elif re.search(r"\.m3u8(?:[?#]|$)", url, re.I):
                prio = 2
            elif is_audio:
                prio = 3
            else:
                prio = 4
            candidates.append((prio, size_metric, order, url))

    lvl1 = media_container.get("media") if isinstance(media_container.get("media"), dict) else media_container
    lvl2 = lvl1.get("media") if isinstance(lvl1.get("media"), dict) else lvl1
    current = lvl2.get("current") if isinstance(lvl2.get("current"), dict) else lvl2

    for obj in (current, lvl2, lvl1, media_container):
        if isinstance(obj, dict):
            collect_files(obj.get("primaryFiles"), False)
            collect_files(obj.get("audioFiles"), False)
            collect_files(obj.get("playableMedias"), False)

    for obj in (current, lvl2, lvl1, media_container):
        if isinstance(obj, dict):
            collect_files(obj.get("secondaryFiles"), True)

    if candidates:
        candidates.sort(key=lambda item: (item[0], item[1], item[2]))
        return candidates[0][3]

    dumped = normalize_escaped_text(json.dumps(media_container))
    for pattern in (M3U8_AUDIO_RE, ANY_M3U8_RE, DIRECT_STREAM_RE):
        m = pattern.search(dumped)
        if m:
            url = m.group(1) if m.lastindex else m.group(0)
            return to_full_url(url)
    return None


def parse_syllabus_lessons(syl_data, base_domain):
    raw_items = syl_data if isinstance(syl_data, list) else (
        syl_data.get("data") or syl_data.get("lessons") or syl_data.get("classes") or []
    )
    flattened = []
    for entry in raw_items:
        if not isinstance(entry, dict):
            continue
        if isinstance(entry.get("lessons"), list):
            g_info = entry.get("groupInfo") if isinstance(entry.get("groupInfo"), dict) else {}
            g_name = g_info.get("name") or g_info.get("title") or entry.get("name") or ""
            for child in entry["lessons"]:
                if isinstance(child, dict):
                    flattened.append((child, g_name))
        else:
            flattened.append((entry, ""))

    lessons = []
    for idx, (raw, group_name) in enumerate(flattened):
        raw_lesson = raw.get("lesson") if isinstance(raw.get("lesson"), dict) else None
        container = raw_lesson if (raw_lesson and any(k in raw_lesson for k in ("lesson", "video", "medias"))) else raw
        l = container.get("lesson") if isinstance(container.get("lesson"), dict) else container

        lid = str(l.get("id") or container.get("id") or raw.get("id") or f"lesson-{idx + 1}")
        title = str(
            l.get("name") or l.get("title") or container.get("name") or raw.get("name")
            or (f"{group_name} — Lecture {idx + 1}" if group_name else f"Lecture {idx + 1}")
        )

        video_obj = container.get("video") or raw.get("video") or l.get("video")
        video_media_obj = video_obj.get("media") if isinstance(video_obj, dict) and isinstance(video_obj.get("media"), dict) else video_obj
        medias = (
            container.get("medias") if isinstance(container.get("medias"), list)
            else l.get("medias") if isinstance(l.get("medias"), list)
            else raw.get("medias") if isinstance(raw.get("medias"), list)
            else []
        )
        vid_entry = next(
            (m for m in medias if isinstance(m, dict) and str(m.get("mediaType") or m.get("type") or "").lower() in ("video", "audio")),
            medias[0] if medias and isinstance(medias[0], dict) else {},
        )

        candidate_ids = [
            video_media_obj.get("id") if isinstance(video_media_obj, dict) else None,
            video_obj.get("mediaId") if isinstance(video_obj, dict) else None,
            video_obj.get("id") if isinstance(video_obj, dict) else None,
            vid_entry.get("id") if isinstance(vid_entry, dict) else None,
            vid_entry.get("mediaId") if isinstance(vid_entry, dict) else None,
            l.get("mediaId"),
            container.get("mediaId"),
            raw.get("mediaId"),
        ]
        explicit_mid = next((str(c).strip() for c in candidate_ids if isinstance(c, str) and c.strip() and not c.strip().startswith("G_")), None)
        stream_url = pick_best_stream_url(video_obj or container, base_domain)
        has_video = bool(
            explicit_mid
            or stream_url
            or l.get("hasVideo")
            or container.get("hasVideo")
            or any(
                isinstance(m, dict) and str(m.get("mediaType") or m.get("type") or "").lower() in ("video", "audio")
                for m in medias
            )
        )

        lessons.append({
            "lesson_id": lid,
            "media_id": explicit_mid or lid,
            "title": title,
            "group_name": group_name,
            "has_video": has_video,
            "stream_url": stream_url,
        })
    return lessons

def setup_interactive_login(course_url="https://echo360.net.au"):
    """Launches Chrome for user to complete SSO and Microsoft 2FA push once."""
    print("Launching Chrome for Echo360 Single Sign-On (SSO / 2FA)...")
    os.makedirs(SESSION_DIR, exist_ok=True)
    
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        options = Options()
        options.add_argument(f"--user-data-dir={os.path.abspath(SESSION_DIR)}")
        driver = webdriver.Chrome(options=options)
        
        driver.get(course_url)
        print("\nPlease log into your university portal in the Chrome browser window.")
        print("Once you see your Echo360 course dashboard, return here.")
        input("Press [Enter] here once you have successfully logged in: ")
        
        cookies = driver.get_cookies()
        with open(COOKIES_FILE, "w", encoding="utf-8") as f:
            json.dump(cookies, f, indent=2)
            
        print(f"Successfully cached {len(cookies)} session cookies in {COOKIES_FILE}!")
        driver.quit()
        return True
    except ImportError:
        print("Selenium is not installed in this environment. Run: pip install selenium")
        return False
    except Exception as e:
        print(f"Login failed: {e}")
        return False

def get_authenticated_session():
    """Loads cached cookies into a requests.Session."""
    if not os.path.exists(COOKIES_FILE):
        return None
        
    session = requests.Session()
    try:
        with open(COOKIES_FILE, "r", encoding="utf-8") as f:
            cookies = json.load(f)
        for c in cookies:
            session.cookies.set(c["name"], c["value"], domain=c.get("domain"))
        return session
    except Exception as e:
        print(f"Failed to load cookies: {e}")
        return None

def transcript_json_to_lines(transcript_json):
    """Recursively extracts cue lines from Echo360 transcript JSON."""
    lines = []
    
    def find_cues(obj):
        if isinstance(obj, dict):
            if "cues" in obj and isinstance(obj["cues"], list):
                return obj["cues"]
            for v in obj.values():
                res = find_cues(v)
                if res: return res
        elif isinstance(obj, list):
            for item in obj:
                res = find_cues(item)
                if res: return res
        return []

    cues = find_cues(transcript_json) or []
    prev_text = ""
    for cue in cues:
        txt = cue.get("content", cue.get("text", "")).strip()
        if txt and txt != prev_text:
            lines.append(txt)
            prev_text = txt
            
    return lines

def build_cookie_header(session):
    if not session:
        return ""
    cookie_map = {}
    for c in session.cookies:
        if c.name and c.value is not None:
            cookie_map[c.name] = c.value
    return "; ".join(f"{k}={v}" for k, v in cookie_map.items())


def resolve_lesson_stream_fallback(session, base_domain, lesson_id, media_id):
    """Fetches lesson classroom HTML and Echo360 JSON APIs to resolve mediaId and streamUrl."""
    resolved_media_id = media_id
    stream_url = None

    if lesson_id:
        lesson_url = f"{base_domain}/lesson/{lesson_id}/classroom"
        try:
            l_res = session.get(lesson_url)
            if l_res.status_code == 200:
                if not resolved_media_id or str(resolved_media_id).startswith("G_"):
                    resolved_media_id = extract_explicit_media_id(l_res.text) or resolved_media_id
                dumped = normalize_escaped_text(l_res.text)
                for pat in (M3U8_AUDIO_RE, ANY_M3U8_RE, DIRECT_STREAM_RE):
                    m = pat.search(dumped)
                    if m:
                        stream_url = m.group(1) if m.lastindex else m.group(0)
                        break
        except Exception:
            pass

    endpoints = []
    if lesson_id:
        endpoints.append(f"{base_domain}/api/ui/lessons/{lesson_id}")
        endpoints.append(f"{base_domain}/api/ui/lessons/{lesson_id}/medias")
    if resolved_media_id and not str(resolved_media_id).startswith("G_"):
        endpoints.append(f"{base_domain}/api/ui/echoplayer/media/{resolved_media_id}")
        endpoints.append(f"{base_domain}/api/ui/medias/{resolved_media_id}")

    seen = set()
    idx = 0
    while idx < len(endpoints) and not stream_url:
        ep = endpoints[idx]
        idx += 1
        if ep in seen:
            continue
        seen.add(ep)
        try:
            j_res = session.get(ep, headers={"Accept": "application/json, text/plain, */*"})
            if j_res.status_code != 200:
                continue
            j_data = j_res.json()
            if not resolved_media_id or str(resolved_media_id).startswith("G_"):
                discovered = extract_explicit_media_id(j_res.text)
                if discovered:
                    resolved_media_id = discovered
                    endpoints.append(f"{base_domain}/api/ui/echoplayer/media/{discovered}")
            stream_url = pick_best_stream_url(j_data, base_domain)
        except Exception:
            continue

    return resolved_media_id, stream_url


def download_audio_stream(stream_url, output_file, session=None):
    """Uses ffmpeg to download the audio stream directly without video."""
    print(f"Downloading audio-only stream to {output_file}...")
    cookie_header = build_cookie_header(session)
    tmp_file = (output_file[:-4] + ".tmp.m4a") if output_file.lower().endswith(".m4a") else (output_file + ".tmp.m4a")
    if os.path.exists(tmp_file):
        try:
            os.remove(tmp_file)
        except OSError:
            pass

    cmd = ["ffmpeg", "-y"]
    if cookie_header:
        cmd.extend(["-headers", f"Cookie: {cookie_header}\r\n"])
    cmd.extend(["-i", stream_url, "-vn", "-c:a", "copy", tmp_file])

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(tmp_file) and os.path.getsize(tmp_file) > 20000:
            os.replace(tmp_file, output_file)
            print(f"Audio downloaded successfully: {output_file}")
            return True
        print("Downloaded audio stream was empty (<20KB).")
        return False
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg audio download failed: {e}")
        return False
    finally:
        if os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except OSError:
                pass


def main():
    parser = argparse.ArgumentParser(description="Echo360 Transcript & Audio Downloader")
    parser.add_argument("--login", action="store_true", help="Launch interactive Chrome login for 2FA")
    parser.add_argument("--url", help="Echo360 Course or Lesson URL")
    parser.add_argument("--course", default="MATH3701", help="Course code folder")
    parser.add_argument("--audio", action="store_true", help="Also download audio stream (.m4a)")
    parser.add_argument("--all", action="store_true", help="Batch download all lectures in the course section")

    args = parser.parse_args()

    if args.login:
        setup_interactive_login(args.url or "https://echo360.net.au")
        return

    if not args.url:
        print("Please provide --url <ECHO360_URL> or run with --login")
        return

    session = get_authenticated_session()
    if not session:
        print("No active login session found. Run with --login first!")
        return

    parsed_domain = urlparse(args.url)
    base_domain = f"{parsed_domain.scheme}://{parsed_domain.netloc}" if parsed_domain.netloc else "https://echo360.net.au"

    # Output directory
    out_dir = os.path.join(BASE_DIR, "courses", args.course.upper(), "raw_files")
    os.makedirs(os.path.join(out_dir, "transcripts"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "audio"), exist_ok=True)

    # Check if batch mode (--all or section URL without /lesson/)
    is_section = "/section/" in args.url and "/lesson/" not in args.url
    if args.all or is_section:
        sec_match = re.search(r'/section/([0-9a-fA-F-]{36}|[0-9a-zA-Z_-]+)', args.url)
        if not sec_match:
            print("Could not extract section UUID from URL.")
            return

        section_id = sec_match.group(1)
        syllabus_url = f"{base_domain}/section/{section_id}/syllabus"
        print(f"Fetching syllabus for section {section_id}...")
        syl_res = session.get(syllabus_url)

        lessons = []
        if syl_res.status_code == 200:
            try:
                syl_data = syl_res.json()
                lessons = parse_syllabus_lessons(syl_data, base_domain)
            except Exception as e:
                print(f"Error parsing syllabus JSON: {e}")

        if not lessons:
            print("No lectures found via /syllabus endpoint. Attempting page HTML scan...")
            r_home = session.get(f"{base_domain}/section/{section_id}/home")
            seen_mids = set()
            for m in MEDIA_ID_RE.finditer(r_home.text):
                mid = m.group(1) or m.group(2)
                if mid and mid not in seen_mids:
                    seen_mids.add(mid)
                    lessons.append({
                        "lesson_id": mid,
                        "media_id": mid,
                        "title": f"Lecture ({mid[:8]})",
                        "has_video": True,
                        "stream_url": None,
                    })

        print(f"Found {len(lessons)} lessons in section. Processing...")
        for i, lec in enumerate(lessons):
            print(f"\n--- [{i+1}/{len(lessons)}] {lec['title']} (Media: {lec['media_id']}) ---")
            if not lec.get("has_video", True):
                print("  - Skipping (no video recording)")
                continue

            media_id = lec["media_id"]
            stream_url = lec.get("stream_url")
            if str(media_id).startswith("G_") or (args.audio and not stream_url):
                media_id, fallback_stream = resolve_lesson_stream_fallback(
                    session, base_domain, lec.get("lesson_id"), media_id
                )
                stream_url = stream_url or fallback_stream

            # 1. Transcript
            if media_id and not str(media_id).startswith("G_"):
                tr_url = f"{base_domain}/api/ui/echoplayer/media/{media_id}/transcript"
                t_res = session.get(tr_url)
                if t_res.status_code == 200:
                    lines = transcript_json_to_lines(t_res.json())
                    if lines:
                        txt_path = os.path.join(out_dir, "transcripts", f"lecture_{media_id}.txt")
                        with open(txt_path, "w", encoding="utf-8") as f:
                            f.write("\n".join(lines))
                        print(f"  ✓ Saved clean transcript ({len(lines)} cues)")

            # 2. Audio
            if args.audio:
                if stream_url:
                    audio_out = os.path.join(out_dir, "audio", f"lecture_{media_id}.m4a")
                    ok = download_audio_stream(stream_url, audio_out, session=session)
                    if not ok:
                        # Refresh /syllabus once in case CloudFront URL/cookies expired
                        refresh_res = session.get(syllabus_url)
                        if refresh_res.status_code == 200:
                            try:
                                refreshed = parse_syllabus_lessons(refresh_res.json(), base_domain)
                                match = next(
                                    (x for x in refreshed if x["lesson_id"] == lec["lesson_id"] or x["media_id"] == media_id),
                                    None,
                                )
                                if match and match.get("stream_url"):
                                    download_audio_stream(match["stream_url"], audio_out, session=session)
                            except Exception:
                                pass
                else:
                    print("  ! No audio/video stream URL found for this lecture.")

        print("\nAll section lectures processed successfully!")
        return

    # Single lecture processing
    print(f"Connecting to {args.url}...")
    r = session.get(args.url)
    if r.status_code != 200:
        print(f"Request failed with HTTP {r.status_code}")
        return

    lesson_match = re.search(r'/lesson/([^/?#]+)', args.url)
    lesson_id = lesson_match.group(1) if lesson_match else None
    media_id = extract_explicit_media_id(r.text) or extract_explicit_media_id(args.url)
    stream_url = None

    dumped = normalize_escaped_text(r.text)
    for pat in (M3U8_AUDIO_RE, ANY_M3U8_RE, DIRECT_STREAM_RE):
        m = pat.search(dumped)
        if m:
            stream_url = m.group(1) if m.lastindex else m.group(0)
            break

    if not media_id or (args.audio and not stream_url):
        fb_mid, fb_stream = resolve_lesson_stream_fallback(session, base_domain, lesson_id, media_id)
        media_id = media_id or fb_mid
        stream_url = stream_url or fb_stream

    if not media_id:
        uuid_in_url = re.search(r'([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})', args.url)
        media_id = uuid_in_url.group(1) if uuid_in_url else None

    if not media_id:
        print("No media IDs found on page. The lecture might require re-login.")
        return

    print(f"Found Echo360 Media ID: {media_id}")

    # 1. Fetch transcript
    transcript_url = f"{base_domain}/api/ui/echoplayer/media/{media_id}/transcript"
    tr_res = session.get(transcript_url)

    if tr_res.status_code == 200:
        lines = transcript_json_to_lines(tr_res.json())
        if lines:
            txt_path = os.path.join(out_dir, "transcripts", f"lecture_{media_id}.txt")
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
            print(f"Saved clean transcript ({len(lines)} cues): {txt_path}")

    # 2. Download audio if requested
    if args.audio:
        if stream_url:
            audio_out = os.path.join(out_dir, "audio", f"lecture_{media_id}.m4a")
            download_audio_stream(stream_url, audio_out, session=session)
        else:
            print("No audio stream URL found in lecture HTML or player APIs.")

    print("\nEcho360 extraction completed!")


if __name__ == "__main__":
    main()
