import fs from "node:fs/promises";
import path from "node:path";
import { buildGeminiGenerationConfig, resolveGeminiModel } from "./gemini-client";

export interface TranscribeAudioOptions {
  audioPath: string;
  apiKey: string;
  model?: string;
  lectureTitle?: string;
  week?: number;
  courseContext?: string;
}

export interface TranscribeAudioResult {
  transcriptText: string;
  cueCount: number;
  modelUsed: string;
}

interface UploadedGeminiFile {
  name: string;
  uri: string;
  state: string;
}

async function uploadAudioToGeminiFiles(
  audioPath: string,
  apiKey: string,
  mimeType: string = "audio/mp4"
): Promise<UploadedGeminiFile> {
  const buffer = await fs.readFile(/*turbopackIgnore: true*/ audioPath);
  const displayName = path.basename(audioPath);

  const startRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(buffer.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ file: { display_name: displayName } })
    }
  );

  if (!startRes.ok) {
    const errText = await startRes.text().catch(() => "");
    throw new Error(`Gemini File API upload init failed (${startRes.status}): ${errText.slice(0, 240)}`);
  }

  const uploadUrl = startRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new Error("Gemini File API did not return an x-goog-upload-url header.");
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Offset": "0",
      "Content-Type": mimeType
    },
    body: new Uint8Array(buffer)
  });

  const uploadData = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok || !uploadData?.file?.name || !uploadData?.file?.uri) {
    throw new Error(
      uploadData?.error?.message || `Gemini File API upload finalize failed (${uploadRes.status})`
    );
  }

  let fileMeta: UploadedGeminiFile = {
    name: uploadData.file.name,
    uri: uploadData.file.uri,
    state: uploadData.file.state || "PROCESSING"
  };

  // Poll until ACTIVE (up to ~60s)
  const deadline = Date.now() + 60000;
  while (fileMeta.state === "PROCESSING" && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const checkRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileMeta.name}?key=${apiKey}`
    );
    if (checkRes.ok) {
      const checkJson = await checkRes.json();
      fileMeta.state = checkJson?.state || fileMeta.state;
      if (checkJson?.uri) fileMeta.uri = checkJson.uri;
    }
  }

  if (fileMeta.state !== "ACTIVE") {
    throw new Error(`Gemini File API audio did not become ACTIVE (state=${fileMeta.state}).`);
  }

  return fileMeta;
}

async function generateTranscriptWindow(params: {
  apiKey: string;
  model: string;
  fileUri: string;
  mimeType: string;
  windowInstruction: string;
  glossaryContext: string;
}): Promise<string> {
  const { apiKey, model, fileUri, mimeType, windowInstruction, glossaryContext } = params;

  const prompt = `Transcribe the spoken lecture audio accurately.
Format every distinct spoken paragraph or sentence group with a leading [hh:mm:ss] timestamp marker at the start of the line, e.g.:
[00:04:12] Let us consider the Gaussian curvature of a regular surface...

Rules:
- Use accurate mathematical terminology and notation (use the course context below to spell theorems, definitions, and symbols properly).
- Include mathematical expressions inline ($...$) when the lecturer clearly states equations.
- ${windowInstruction}
- Output ONLY the timestamped transcript lines, with no intro or markdown fences.

${glossaryContext ? `Course terminology reference (truncated):\n${glossaryContext.slice(0, 6000)}` : ""}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { file_data: { mime_type: mimeType, file_uri: fileUri } },
              { text: prompt }
            ]
          }
        ],
        generationConfig: buildGeminiGenerationConfig({
          model,
          temperature: 0.1,
          thinkingLevel: "low"
        })
      })
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini audio transcription failed (${res.status})`);
  }

  return String(data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
}

/**
 * Fallback multimodal audio transcription via Google Gemini File API for Echo360 lessons lacking VTT cues.
 */
export async function transcribeAudioWithGemini(
  options: TranscribeAudioOptions
): Promise<TranscribeAudioResult> {
  const { audioPath, apiKey, model, lectureTitle, week, courseContext = "" } = options;
  const key = apiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Audio-only fallback requires a Google Gemini API key (no VTT transcript found on Echo360). Add your Gemini API key in AI Settings to transcribe `.m4a` audio automatically."
    );
  }

  const targetModel = await resolveGeminiModel(key, model || "gemini-4-hydrogen");
  const stat = await fs.stat(/*turbopackIgnore: true*/ audioPath);
  const mimeType = audioPath.toLowerCase().endsWith(".mp3") ? "audio/mpeg" : "audio/mp4";

  const uploaded = await uploadAudioToGeminiFiles(audioPath, key, mimeType);
  try {
    const contextHeader = `${lectureTitle ? `Lecture: ${lectureTitle}` : ""}${week ? ` (Week ${week})` : ""}`;
    const glossaryContext = [contextHeader, courseContext].filter(Boolean).join("\n");

    // Files > 28MB (~55+ mins at typical Echo360 AAC bitrates) are transcribed in 2 windows against the same uploaded file URI
    const windows =
      stat.size > 28 * 1024 * 1024
        ? [
            "Transcribe ONLY from 00:00:00 through 01:02:00 of the recording.",
            "Transcribe ONLY from 01:00:00 through the end of the recording. If the recording already ended before 01:00:00, output empty text."
          ]
        : ["Transcribe the ENTIRE audio recording from start to finish."];

    const parts: string[] = [];
    for (const windowInstruction of windows) {
      const segmentText = await generateTranscriptWindow({
        apiKey: key,
        model: targetModel,
        fileUri: uploaded.uri,
        mimeType,
        windowInstruction,
        glossaryContext
      });
      if (segmentText) parts.push(segmentText);
    }

    const transcriptText = parts.join("\n").trim();
    const cueCount = transcriptText.split("\n").filter((l) => /\[\d{2}:\d{2}:\d{2}\]/.test(l)).length;
    if (!transcriptText) {
      throw new Error("Gemini returned an empty transcription for the audio stream.");
    }

    return {
      transcriptText,
      cueCount: cueCount || transcriptText.split("\n").filter((l) => l.trim().length > 0).length,
      modelUsed: targetModel
    };
  } finally {
    fetch(`https://generativelanguage.googleapis.com/v1beta/${uploaded.name}?key=${key}`, {
      method: "DELETE"
    }).catch(() => {
      // Best-effort remote cleanup
    });
  }
}
