#!/usr/bin/env node

/**
 * 财富与搞钱部门 (wealth) 零 Token 复合守卫
 * Exit 0: 检测到待评估搞钱火花、ledger/inbox 新账单、5天内临期续费订阅或到期催收商单，唤醒任务
 * Exit 1: 无变化，安静跳过
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const PROJECTS_ROOT = resolve(PROJECT_ROOT, "..");

function formatLocalDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resolveSiblingProjectDir(specId, titleKeyword) {
  const direct = join(PROJECTS_ROOT, specId);
  if (existsSync(direct)) return direct;
  try {
    for (const entry of readdirSync(PROJECTS_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const candidate = join(PROJECTS_ROOT, entry.name);
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

function collectHandledWealthSparks() {
  const seen = new Set();
  const dealsPath = join(PROJECT_ROOT, "deals-and-offers.md");
  if (existsSync(dealsPath)) {
    for (const m of readFileSync(dealsPath, "utf8").matchAll(/\bSPARK-W\d+\b/gi)) {
      seen.add(m[0].toUpperCase());
    }
  }
  const expDir = join(PROJECT_ROOT, "experiments");
  if (existsSync(expDir)) {
    for (const f of readdirSync(expDir)) {
      if (!f.endsWith(".md") || f.toLowerCase() === "readme.md") continue;
      for (const m of readFileSync(join(expDir, f), "utf8").matchAll(/\bSPARK-W\d+\b/gi)) {
        seen.add(m[0].toUpperCase());
      }
    }
  }
  return seen;
}

function hasOpenWealthSparks() {
  const sparksPath = join(resolveSiblingProjectDir("brain", "第二大脑"), "sparks.md");
  if (!existsSync(sparksPath)) return false;
  const handled = collectHandledWealthSparks();
  const content = readFileSync(sparksPath, "utf8");
  const wealthSection = content.split(/##\s+二、/)[1]?.split(/##\s+三、/)[0] || content;
  const entries = wealthSection.split(/^- \*\*\[/m).slice(1);
  for (const entry of entries) {
    const idMatch = /^(SPARK-W\d+)\]/i.exec(entry);
    if (!idMatch) continue;
    const sparkId = idMatch[1].toUpperCase();
    const isOpen = /状态\*\*：\s*`?(待评估|待认领|ready|open)/i.test(entry);
    if (isOpen && !handled.has(sparkId)) {
      return true;
    }
  }
  return false;
}

function hasInboxBills() {
  const inboxDir = join(PROJECT_ROOT, "ledger", "inbox");
  if (!existsSync(inboxDir)) return false;
  const files = readdirSync(inboxDir).filter(
    (f) =>
      !f.startsWith(".") &&
      f.toLowerCase() !== "readme.md" &&
      !f.endsWith(".processed") &&
      /\.(csv|tsv|json|txt)$/i.test(f)
  );
  return files.length > 0;
}

function hasUpcomingSubscriptionAlerts() {
  const subPath = join(PROJECT_ROOT, "ledger", "subscriptions.json");
  if (!existsSync(subPath)) return false;
  try {
    const raw = JSON.parse(readFileSync(subPath, "utf8"));
    const nowMs = Date.now();
    return (raw.items || []).some((item) => {
      if (!item.autoRenewAlert && !item.vampireRisk) return false;
      const nextMs = new Date(`${item.nextBillingDate}T00:00:00+08:00`).getTime();
      const days = Math.ceil((nextMs - nowMs) / (1000 * 60 * 60 * 24));
      return days >= -3 && days <= 5;
    });
  } catch {
    return false;
  }
}

function hasDueDeals() {
  const dealsPath = join(PROJECT_ROOT, "deals-and-offers.md");
  if (!existsSync(dealsPath)) return false;
  const raw = readFileSync(dealsPath, "utf8");
  const match = /```json\s*([\s\S]*?)```/.exec(raw);
  if (!match) return false;
  try {
    const items = JSON.parse(match[1]);
    const today = formatLocalDate();
    return items.some(
      (d) =>
        d.stage !== "killed" &&
        d.stage !== "closed" &&
        typeof d.reviewDate === "string" &&
        d.reviewDate <= today
    );
  } catch {
    return false;
  }
}

const reasons = [];
if (hasOpenWealthSparks()) reasons.push("open SPARK-W* in ../brain/sparks.md");
if (hasInboxBills()) reasons.push("unprocessed bill file(s) in ledger/inbox/");
if (hasUpcomingSubscriptionAlerts()) reasons.push("vampire/auto-renew subscription due within 5 days");
if (hasDueDeals()) reasons.push("active deal/experiment reached reviewDate");

if (reasons.length > 0) {
  console.log(`[deal-sentinel] Waking wealth agent: ${reasons.join("; ")}`);
  process.exit(0);
}

console.log("[deal-sentinel] No new wealth triggers; skipping.");
process.exit(1);
