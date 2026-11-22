#!/usr/bin/env node
/**
 * Radar Sentinel (Zero-Token Preflight Guard for `public-signal-scan`)
 *
 * 读取本项目的 `watchlist.json` 中的 `public_sources`，拉取公开免鉴权接口与 RSS/Atom，
 * 对照本项目的 `.state/seen-items.json` 去重并按关键词加权过滤。
 *
 * 退出码协议（严格遵循 0 唤醒 / 1 跳过 / 2 报错）：
 * - 0：至少一个外部源成功返回且发现新信号，已写入 `.state/pending-signals.json`（唤醒 Agent 深挖与评级）
 * - 1：至少一个外部源成功返回，但无新信号（0 Token 静默跳过）
 * - 2：配置缺失/损坏、未捕获异常，或全部外部源抓取失败（向 stderr 输出明确原因，绝不伪装成 1）
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

const EXIT_TRIGGER = 0;
const EXIT_SKIP = 1;
const EXIT_ERROR = 2;

function fail(message) {
  process.stderr.write(`[radar-sentinel] ${message}\n`);
  process.exit(EXIT_ERROR);
}

async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function loadWatchlist() {
  let raw;
  try {
    raw = await fs.readFile(WATCHLIST_PATH, "utf8");
  } catch (error) {
    fail(`无法读取 watchlist.json（${WATCHLIST_PATH}）：${error.message}`);
  }

  let watchlist;
  try {
    watchlist = JSON.parse(raw);
  } catch (error) {
    fail(`watchlist.json 不是合法 JSON：${error.message}`);
  }

  if (!watchlist || typeof watchlist !== "object" || Array.isArray(watchlist)) {
    fail("watchlist.json 结构损坏：根节点必须是对象");
  }
  return watchlist;
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
    process.exit(EXIT_TRIGGER);
  }

  const watchlist = await loadWatchlist();

  await fs.mkdir(STATE_DIR, { recursive: true });
  const seenState = await readJsonSafe(SEEN_PATH, { ids: [] });
  const seenSet = new Set(Array.isArray(seenState.ids) ? seenState.ids : []);

  const enabledSources = (watchlist.public_sources || []).filter((s) => s.enabled !== false);
  if (enabledSources.length === 0) {
    fail("watchlist.json 未声明任何启用的 public_sources");
  }

  const candidates = [];
  const sourceErrors = [];
  let succeededSources = 0;

  for (const source of enabledSources) {
    try {
      let fetched = [];
      if (source.type === "hn_top" || source.type === "hn_show") {
        fetched = await fetchHnList(source.type, source.min_score ?? 80, source.limit ?? 15);
      } else if (source.type === "rss" && source.url) {
        fetched = await fetchRssSource(source);
      } else {
        throw new Error(`不支持的源类型：${source.type ?? "(缺失)"}`);
      }
      succeededSources += 1;

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
    } catch (error) {
      // 单个源失败只记录原因，不阻断其余源巡检；全部失败才升级为错误退出
      sourceErrors.push(`${source.id ?? "(未命名)"}: ${error?.message ?? error}`);
    }
  }

  if (succeededSources === 0) {
    fail(
      `全部 ${enabledSources.length} 个外部源抓取失败：\n${sourceErrors.map((line) => `  - ${line}`).join("\n")}`
    );
  }
  if (sourceErrors.length > 0) {
    process.stderr.write(
      `[radar-sentinel] 警告：${sourceErrors.length}/${enabledSources.length} 个源抓取失败，继续使用其余源结果：\n${sourceErrors
        .map((line) => `  - ${line}`)
        .join("\n")}\n`
    );
  }

  if (candidates.length === 0) {
    process.exit(EXIT_SKIP);
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

  process.exit(EXIT_TRIGGER);
}

main().catch((error) => {
  process.stderr.write(`[radar-sentinel] 未捕获异常：${error?.stack ?? error}\n`);
  process.exit(EXIT_ERROR);
});
