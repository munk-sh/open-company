#!/usr/bin/env node
/**
 * Radar Sentinel (Zero-Token Preflight Guard for `signal-watch`)
 *
 * 读取 `../watchlist.json` 中的 `public_sources`，拉取公开免鉴权接口与 RSS/Atom，
 * 对照 `../.state/seen-items.json` 去重并按关键词加权过滤：
 * - 有新信号：写入 `../.state/pending-signals.json` 并 exit 0（唤醒 Agent 深挖与评级）
 * - 无新信号：直接 exit 1（0 Token 静默跳过）
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, "..");
const WATCHLIST_PATH = path.join(PROJECT_DIR, "watchlist.json");
const STATE_DIR = path.join(PROJECT_DIR, ".state");
const SEEN_PATH = path.join(STATE_DIR, "seen-items.json");
const PENDING_PATH = path.join(STATE_DIR, "pending-signals.json");

const FETCH_TIMEOUT_MS = 10_000;
const MAX_SEEN_IDS = 1500;

async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "MunkAI-OpenCompany-Radar/1.0",
      accept: "application/json, application/xml, text/xml, text/html, */*"
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

async function fetchHnList(kind, minScore = 80, limit = 15) {
  const endpoint =
    kind === "hn_show"
      ? "https://hacker-news.firebaseio.com/v0/showstories.json"
      : "https://hacker-news.firebaseio.com/v0/topstories.json";
  const ids = JSON.parse(await fetchText(endpoint)).slice(0, limit * 2);
  const items = await Promise.all(
    ids.slice(0, limit).map(async (id) => {
      try {
        const raw = await fetchText(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
  );

  return items
    .filter((item) => item && item.title && (item.score ?? 0) >= minScore)
    .map((item) => ({
      uid: `hn:${item.id}`,
      sourceId: kind,
      title: item.title,
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      discussionUrl: `https://news.ycombinator.com/item?id=${item.id}`,
      score: item.score ?? 0,
      commentsCount: item.descendants ?? 0,
      publishedAt: item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString()
    }));
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAtomLink(block) {
  const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  return hrefMatch ? hrefMatch[1].trim() : extractTag(block, "link");
}

async function fetchRssSource(source) {
  const xml = await fetchText(source.url);
  const limit = source.limit ?? 10;
  const isAtom = /<feed[\s>]/i.test(xml);
  const blockRegex = isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi;
  const blocks = (xml.match(blockRegex) || []).slice(0, limit);

  return blocks
    .map((block) => {
      const title = extractTag(block, "title");
      const link = isAtom ? extractAtomLink(block) : extractTag(block, "link");
      const summary = extractTag(block, isAtom ? "summary" : "description").slice(0, 280);
      const id = extractTag(block, isAtom ? "id" : "guid") || link || title;
      if (!title || !link) return null;
      return {
        uid: `rss:${source.id}:${id}`,
        sourceId: source.id,
        sourceName: source.name,
        title,
        url: link,
        summary,
        publishedAt:
          extractTag(block, isAtom ? "updated" : "pubDate") || new Date().toISOString()
      };
    })
    .filter(Boolean);
}

function evaluateKeywords(item, keywords) {
  const haystack = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
  const muteList = (keywords?.mute || []).map((k) => k.toLowerCase());
  if (muteList.some((kw) => kw && haystack.includes(kw))) {
    return { muted: true, matchedBoost: [] };
  }
  const boostList = keywords?.boost || [];
  const matchedBoost = boostList.filter((kw) => kw && haystack.includes(kw.toLowerCase()));
  return { muted: false, matchedBoost };
}

async function main() {
  if (process.env.RADAR_FORCE_TRIGGER === "1") {
    process.exit(0);
  }

  const watchlist = await readJsonSafe(WATCHLIST_PATH, null);
  if (!watchlist) {
    process.exit(1);
  }

  await fs.mkdir(STATE_DIR, { recursive: true });
  const seenState = await readJsonSafe(SEEN_PATH, { ids: [] });
  const seenSet = new Set(Array.isArray(seenState.ids) ? seenState.ids : []);

  const enabledSources = (watchlist.public_sources || []).filter((s) => s.enabled !== false);
  const candidates = [];

  for (const source of enabledSources) {
    try {
      let fetched = [];
      if (source.type === "hn_top" || source.type === "hn_show") {
        fetched = await fetchHnList(source.type, source.min_score ?? 80, source.limit ?? 15);
      } else if (source.type === "rss" && source.url) {
        fetched = await fetchRssSource(source);
      }

      for (const item of fetched) {
        if (seenSet.has(item.uid)) continue;
        const { muted, matchedBoost } = evaluateKeywords(item, watchlist.keywords);
        if (muted) {
          seenSet.add(item.uid);
          continue;
        }
        candidates.push({
          ...item,
          sourceName: source.name || source.id,
          matchedBoost,
          priorityScore: (matchedBoost.length * 50) + (item.score ? Math.min(item.score, 300) : 30)
        });
      }
    } catch {
      // 单个源网络抖动不阻断其余源巡检
    }
  }

  if (candidates.length === 0) {
    process.exit(1);
  }

  candidates.sort((a, b) => b.priorityScore - a.priorityScore);
  const topCandidates = candidates.slice(0, 20);

  for (const item of topCandidates) {
    seenSet.add(item.uid);
  }

  const updatedIds = Array.from(seenSet).slice(-MAX_SEEN_IDS);
  await fs.writeFile(
    SEEN_PATH,
    JSON.stringify({ updatedAt: new Date().toISOString(), ids: updatedIds }, null, 2),
    "utf8"
  );

  await fs.writeFile(
    PENDING_PATH,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        profile: watchlist.profile || {},
        totalNewCount: candidates.length,
        items: topCandidates
      },
      null,
      2
    ),
    "utf8"
  );

  process.exit(0);
}

main().catch(() => {
  process.exit(1);
});
