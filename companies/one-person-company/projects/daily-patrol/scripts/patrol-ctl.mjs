#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const PROJECTS_ROOT = resolve(PROJECT_ROOT, "..");

function resolveSiblingProjectDir(specId, titleKeyword) {
  const direct = join(PROJECTS_ROOT, specId);
  if (existsSync(direct)) return direct;
  if (!existsSync(PROJECTS_ROOT)) return direct;
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
    // ignore scan errors and fall back to direct path
  }
  return direct;
}

function parseFlags(args) {
  const flags = {};
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq > 0) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        flags[arg.slice(2)] = true;
      }
    }
  }
  return flags;
}

function getTodayString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadJson(filePath, fallback = null) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function scanSiblingDepartments() {
  const radarDir = resolveSiblingProjectDir("radar", "情报雷达");
  const brainDir = resolveSiblingProjectDir("brain", "第二大脑");
  const studioDir = resolveSiblingProjectDir("studio", "内容工坊");
  const wealthDir = resolveSiblingProjectDir("wealth", "财富与搞钱");

  const radarData = loadJson(join(radarDir, "dashboard-data.json"), {});
  const brainData = loadJson(join(brainDir, "dashboard-data.json"), {});
  const studioData = loadJson(join(studioDir, "dashboard-data.json"), {});
  const wealthData = loadJson(join(wealthDir, "dashboard-data.json"), {});

  const radarSignalsCount =
    (Number(radarData.stats?.publicSignalsCount) || 0) +
    (Number(radarData.stats?.socialArbitrageCount) || 0) ||
    Number(radarData.summary?.totalSignals) ||
    0;
  const radarHighImpactCount =
    Number(radarData.stats?.sTierCount) || Number(radarData.summary?.highImpact) || 0;
  const latestSignal =
    radarData.publicSignals?.[0] ||
    radarData.topSignals?.[0] || { title: "监控中，暂无异常异动" };

  const sparksCount = Array.isArray(brainData.sparks)
    ? brainData.sparks.length
    : (Number(brainData.stats?.studioSparksCount) || 0) +
      (Number(brainData.stats?.wealthSparksCount) || 0) ||
      Number(brainData.summary?.totalSparks) ||
      0;
  const topicsCount =
    Number(brainData.stats?.topicsCount) ||
    (Array.isArray(brainData.topics) ? brainData.topics.length : 0) ||
    Number(brainData.summary?.totalTopics) ||
    0;
  const rawThesis =
    brainData.topics?.[0]?.coreThesis ||
    brainData.principles?.[0]?.title ||
    brainData.weeklyPrinciple?.quote ||
    "少即是多，长期主义。";
  const weeklyPrinciple = String(rawThesis).replace(/^[“"]+|[”"]+$/g, "");

  const readyCount =
    Number(studioData.stats?.draftsInReview) ||
    (Array.isArray(studioData.drafts) ? studioData.drafts.length : 0) ||
    Number(studioData.summary?.readyCount) ||
    0;
  const draftsCount =
    (Number(studioData.stats?.pendingPitches) || 0) + readyCount ||
    Number(studioData.summary?.draftsCount) ||
    0;
  const publishedCount =
    Number(studioData.stats?.publishedCount) ||
    (Array.isArray(studioData.published) ? studioData.published.length : 0) ||
    Number(studioData.summary?.publishedCount) ||
    0;
  const latestReady =
    studioData.drafts?.[0] || studioData.pipeline?.ready?.[0] || null;

  return {
    radar: {
      status: "healthy",
      name: "📡 情报雷达",
      signalsCount: radarSignalsCount,
      highImpactCount: radarHighImpactCount,
      latestSignal
    },
    brain: {
      status: "healthy",
      name: "🧠 第二大脑",
      sparksCount,
      topicsCount,
      weeklyPrinciple
    },
    studio: {
      status: "healthy",
      name: "🎨 内容工坊",
      draftsCount,
      readyCount,
      publishedCount,
      latestReady
    },
    wealth: {
      status: "healthy",
      name: "💰 财富与搞钱",
      netWorthCNY: Number(wealthData.portfolio?.netWorthCNY) || 0,
      runwayMonths: Number(wealthData.portfolio?.runwayMonths) || 0,
      monthNetCashflowCNY: Number(wealthData.cashflow?.netCashflowCNY) || 0,
      pendingArCNY: Number(wealthData.deals?.pendingArCNY) || 0,
      activePipelineValueCNY:
        Number(wealthData.deals?.activeExpectedCNY) ||
        Number(wealthData.deals?.activePipelineValueCNY) ||
        0
    }
  };
}

