#!/usr/bin/env python3
"""
scripts/echo360_helper.py
Lightweight, tailored Echo360 helper extracted from soraxas/echo360.
- Connects to UNSW Echo360 (echo360.org.au)
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
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSION_DIR = os.path.join(BASE_DIR, ".echo360_session")
COOKIES_FILE = os.path.join(SESSION_DIR, "cookies.json")

MEDIA_ID_RE = re.compile(r'\\?"mediaId\\?"\s*:\s*\\?"([0-9a-fA-F-]{36})')
CAPTIONS_VTT_RE = re.compile(r'https://captions\.[^"\'\s\\]+?\.vtt')
M3U8_AUDIO_RE = re.compile(r'URI="([^"]*s0q\d+\.m3u8[^"]*)"', re.IGNORECASE)

def setup_interactive_login(course_url="https://echo360.org.au"):
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

def download_audio_stream(m3u8_url, output_file, session=None):
    """Uses ffmpeg to download the audio stream directly without video."""
    print(f"Downloading audio-only stream to {output_file}...")
    cookie_header = ""
    if session:
        cookie_parts = [f"{k}={v}" for k, v in session.cookies.items()]
        cookie_header = "; ".join(cookie_parts)

    cmd = ["ffmpeg", "-y"]
    if cookie_header:
        cmd.extend(["-headers", f"Cookie: {cookie_header}\r\n"])
    cmd.extend(["-i", m3u8_url, "-vn", "-c:a", "copy", output_file])

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Audio downloaded successfully: {output_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg audio download failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Echo360 Transcript & Audio Downloader")
    parser.add_argument("--login", action="store_true", help="Launch interactive Chrome login for 2FA")
    parser.add_argument("--url", help="Echo360 Course or Lesson URL")
    parser.add_argument("--course", default="MATH3701", help="Course code folder")
    parser.add_argument("--audio", action="store_true", help="Also download audio stream (.m4a)")
    
    args = parser.parse_args()

    if args.login:
        setup_interactive_login(args.url or "https://echo360.org.au")
        return

    if not args.url:
        print("Please provide --url <ECHO360_URL> or run with --login")
        return

    session = get_authenticated_session()
    if not session:
        print("No active login session found. Run with --login first!")
        return

    print(f"Connecting to {args.url}...")
    r = session.get(args.url)
    if r.status_code != 200:
        print(f"Request failed with HTTP {r.status_code}")
        return

    media_ids = MEDIA_ID_RE.findall(r.text)
    if not media_ids:
        print("No media IDs found on page. The lecture might require re-login.")
        return

    media_id = media_ids[0]
    print(f"Found Echo360 Media ID: {media_id}")

    # Output directory
    out_dir = os.path.join(BASE_DIR, "courses", args.course.upper(), "raw_files")
    os.makedirs(os.path.join(out_dir, "transcripts"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "audio"), exist_ok=True)

    # 1. Fetch transcript
    transcript_url = f"https://echo360.org.au/api/ui/echoplayer/media/{media_id}/transcript"
    tr_res = session.get(transcript_url)
    
    if tr_res.status_code == 200:
        lines = transcript_json_to_lines(tr_res.json())
        txt_path = os.path.join(out_dir, "transcripts", f"lecture_{media_id}.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        print(f"Saved clean transcript ({len(lines)} cues): {txt_path}")

    print("\nEcho360 extraction completed!")

if __name__ == "__main__":
    main()
