#!/usr/bin/env node

/**
 * Studio Audio-First TTS & Timeline Timestamp Synthesizer (`synth-tts.mjs`)
 *
 * Aligns with Munk Auto Ops Spec:
 *   1. Try free Microsoft Neural TTS (`edge-tts` if installed on PATH).
 *   2. Fallback to `{dataDir}/secrets/azure-speech.env` (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`).
 *   3. Always compute exact `startTime`, `duration`, `fragments`, and sentence-aligned Chinese
 *      subtitle `cues` back into `workspace/scenes.json` (never leaking secret keys into logs/digest).
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const engineRoot = resolve(__dirname, "..");
const workspaceDir = join(engineRoot, "workspace");
const audioDir = join(workspaceDir, "audio");
const scenesPath = join(workspaceDir, "scenes.json");

// In Munk runtime: cwd is `{dataDir}/company/projects/studio` -> `{dataDir}/secrets/azure-speech.env` is `../../../../secrets/azure-speech.env` from engineRoot
const candidateSecretPaths = [
  resolve(engineRoot, "../../../../secrets/azure-speech.env"),
  resolve(engineRoot, "../../../secrets/azure-speech.env"),
];

function parseEnvFile(filePath) {
  const env = {};
  if (!existsSync(filePath)) return env;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = val;
  }
  return env;
}

function loadAzureSpeechCredentials() {
  for (const p of candidateSecretPaths) {
    if (existsSync(p)) {
      const parsed = parseEnvFile(p);
      if (parsed.AZURE_SPEECH_KEY && parsed.AZURE_SPEECH_REGION) {
        return { key: parsed.AZURE_SPEECH_KEY, region: parsed.AZURE_SPEECH_REGION };
      }
    }
  }
  return null;
}

function probeMp3DurationSeconds(mp3Path) {
  if (!existsSync(mp3Path)) return null;
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp3Path],
    { encoding: "utf8" },
  );
  if (probe.status === 0 && probe.stdout) {
    const val = Number.parseFloat(probe.stdout.trim());
    if (Number.isFinite(val) && val > 0) {
      return Math.ceil(val * 10) / 10;
    }
  }
  // Fallback for 48kbps mono MP3 (6000 bytes/sec)
  const sizeBytes = statSync(mp3Path).size;
  if (sizeBytes > 600) {
    return Math.max(1.5, Math.ceil((sizeBytes / 6000) * 10) / 10);
  }
  return null;
}

function estimateSpokenDuration(text) {
  const clean = String(text || "").replace(/\s+/g, "");
  if (!clean) return 3.0;
  const punctuationPauses = (clean.match(/[，。！？；：、,.!?;:]/g) || []).length * 0.28;
  const charTime = clean.length / 4.3;
  return Math.max(2.5, Math.round((charTime + punctuationPauses + 0.4) * 10) / 10);
}

function splitSentences(narration) {
  return String(narration || "")
    .split(/(?<=[。！？；!?;，,])\s*/)
    .map((s) => s.trim().replace(/[，,。！？；!?;]+$/, ""))
    .filter(Boolean);
}

function tryEdgeTtsCli(text, voice, outMp3) {
  const check = spawnSync("edge-tts", ["--version"], { stdio: "ignore" });
  if (check.status !== 0) return false;
  const run = spawnSync("edge-tts", ["--voice", voice, "--text", text, "--write-media", outMp3], {
    stdio: "ignore",
  });
  return run.status === 0 && existsSync(outMp3) && statSync(outMp3).size > 256;
}

async function tryAzureRestTts(text, voice, outMp3, creds) {
  if (!creds) return false;
  const endpoint = `https://${creds.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const ssml = `<speak version='1.0' xml:lang='zh-CN'><voice xml:lang='zh-CN' name='${voice}'>${escaped}</voice></speak>`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": creds.key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "MunkStudioVideoEngine",
      },
      body: ssml,
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 256) return false;
    writeFileSync(outMp3, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!existsSync(scenesPath)) {
    console.error("Missing workspace/scenes.json. Run `node scripts/studio-ctl.mjs init <slug>` first.");
    process.exit(1);
  }

  mkdirSync(audioDir, { recursive: true });
  const data = JSON.parse(readFileSync(scenesPath, "utf8"));
  const voice = data.voice || "zh-CN-YunxiNeural";
  const azureCreds = loadAzureSpeechCredentials();

  let cursor = 0;
  const allCues = [];

  for (const scene of data.scenes || []) {
    const narration = scene.narration || scene.headline || "";
    const outMp3 = join(audioDir, `${scene.id}.mp3`);

    let synthesized = tryEdgeTtsCli(narration, voice, outMp3);
    if (!synthesized && azureCreds) {
      synthesized = await tryAzureRestTts(narration, voice, outMp3, azureCreds);
    }

    const measured = synthesized ? probeMp3DurationSeconds(outMp3) : null;
    const duration = measured ?? estimateSpokenDuration(narration);
    const startTime = Math.round(cursor * 10) / 10;

    scene.startTime = startTime;
    scene.duration = duration;
    if (synthesized) {
      scene.audioFile = `audio/${scene.id}.mp3`;
    }

    const clauses = splitSentences(narration);
    const totalChars = clauses.reduce((acc, c) => acc + c.length, 0) || 1;
    let clauseCursor = startTime;
    const fragments = [];

    clauses.forEach((clause, idx) => {
      const share = idx === clauses.length - 1
        ? Math.max(0.4, Math.round((startTime + duration - clauseCursor) * 10) / 10)
        : Math.max(0.6, Math.round(duration * (clause.length / totalChars) * 10) / 10);
      const cueStart = Math.round(clauseCursor * 10) / 10;
      const cueEnd = Math.round(Math.min(startTime + duration, cueStart + share) * 10) / 10;
      allCues.push({
        sceneId: scene.id,
        start: cueStart,
        end: cueEnd,
        text: clause,
      });
      if (idx > 0) {
        fragments.push(cueStart);
      }
      clauseCursor = cueEnd;
    });

    scene.fragments = fragments;
    cursor = Math.round((startTime + duration) * 10) / 10;
  }

  data.totalDuration = cursor;
  data.cues = allCues;
  writeFileSync(scenesPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Synced ${data.scenes?.length ?? 0} scene(s), totalDuration=${cursor}s, cues=${allCues.length}.`);
}

main();