function loadMits(today) {
  const mitsPath = join(PROJECT_ROOT, "daily-mits.json");
  let data = loadJson(mitsPath);
  if (!data || !Array.isArray(data.mits)) {
    data = {
      date: today,
      mits: [],
      stats: { total: 0, done: 0, in_progress: 0, blocked: 0, completionRatePct: 0 }
    };
    writeFileSync(mitsPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  const mits = data.mits || [];
  const done = mits.filter((m) => m.status === "done").length;
  const inProgress = mits.filter((m) => m.status === "in_progress").length;
  const blocked = mits.filter((m) => m.status === "blocked").length;
  const total = mits.length;
  data.stats = {
    total,
    done,
    in_progress: inProgress,
    blocked,
    completionRatePct: total ? Math.round((done / total) * 100) : 0
  };
  return data;
}

function loadRulesEvolution() {
  const filePath = join(PROJECT_ROOT, "rules-evolution.md");
  if (!existsSync(filePath)) {
    return { mergedCount: 2, proposedCount: 2, items: [] };
  }
  const raw = readFileSync(filePath, "utf8");
  const items = [];
  const rx = /###\s*(?:1\.\s*已合并.*?|2\.\s*观察期候选.*?)\s*\n([\s\S]*?)(?=(?:###|\n---|$))/g;
  let match;
  let mergedCount = 0;
  let proposedCount = 0;

  const ruleRx = /-\s*\*\*`([^`]+)`\s*·\s*([^*]+)\*\*\s*\n([\s\S]*?)(?=(?:-\s*\*\*`|$))/g;
  let rMatch;
  while ((rMatch = ruleRx.exec(raw)) !== null) {
    const code = rMatch[1];
    const title = rMatch[2].trim();
    const body = rMatch[3];
    const deptMatch = /-\s*\*\*部门\*\*：`?([^`\n]+)`?/m.exec(body);
    const statusMatch = /-\s*\*\*状态\*\*：`?([^`\n]+)`?/m.exec(body);
    const status = statusMatch ? statusMatch[1].trim() : code.includes("MERGED") ? "MERGED" : "PROPOSED";
    if (status === "MERGED") mergedCount++;
    else proposedCount++;

    items.push({
      code,
      title,
      department: deptMatch ? deptMatch[1].trim() : "general",
      status,
      summary: body.trim().split("\n")[0].replace(/^-\s*/, "")
    });
  }

  return { mergedCount, proposedCount, totalCount: items.length, items };
}

function loadBriefsAndReviews(today) {
  const briefsDir = join(PROJECT_ROOT, "briefs");
  const reviewsDir = join(PROJECT_ROOT, "reviews");
  mkdirSync(briefsDir, { recursive: true });
  mkdirSync(reviewsDir, { recursive: true });

  const listBriefs = readdirSync(briefsDir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse()
    .map((f) => ({
      date: f.replace(".md", ""),
      file: `briefs/${f}`,
      isToday: f.replace(".md", "") === today
    }));

  const listReviews = readdirSync(reviewsDir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse()
    .map((f) => ({
      date: f.replace(".md", ""),
      file: `reviews/${f}`,
      isToday: f.replace(".md", "") === today
    }));

  const todayBriefPath = join(briefsDir, `${today}.md`);
  const todayReviewPath = join(reviewsDir, `${today}.md`);

  const todayBriefRaw = existsSync(todayBriefPath) ? readFileSync(todayBriefPath, "utf8") : "";
  const todayReviewRaw = existsSync(todayReviewPath) ? readFileSync(todayReviewPath, "utf8") : "";

  return {
    listBriefs,
    listReviews,
    todayBrief: { exists: Boolean(todayBriefRaw), raw: todayBriefRaw },
    todayReview: { exists: Boolean(todayReviewRaw), raw: todayReviewRaw }
  };
}

function computeRhythmPhase() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) {
    return {
      phase: "morning_brief",
      label: "🌅 晨会拍板时段",
      desc: "聚焦 3 分钟一页纸早报，确认今日 3 大必赢战役 (MITs)"
    };
  }
  if (hour >= 10 && hour < 20) {
    return {
      phase: "day_execution",
      label: "🚀 白天协同作战",
      desc: "静默推进，各部门按任务钟自主运转，守护无被打扰心流"
    };
  }
  if (hour >= 20 && hour <= 23) {
    return {
      phase: "night_retro",
      label: "🌙 晚间复盘进化",
      desc: "盘点 MIT 履约得失，沉淀人类真实决策偏好至 AGENTS.md"
    };
  }
  return {
    phase: "night_quiet",
    label: "🌌 夜间深度蓄能",
    desc: "系统低频待机，雷达守卫零 Token 持续巡航"
  };
}

