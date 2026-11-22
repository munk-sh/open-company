#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

const DEFAULT_PILLARS = [
  { id: "P1", name: "搞钱算账与微商业拆解", targetPct: 40 },
  { id: "P2", name: "一人公司杠杆与工作流实战", targetPct: 40 },
  { id: "P3", name: "反共识认知与一线踩坑复盘", targetPct: 20 }
];

function listMarkdown(dir) {
  const abs = join(PROJECT_ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .sort()
    .reverse();
}

function parseFrontMatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!match) return {};
  const out = {};
  let parentKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    const nested = /^\s{2,}([\w-]+):\s*(.*)$/.exec(line);
    if (nested && parentKey) {
      out[parentKey] = out[parentKey] || {};
      out[parentKey][nested[1]] = coerce(nested[2]);
      continue;
    }
    const top = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!top) continue;
    const [, key, value] = top;
    if (value === "") {
      parentKey = key;
      out[key] = {};
    } else {
      parentKey = null;
      out[key] = coerce(value);
    }
  }
  return out;
}

function coerce(value) {
  const v = value.trim();
  if (v === "null" || v === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return v.replace(/^["']|["']$/g, "");
}

function extractFirstJsonArray(raw) {
  const match = /```json\s*([\s\S]*?)```/.exec(raw);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadPitches() {
  const items = [];
  for (const f of listMarkdown("pitches")) {
    const date = f.replace(/\.md$/, "");
    const raw = readFileSync(join(PROJECT_ROOT, "pitches", f), "utf8");
    for (const p of extractFirstJsonArray(raw)) {
      items.push({ ...p, date, path: `pitches/${f}` });
    }
  }
  return items;
}

function loadArticles(dir) {
  return listMarkdown(dir).map((f) => {
    const raw = readFileSync(join(PROJECT_ROOT, dir, f), "utf8");
    const fm = parseFrontMatter(raw);
    const heading = /^#\s+(.+)$/m.exec(raw);
    return {
      slug: f.replace(/\.md$/, ""),
      path: `${dir}/${f}`,
      title: fm.title || (heading ? heading[1].trim() : f),
      pillar: fm.pillar || null,
      channels: Array.isArray(fm.channels) ? fm.channels : [],
      status: fm.status || (dir === "published" ? "published" : "review"),
      date: fm.published_at || fm.publishedAt || fm.created_at || fm.createdAt || f.slice(0, 10),
      wordCount: fm.wordCount || null,
      metrics: fm.metrics && typeof fm.metrics === "object" ? fm.metrics : null
    };
  });
}

function loadEpisodes() {
  const root = join(PROJECT_ROOT, "episodes");
  if (!existsSync(root)) return [];
  const items = [];
  for (const month of readdirSync(root).sort().reverse()) {
    const monthDir = join(root, month);
    if (!/^\d{4}-\d{2}$/.test(month) || !statSync(monthDir).isDirectory()) continue;
    for (const slug of readdirSync(monthDir).sort()) {
      const scenesPath = join(monthDir, slug, "scenes.json");
      if (!existsSync(scenesPath)) continue;
      try {
        const s = JSON.parse(readFileSync(scenesPath, "utf8"));
        const scenes = Array.isArray(s.scenes) ? s.scenes : [];
        items.push({
          slug: s.slug || slug,
          month,
          path: `episodes/${month}/${slug}/scenes.json`,
          title: s.title || slug,
          pillar: s.pillar || null,
          aspect: s.aspect || "16:9",
          theme: s.theme || null,
          status: s.status || "archived",
          totalDuration: Number(s.totalDuration || 0),
          sceneCount: scenes.length,
          renderPath: s.renderPath || null,
          scenes: scenes.map((sc) => ({
            id: sc.id,
            startTime: sc.startTime,
            duration: sc.duration,
            headline: sc.headline,
            visualMetaphor: sc.visualMetaphor
          }))
        });
      } catch {
        // malformed scenes.json; skip so one bad episode does not blank the board
      }
    }
  }
  return items;
}

function loadVoiceStats() {
  const count = (rel, pattern) => {
    const abs = join(PROJECT_ROOT, rel);
    if (!existsSync(abs)) return 0;
    return (readFileSync(abs, "utf8").match(pattern) || []).length;
  };
  return {
    antiSlopRules: count("voice/anti-slop-rewrites.md", /^\s*(?:\d+\.|-)\s+\*\*/gm),
    deepEssaySamples: count("voice/golden-samples/deep-essay-samples.md", /^##\s+/gm),
    punchySocialSamples: count("voice/golden-samples/punchy-social-samples.md", /^##\s+/gm)
  };
}

function computePillarBalance(items) {
  const counts = { P1: 0, P2: 0, P3: 0 };
  for (const it of items) {
    if (it.pillar && counts[it.pillar] !== undefined) counts[it.pillar] += 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return DEFAULT_PILLARS.map((p) => {
    const actualPct = total > 0 ? Number(((counts[p.id] / total) * 100).toFixed(1)) : 0;
    return {
      ...p,
      count: counts[p.id],
      actualPct,
      driftPct: total > 0 ? Number((actualPct - p.targetPct).toFixed(1)) : 0
    };
  });
}

function buildSnapshot() {
  const pitches = loadPitches();
  const drafts = loadArticles("drafts");
  const published = loadArticles("published");
  const episodes = loadEpisodes();
  const voice = loadVoiceStats();

  const pendingPitches = pitches.filter((p) => p.status === "pending");
  const totalViews = published.reduce((sum, a) => sum + Number(a.metrics?.views || 0), 0);
  const totalLeads = published.reduce((sum, a) => sum + Number(a.metrics?.leads || 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    stats: {
      pendingPitches: pendingPitches.length,
      draftsInReview: drafts.filter((d) => d.status === "review").length,
      episodesCount: episodes.length,
      videoMinutes: Number((episodes.reduce((s, e) => s + e.totalDuration, 0) / 60).toFixed(1)),
      publishedCount: published.length,
      totalViews,
      totalLeads
    },
    pillarBalance: computePillarBalance([...pitches, ...drafts, ...published, ...episodes]),
    pitches,
    drafts,
    published,
    episodes,
    voice
  };
}

function refreshDashboard() {
  const snapshot = buildSnapshot();
  writeFileSync(join(PROJECT_ROOT, "dashboard-data.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

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
    writeFileSync(
      htmlPath,
      html.replace(/<!-- MUNK_DASHBOARD_DATA_START -->[\s\S]*?<!-- MUNK_DASHBOARD_DATA_END -->/, replacement),
      "utf8"
    );
  }
  return snapshot;
}

const [, , cmd = "refresh"] = process.argv;
if (cmd !== "refresh") {
  console.error(`Unknown command: ${cmd}. Use: refresh`);
  process.exit(1);
}
const snap = refreshDashboard();
console.log(JSON.stringify({ ok: true, updated: ["dashboard-data.json", "dashboard.html"], stats: snap.stats }, null, 2));
