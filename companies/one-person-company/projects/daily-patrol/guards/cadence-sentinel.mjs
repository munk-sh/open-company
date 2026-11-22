#!/usr/bin/env node

/**
 * 晨夕节律守卫（Cadence Sentinel）
 * 零 Token 快速预检：
 * 1. 08:00 后若今日早报 (briefs/YYYY-MM-DD.md) 缺失 -> exit 0 (唤醒)
 * 2. 21:00 后若今日晚报 (reviews/YYYY-MM-DD.md) 缺失 -> exit 0 (唤醒)
 * 3. 若今日 MIT 有被阻塞 (status: "blocked") 且未被处理 -> exit 0 (唤醒)
 * 4. 否则 -> exit 1 (静默跳过)
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const today = getTodayString();
const currentHour = new Date().getHours();

const briefPath = join(PROJECT_ROOT, "briefs", `${today}.md`);
const reviewPath = join(PROJECT_ROOT, "reviews", `${today}.md`);
const mitsPath = join(PROJECT_ROOT, "daily-mits.json");

// 1. 晨报检查 (8:00 - 12:00 期间如果还没早报，必须立刻唤醒生成)
if (currentHour >= 8 && !existsSync(briefPath)) {
  console.log(`[cadence-sentinel] 08:00 晨报缺失 (${briefPath}) -> 唤醒执行`);
  process.exit(0);
}

// 2. 晚报检查 (21:00 以后如果还没晚报，必须唤醒复盘)
if (currentHour >= 21 && !existsSync(reviewPath)) {
  console.log(`[cadence-sentinel] 21:00 晚报缺失 (${reviewPath}) -> 唤醒执行`);
  process.exit(0);
}

// 3. 阻塞检查 (如果有 MIT 标记为 blocked)
if (existsSync(mitsPath)) {
  try {
    const data = JSON.parse(readFileSync(mitsPath, "utf8"));
    const blockedMit = (data.mits || []).find((m) => m.status === "blocked");
    if (blockedMit) {
      console.log(`[cadence-sentinel] 发现被阻塞的 MIT: ${blockedMit.title} -> 唤醒处理`);
      process.exit(0);
    }
  } catch {
    // ignore parse error
  }
}

// 全部正常，静默跳过
console.log(`[cadence-sentinel] 节律运转正常，无需唤醒 (${today} ${currentHour}:00)`);
process.exit(1);
