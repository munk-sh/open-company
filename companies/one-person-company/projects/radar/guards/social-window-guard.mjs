#!/usr/bin/env node
/**
 * Social Window Guard (Zero-Token Preflight Guard for `social-patrol`)
 *
 * 在唤醒公司 Agent 浏览器执行社媒巡检前进行 0 Token 门禁检查：
 * 1. 检查 `../watchlist.json` 中是否存在 `enabled: true` 的 `social_channels`；
 * 2. 检查当前本地时间是否处于活跃窗口（默认 08:00 - 22:00，避免半夜唤醒浏览器白耗 Token 及触发平台反爬）；
 * 3. 检查距离上次社媒巡检是否已达到冷却间隔（`cooldown_minutes`，默认 210 分钟）；
 * 4. 通过后生成 `../.state/active-social-targets.json` 供 Agent 按序串行巡检，并 exit 0。
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, "..");
const WATCHLIST_PATH = path.join(PROJECT_DIR, "watchlist.json");
const STATE_DIR = path.join(PROJECT_DIR, ".state");
const SOCIAL_STATE_PATH = path.join(STATE_DIR, "social-patrol-state.json");
const ACTIVE_TARGETS_PATH = path.join(STATE_DIR, "active-social-targets.json");
const PENDING_SIGNALS_PATH = path.join(STATE_DIR, "pending-signals.json");

async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function main() {
  const forceTrigger = process.env.RADAR_FORCE_TRIGGER === "1";
  const watchlist = await readJsonSafe(WATCHLIST_PATH, null);
  if (!watchlist) {
    process.exit(1);
  }

  const enabledChannels = (watchlist.social_channels || []).filter(
    (ch) => ch && ch.enabled === true
  );
  if (enabledChannels.length === 0) {
    process.exit(1);
  }

  const windowCfg = watchlist.social_window || {};
  const startHour = windowCfg.active_hours_start ?? 8;
  const endHour = windowCfg.active_hours_end ?? 22;
  const cooldownMinutes = windowCfg.cooldown_minutes ?? 210;

  const now = new Date();
  const currentHour = now.getHours();

  if (!forceTrigger && (currentHour < startHour || currentHour > endHour)) {
    process.exit(1);
  }

  await fs.mkdir(STATE_DIR, { recursive: true });
  const state = await readJsonSafe(SOCIAL_STATE_PATH, { lastPatrolAt: null });

  if (!forceTrigger && state.lastPatrolAt) {
    const elapsedMinutes = (now.getTime() - new Date(state.lastPatrolAt).getTime()) / 60_000;
    if (Number.isFinite(elapsedMinutes) && elapsedMinutes < cooldownMinutes) {
      process.exit(1);
    }
  }

  const recentPublicSignals = await readJsonSafe(PENDING_SIGNALS_PATH, { items: [] });
  const crossCheckTopics = (recentPublicSignals.items || [])
    .slice(0, 5)
    .map((item) => ({
      title: item.title,
      url: item.url,
      sourceName: item.sourceName
    }));

  await fs.writeFile(
    ACTIVE_TARGETS_PATH,
    JSON.stringify(
      {
        preparedAt: now.toISOString(),
        profile: watchlist.profile || {},
        keywords: watchlist.keywords || {},
        channelsInOrder: enabledChannels,
        crossCheckFromPublicSignals: crossCheckTopics
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    SOCIAL_STATE_PATH,
    JSON.stringify(
      {
        lastPatrolAt: now.toISOString(),
        enabledChannelIds: enabledChannels.map((c) => c.id)
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
