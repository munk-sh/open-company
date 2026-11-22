#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

function extractFirstJsonBlock(markdown) {
  const match = /```json\s*([\s\S]*?)```/.exec(markdown);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildSnapshot() {
  const watchlistPath = join(PROJECT_ROOT, "watchlist.json");
  const watchlist = existsSync(watchlistPath)
    ? JSON.parse(readFileSync(watchlistPath, "utf8"))
    : { profile: {}, keywords: { boost: [], mute: [] }, public_sources: [], social_channels: [] };

  const signalsDir = join(PROJECT_ROOT, "signals");
  let publicSignals = [];
  let socialSignals = [];

  if (existsSync(signalsDir)) {
    const files = readdirSync(signalsDir).sort().reverse();
    for (const f of files) {
      if (!f.endsWith(".md")) continue;
      const raw = readFileSync(join(signalsDir, f), "utf8");
      if (f.startsWith("social-")) {
        socialSignals = socialSignals.concat(extractFirstJsonBlock(raw));
      } else {
        publicSignals = publicSignals.concat(extractFirstJsonBlock(raw));
      }
    }
  }

  const publicSources = watchlist.public_sources || [];
  const socialChannels = watchlist.social_channels || [];
  const enabledPublicCount = publicSources.filter((s) => s.enabled !== false).length;
  const enabledSocialCount = socialChannels.filter((s) => s.enabled !== false).length;
  const sTierCount = publicSignals.filter((s) => s.tier === "S").length;

  return {
    generatedAt: new Date().toISOString(),
    profile: watchlist.profile || {},
    keywords: watchlist.keywords || { boost: [], mute: [] },
    socialWindow: watchlist.social_window || { active_hours_start: 8, active_hours_end: 22 },
    stats: {
      totalSources: publicSources.length + socialChannels.length,
      enabledSources: enabledPublicCount + enabledSocialCount,
      publicSignalsCount: publicSignals.length,
      sTierCount,
      socialArbitrageCount: socialSignals.length,
      boostKeywordsCount: (watchlist.keywords?.boost || []).length
    },
    publicSources,
    socialChannels,
    publicSignals,
    socialSignals
  };
}

function refreshDashboard() {
  const snapshot = buildSnapshot();
  const dataPath = join(PROJECT_ROOT, "dashboard-data.json");
  writeFileSync(dataPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const htmlPath = join(PROJECT_ROOT, "dashboard.html");
  if (existsSync(htmlPath)) {
    const html = readFileSync(htmlPath, "utf8");
    const replacement = [
      "<!-- MUNK_DASHBOARD_DATA_START -->",
      "<script id=\"munk-dashboard-data\">",
      `window.__DASHBOARD_DATA__ = ${JSON.stringify(snapshot, null, 2)};`,
      "</script>",
      "<!-- MUNK_DASHBOARD_DATA_END -->"
    ].join("\n");
    const updated = html.replace(
      /<!-- MUNK_DASHBOARD_DATA_START -->[\s\S]*?<!-- MUNK_DASHBOARD_DATA_END -->/,
      replacement
    );
    writeFileSync(htmlPath, updated, "utf8");
  }
  return snapshot;
}

const snap = refreshDashboard();
console.log(
  JSON.stringify(
    {
      ok: true,
      updated: ["dashboard-data.json", "dashboard.html"],
      stats: snap.stats
    },
    null,
    2
  )
);