function refreshDashboard(customToday = null) {
  const today = customToday || getTodayString();
  const rhythm = computeRhythmPhase();
  const siblings = scanSiblingDepartments();
  const mitsData = loadMits(today);
  const rules = loadRulesEvolution();
  const archives = loadBriefsAndReviews(today);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    today,
    rhythm,
    company: {
      name: "一人公司 · 超级个体",
      enName: "One-Person Company",
      owner: "CEO (Human) + Munk AI",
      status: "🟢 稳健运转中"
    },
    mits: mitsData,
    departments: siblings,
    rules,
    archives: {
      briefs: archives.listBriefs,
      reviews: archives.listReviews,
      todayBrief: archives.todayBrief,
      todayReview: archives.todayReview
    }
  };

  const jsonPath = join(PROJECT_ROOT, "dashboard-data.json");
  writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), "utf8");

  const htmlPath = join(PROJECT_ROOT, "dashboard.html");
  if (existsSync(htmlPath)) {
    let html = readFileSync(htmlPath, "utf8");
    const jsonStr = JSON.stringify(snapshot);
    const replacement = `<!-- MUNK_DASHBOARD_DATA_START --><script id="munk-dashboard-data">window.__DASHBOARD_DATA__ = ${jsonStr};</script><!-- MUNK_DASHBOARD_DATA_END -->`;
    if (html.includes("<!-- MUNK_DASHBOARD_DATA_START -->")) {
      html = html.replace(/<!-- MUNK_DASHBOARD_DATA_START -->[\s\S]*?<!-- MUNK_DASHBOARD_DATA_END -->/, replacement);
    } else {
      html = html.replace("</head>", `${replacement}\n</head>`);
    }
    writeFileSync(htmlPath, html, "utf8");
  }

  return snapshot;
}

function updateMitStatus(id, newStatus) {
  const mitsPath = join(PROJECT_ROOT, "daily-mits.json");
  const data = loadJson(mitsPath);
  if (!data) return;
  const target = (data.mits || []).find((m) => m.id === id);
  if (target) {
    target.status = newStatus;
    if (newStatus === "done") {
      target.completedAt = new Date().toISOString();
    }
    writeFileSync(mitsPath, JSON.stringify(data, null, 2), "utf8");
    refreshDashboard(data.date);
    console.log(JSON.stringify({ ok: true, updatedMit: target }, null, 2));
  } else {
    console.error(`MIT ${id} not found.`);
  }
}

const [, , cmd = "refresh", ...rest] = process.argv;
const flags = parseFlags(rest);

if (cmd === "refresh" || cmd === "dashboard") {
  const snap = refreshDashboard(flags.date);
  console.log(
    JSON.stringify(
      {
        ok: true,
        updated: ["dashboard-data.json", "dashboard.html"],
        today: snap.today,
        rhythm: snap.rhythm.label,
        mitStats: snap.mits.stats,
        runwayMonths: snap.departments.wealth.runwayMonths,
        readyStudioDrafts: snap.departments.studio.readyCount
      },
      null,
      2
    )
  );
} else if (cmd === "mit") {
  if (!flags.id || !flags.status) {
    console.error("Usage: node scripts/patrol-ctl.mjs mit --id=MIT-... --status=done|in_progress|blocked|pending");
    process.exit(1);
  }
  updateMitStatus(flags.id, flags.status);
} else if (cmd === "brief") {
  const snap = refreshDashboard(flags.date);
  console.log(JSON.stringify({ ok: true, cmd: "brief", today: snap.today }, null, 2));
} else if (cmd === "review") {
  const snap = refreshDashboard(flags.date);
  console.log(JSON.stringify({ ok: true, cmd: "review", today: snap.today }, null, 2));
} else {
  console.error(`Unknown command: ${cmd}. Use: refresh | brief | review | mit`);
  process.exit(1);
}
