#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

function parseTopics() {
  const topicsDir = join(PROJECT_ROOT, "topics");
  if (!existsSync(topicsDir)) return [];
  const files = readdirSync(topicsDir).filter((f) => f.endsWith(".md") && f !== "_index.md");
  return files.map((f) => {
    const raw = readFileSync(join(topicsDir, f), "utf8");
    const titleMatch = /^#\s+(.+)$/m.exec(raw);
    const thesisMatch = />\s*\*\*核心判断[^*]*\*\*：([^\n]+)/.exec(raw) || />\s*([^\n]+)/.exec(raw);
    const bulletMatches = raw.match(/^-\s+\*\*[^*]+\*\*/gm) || [];
    return {
      id: f.replace(/\.md$/, ""),
      filename: f,
      path: `topics/${f}`,
      title: titleMatch ? titleMatch[1].trim() : f,
      coreThesis: thesisMatch ? thesisMatch[1].trim() : "持续生长的领域常青认知卡",
      evidenceCount: bulletMatches.length || 3
    };
  });
}

function parseSparks() {
  const sparksPath = join(PROJECT_ROOT, "sparks.md");
  if (!existsSync(sparksPath)) return [];
  const raw = readFileSync(sparksPath, "utf8");
  const lines = raw.split(/\r?\n/);
  const items = [];
  let current = null;

  for (const line of lines) {
    const headerMatch = /^-\s+\*\*\[(SPARK-[A-Z0-9-]+)\]\s*(.+?)\*\*/.exec(line.trim());
    if (headerMatch) {
      if (current) items.push(current);
      const id = headerMatch[1];
      current = {
        id,
        target: id.startsWith("SPARK-W") ? "wealth" : "studio",
        title: headerMatch[2].trim(),
        angle: "",
        evidence: "",
        channels: "",
        status: "ready"
      };
      continue;
    }
    if (current) {
      const angleM = /^-\s+\*\*(?:切入立意|切入逻辑)\*\*：(.+)/.exec(line.trim());
      if (angleM) current.angle = angleM[1].trim();
      const evM = /^-\s+\*\*(?:支撑弹药|支撑依据)\*\*：(.+)/.exec(line.trim());
      if (evM) current.evidence = evM[1].trim();
      const chM = /^-\s+\*\*建议渠道\*\*：(.+)/.exec(line.trim());
      if (chM) current.channels = chM[1].trim();
      const stM = /^-\s+\*\*状态\*\*：`?([^`]+)`?/.exec(line.trim());
      if (stM) current.status = stM[1].trim();
    }
  }
  if (current) items.push(current);
  return items;
}

function parsePrinciples() {
  const pPath = join(PROJECT_ROOT, "principles.md");
  if (!existsSync(pPath)) return [];
  const raw = readFileSync(pPath, "utf8");
  const matches = [...raw.matchAll(/^\d+\.\s+\*\*(.+?)\*\*/gm)];
  return matches.map((m, idx) => ({
    index: idx + 1,
    title: m[1].trim()
  }));
}

function checkInbox() {
  const inboxDir = join(PROJECT_ROOT, "inbox");
  if (!existsSync(inboxDir)) return { pendingCount: 0, files: [] };
  const files = readdirSync(inboxDir).filter(
    (f) => !f.startsWith(".") && f.toLowerCase() !== "readme.md" && f !== "archive"
  );
  return {
    pendingCount: files.length,
    files
  };
}

function buildSnapshot() {
  const topics = parseTopics();
  const sparks = parseSparks();
  const principles = parsePrinciples();
  const inbox = checkInbox();

  return {
    generatedAt: new Date().toISOString(),
    stats: {
      topicsCount: topics.length,
      studioSparksCount: sparks.filter((s) => s.target === "studio").length,
      wealthSparksCount: sparks.filter((s) => s.target === "wealth").length,
      principlesCount: principles.length,
      inboxPendingCount: inbox.pendingCount
    },
    topics,
    sparks,
    principles,
    inbox
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
