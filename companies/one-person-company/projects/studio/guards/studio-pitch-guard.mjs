#!/usr/bin/env node

/**
 * 0-Token Preflight Guard for `studio/topic-pitch`
 *
 * Exit code contract (Munk Auto Ops Guard):
 *   0 -> Wake the agent (no pitch generated today yet, AND there are open `studio` sparks in `../brain/sparks.md` or fresh `studio` signals in `../radar/signals/`)
 *   1 -> Skip silently (0 tokens consumed)
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const studioDir = resolve(__dirname, "..");
const projectsRoot = resolve(studioDir, "..");
const pitchesDir = join(studioDir, "pitches");

function resolveSiblingProjectDir(specId, titleKeyword) {
  const direct = join(projectsRoot, specId);
  if (existsSync(direct)) return direct;
  try {
    for (const entry of readdirSync(projectsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const candidate = join(projectsRoot, entry.name);
      const metaPath = join(candidate, "meta.json");
      if (!existsSync(metaPath)) continue;
      const meta = JSON.parse(readFileSync(metaPath, "utf8"));
      if (typeof meta?.title === "string" && meta.title.includes(titleKeyword)) {
        return candidate;
      }
    }
  } catch {
    // ignore
  }
  return direct;
}

const brainSparksPath = join(resolveSiblingProjectDir("brain", "第二大脑"), "sparks.md");
const radarSignalsDir = join(resolveSiblingProjectDir("radar", "情报雷达"), "signals");

function collectHandledSparkIds() {
  const seen = new Set();
  for (const sub of ["pitches", "drafts", "published"]) {
    const dir = join(studioDir, sub);
    if (!existsSync(dir)) continue;
    try {
      for (const f of readdirSync(dir)) {
        if (!f.endsWith(".md") || f.toLowerCase() === "readme.md") continue;
        const raw = readFileSync(join(dir, f), "utf8");
        for (const m of raw.matchAll(/\bSPARK-S\d+\b/gi)) {
          seen.add(m[0].toUpperCase());
        }
      }
    } catch {
      // ignore
    }
  }
  return seen;
}

function formatLocalDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function alreadyPitchedToday() {
  const todayFile = join(pitchesDir, `${formatLocalDate()}.md`);
  if (!existsSync(todayFile)) return false;
  try {
    return statSync(todayFile).size > 32;
  } catch {
    return false;
  }
}

function hasOpenStudioSparks() {
  if (!existsSync(brainSparksPath)) return false;
  try {
    const handledIds = collectHandledSparkIds();
    const content = readFileSync(brainSparksPath, "utf8");
    const sections = content.split(/(?:^###\s+|^- \*\*\[SPARK-)/m).slice(1);
    for (const sec of sections) {
      const idMatch = /^(S\d+)\]/i.exec(sec);
      const sparkId = idMatch ? `SPARK-${idMatch[1].toUpperCase()}` : null;
      const isStudio = Boolean(idMatch) || /\*\*类型\*\*[：:]\s*studio/i.test(sec);
      const isOpen = /\*\*状态\*\*[：:]\s*`?(?:待认领|ready|open)/i.test(sec);
      if (isStudio && isOpen && (!sparkId || !handledIds.has(sparkId))) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function hasRecentRadarSignalsForStudio() {
  if (!existsSync(radarSignalsDir)) return false;
  const cutoffMs = Date.now() - 36 * 60 * 60 * 1000;
  try {
    const files = readdirSync(radarSignalsDir).filter(
      (name) => name.endsWith(".md") && !name.startsWith(".") && name.toLowerCase() !== "readme.md",
    );
    for (const file of files) {
      const fullPath = join(radarSignalsDir, file);
      const st = statSync(fullPath);
      if (st.mtimeMs < cutoffMs) continue;
      const raw = readFileSync(fullPath, "utf8");
      if (/(?:→|->|流向|路由|下游)[^\n]*\bstudio\b/i.test(raw)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

if (alreadyPitchedToday()) {
  process.exit(1);
}

if (hasOpenStudioSparks() || hasRecentRadarSignalsForStudio()) {
  console.log("Found unpitched studio sparks or fresh radar signals; waking topic-pitch.");
  process.exit(0);
}

process.exit(1);
