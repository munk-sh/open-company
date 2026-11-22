#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

function extractJsonBlocks(markdown) {
  const blocks = [];
  const regex = /```json\s*([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // ignore malformed block
    }
  }
  return blocks;
}

function loadPolicy() {
  const policyPath = join(PROJECT_ROOT, "wealth-policy.md");
  const raw = existsSync(policyPath) ? readFileSync(policyPath, "utf8") : "";
  const blocks = extractJsonBlocks(raw);
  const defaults = {
    baseCurrency: "CNY",
    monthlyFixedBurnCNY: 12500,
    minRunwayMonths: 24,
    warningRunwayMonths: 18,
    taxProvisionRate: 0.12,
    minHourlyRateCNY: 800,
    buckets: [
      { id: "cash_and_fixed", name: "🛡️ 现金与固收防守层", targetPct: 30, tolerancePct: 5 },
      { id: "core_equity", name: "📈 全球核心权益复利层", targetPct: 50, tolerancePct: 5 },
      { id: "gold_and_hedge", name: "🪙 黄金与抗通胀压舱层", targetPct: 10, tolerancePct: 3 },
      { id: "alpha_and_arbitrage", name: "⚡ 高赔率进攻与业务套利层", targetPct: 10, tolerancePct: 4 }
    ]
  };
  for (const b of blocks) {
    if (b && typeof b === "object" && !Array.isArray(b)) {
      Object.assign(defaults, b);
    }
  }
  return defaults;
}

function parseCsvLine(line) {
  const cols = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      cols.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

function findLatestMonthCsv() {
  const ledgerDir = join(PROJECT_ROOT, "ledger");
  if (!existsSync(ledgerDir)) return "2026-11";
  const files = readdirSync(ledgerDir)
    .filter((f) => /^\d{4}-\d{2}\.csv$/.test(f))
    .sort();
  return files.length > 0 ? files[files.length - 1].replace(/\.csv$/, "") : "2026-11";
}

function computeCashflow(monthArg, policy) {
  const month = monthArg || findLatestMonthCsv();
  const csvPath = join(PROJECT_ROOT, "ledger", `${month}.csv`);
  const entries = [];
  if (existsSync(csvPath)) {
    const lines = readFileSync(csvPath, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const headers = lines[0] ? parseCsvLine(lines[0]) : [];
    for (let i = 1; i < lines.length; i += 1) {
      const cols = parseCsvLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] ?? "";
      });
      row.amount = Number(row.amount || 0);
      entries.push(row);
    }
  }

  let totalIncomeCNY = 0;
  let activeIncomeCNY = 0;
  let passiveIncomeCNY = 0;
  let totalExpenseCNY = 0;
  const incomeByCategory = {};
  const expenseByCategory = {};

  for (const item of entries) {
    if (item.type === "income") {
      totalIncomeCNY += item.amount;
      if (item.category === "revenue:investment") {
        passiveIncomeCNY += item.amount;
      } else {
        activeIncomeCNY += item.amount;
      }
      incomeByCategory[item.category] = (incomeByCategory[item.category] || 0) + item.amount;
    } else if (item.type === "expense") {
      totalExpenseCNY += item.amount;
      expenseByCategory[item.category] = (expenseByCategory[item.category] || 0) + item.amount;
    }
  }

  const netCashflowCNY = totalIncomeCNY - totalExpenseCNY;
  const savingsRatePct =
    totalIncomeCNY > 0 ? Number(((netCashflowCNY / totalIncomeCNY) * 100).toFixed(1)) : 0;
  const directBizCostsCNY =
    (expenseByCategory["cost:ai_infra"] || 0) +
    (expenseByCategory["cost:saas_sub"] || 0) +
    (expenseByCategory["cost:fulfillment"] || 0);
  const netActiveProfitCNY = Math.max(0, activeIncomeCNY - directBizCostsCNY);
  const taxProvisionCNY = Math.round(netActiveProfitCNY * (policy.taxProvisionRate ?? 0.12));

  return {
    month,
    totalIncomeCNY,
    activeIncomeCNY,
    passiveIncomeCNY,
    totalExpenseCNY,
    netCashflowCNY,
    savingsRatePct,
    taxProvisionCNY,
    incomeByCategory,
    expenseByCategory,
    entries
  };
}

function computePortfolio(policy, taxProvisionCNY = 0) {
  const nwPath = join(PROJECT_ROOT, "portfolio", "net-worth.json");
  const raw = existsSync(nwPath)
    ? JSON.parse(readFileSync(nwPath, "utf8"))
    : { fxRatesToCNY: { CNY: 1 }, accounts: [], liabilities: [] };

  const fx = raw.fxRatesToCNY || { CNY: 1, USD: 7.18, HKD: 0.92 };
  const bucketTotals = {};
  let totalAssetsCNY = 0;
  let liquidDefenseCNY = 0;

  const accounts = (raw.accounts || []).map((acc) => {
    const rate = fx[acc.currency] ?? 1;
    const valueCNY = Math.round(Number(acc.balance || 0) * rate);
    totalAssetsCNY += valueCNY;
    bucketTotals[acc.bucket] = (bucketTotals[acc.bucket] || 0) + valueCNY;
    if (acc.bucket === "cash_and_fixed" && acc.liquid !== false) {
      liquidDefenseCNY += valueCNY;
    }
    return { ...acc, valueCNY };
  });

  let totalLiabilitiesCNY = 0;
  const liabilities = (raw.liabilities || []).map((liab) => {
    const rate = fx[liab.currency] ?? 1;
    const valueCNY = Math.round(Number(liab.balance || 0) * rate);
    totalLiabilitiesCNY += valueCNY;
    return { ...liab, valueCNY };
  });

  const netWorthCNY = totalAssetsCNY - totalLiabilitiesCNY;
  const debtRatioPct =
    totalAssetsCNY > 0 ? Number(((totalLiabilitiesCNY / totalAssetsCNY) * 100).toFixed(1)) : 0;

  const availableRunwayPoolCNY = Math.max(
    0,
    liquidDefenseCNY - totalLiabilitiesCNY - taxProvisionCNY
  );
  const runwayMonths =
    policy.monthlyFixedBurnCNY > 0
      ? Number((availableRunwayPoolCNY / policy.monthlyFixedBurnCNY).toFixed(1))
      : 0;

  const buckets = (policy.buckets || []).map((b) => {
    const currentCNY = bucketTotals[b.id] || 0;
    const currentPct =
      totalAssetsCNY > 0 ? Number(((currentCNY / totalAssetsCNY) * 100).toFixed(1)) : 0;
    const driftPct = Number((currentPct - b.targetPct).toFixed(1));
    const absDrift = Math.abs(driftPct);
    const targetCNY = Math.round((totalAssetsCNY * b.targetPct) / 100);
    const rebalanceDeltaCNY = targetCNY - currentCNY;

    let status = "ok";
    if (absDrift > b.tolerancePct) {
      status = "breach";
    } else if (absDrift >= b.tolerancePct * 0.75) {
      status = "warn";
    }

    let actionText = "仓位处于容忍带内，保持不动";
    if (status === "breach") {
      actionText =
        rebalanceDeltaCNY > 0
          ? `低配超阈值 (${driftPct}%)：建议定投/调入 +¥${rebalanceDeltaCNY.toLocaleString()}`
          : `超配破上限 (+${driftPct}%)：建议止盈/转出 ¥${Math.abs(rebalanceDeltaCNY).toLocaleString()}`;
    } else if (status === "warn") {
      actionText =
        rebalanceDeltaCNY > 0
          ? `接近下沿 (${driftPct}%)：留意逢低补仓机会`
          : `触及容忍带上沿 (+${driftPct}%)：暂停新增投入`;
    }

    return {
      ...b,
      currentCNY,
      currentPct,
      targetCNY,
      driftPct,
      rebalanceDeltaCNY,
      status,
      actionText
    };
  });

  return {
    updatedAt: raw.updatedAt || new Date().toISOString().slice(0, 10),
    totalAssetsCNY,
    totalLiabilitiesCNY,
    netWorthCNY,
    debtRatioPct,
    liquidDefenseCNY,
    availableRunwayPoolCNY,
    runwayMonths,
    runwayStatus:
      runwayMonths >= policy.minRunwayMonths
        ? "healthy"
        : runwayMonths >= policy.warningRunwayMonths
          ? "warn"
          : "danger",
    buckets,
    accounts,
    liabilities
  };
}

function getLocalTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeSubscriptions(todayStr = getLocalTodayString()) {
  const subPath = join(PROJECT_ROOT, "ledger", "subscriptions.json");
  const raw = existsSync(subPath) ? JSON.parse(readFileSync(subPath, "utf8")) : { items: [] };
  const todayMs = new Date(`${todayStr}T00:00:00+08:00`).getTime();

  let monthlyBurnCNY = 0;
  let vampireMonthlyCNY = 0;
  const items = (raw.items || []).map((item) => {
    const cost = Number(item.monthlyCostCNY || 0);
    monthlyBurnCNY += cost;
    if (item.vampireRisk) {
      vampireMonthlyCNY += cost;
    }
    const nextMs = new Date(`${item.nextBillingDate}T00:00:00+08:00`).getTime();
    const daysUntilRenewal = Math.ceil((nextMs - todayMs) / (1000 * 60 * 60 * 24));
    return {
      ...item,
      daysUntilRenewal
    };
  });

  return {
    monthlyBurnCNY,
    annualizedBurnCNY: monthlyBurnCNY * 12,
    vampireMonthlyCNY,
    vampireAnnualSavingsCNY: vampireMonthlyCNY * 12,
    upcomingAlertCount: items.filter((i) => i.daysUntilRenewal >= 0 && i.daysUntilRenewal <= 7)
      .length,
    items
  };
}

function loadDeals() {
  const dealsPath = join(PROJECT_ROOT, "deals-and-offers.md");
  if (!existsSync(dealsPath)) return { items: [], pendingArCNY: 0, activeExpectedCNY: 0 };
  const raw = readFileSync(dealsPath, "utf8");
  const blocks = extractJsonBlocks(raw);
  const items = Array.isArray(blocks[0]) ? blocks[0] : [];
  let pendingArCNY = 0;
  let activeExpectedCNY = 0;
  for (const d of items) {
    pendingArCNY += Number(d.outstandingAmountCNY || 0);
    if (d.stage !== "killed") {
      activeExpectedCNY += Number(d.expectedAmountCNY || 0);
    }
  }
  return { items, pendingArCNY, activeExpectedCNY };
}

function loadWatchlist() {
  const p = join(PROJECT_ROOT, "portfolio", "watchlist.json");
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf8")).items || [];
  } catch {
    return [];
  }
}

function loadBillingSources() {
  const p = join(PROJECT_ROOT, "ledger", "billing-sources.json");
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf8")).sources || [];
  } catch {
    return [];
  }
}

function buildSnapshot(monthArg, todayArg) {
  const policy = loadPolicy();
  const cashflow = computeCashflow(monthArg, policy);
  const portfolio = computePortfolio(policy, cashflow.taxProvisionCNY);
  const subscriptions = computeSubscriptions(todayArg);
  const deals = loadDeals();
  const watchlist = loadWatchlist();
  const billingSources = loadBillingSources();

  return {
    generatedAt: new Date().toISOString(),
    policy: {
      baseCurrency: policy.baseCurrency,
      monthlyFixedBurnCNY: policy.monthlyFixedBurnCNY,
      minRunwayMonths: policy.minRunwayMonths,
      taxProvisionRate: policy.taxProvisionRate,
      minHourlyRateCNY: policy.minHourlyRateCNY
    },
    portfolio,
    cashflow,
    subscriptions,
    deals,
    watchlist,
    billingSources
  };
}

function refreshDashboard(monthArg, todayArg) {
  const snapshot = buildSnapshot(monthArg, todayArg);
  const dataJsonPath = join(PROJECT_ROOT, "dashboard-data.json");
  writeFileSync(dataJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

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

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      flags[key] = val;
      if (val !== "true") i += 1;
    }
  }
  return flags;
}

function addLedgerEntry(flags) {
  const date = flags.date || new Date().toISOString().slice(0, 10);
  const month = date.slice(0, 7);
  const type = flags.type;
  const category = flags.category;
  const amount = Number(flags.amount);
  const currency = flags.currency || "CNY";
  const account = flags.account || "默认账户";
  const title = flags.title || "未命名收支条目";
  const notes = flags.notes || "";

  if (!["income", "expense"].includes(type) || !category || !Number.isFinite(amount) || amount <= 0) {
    console.error(
      "Usage: node scripts/wealth-ctl.mjs add-ledger --date YYYY-MM-DD --type income|expense --category <cat> --amount <num> --account <acc> --title <title> [--notes <notes>]"
    );
    process.exit(1);
  }

  const ledgerDir = join(PROJECT_ROOT, "ledger");
  mkdirSync(ledgerDir, { recursive: true });
  const csvPath = join(ledgerDir, `${month}.csv`);
  let existingLines = [];
  if (existsSync(csvPath)) {
    existingLines = readFileSync(csvPath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean);
  } else {
    existingLines = ["id,date,type,category,amount,currency,account,title,notes"];
  }
  const nextIndex = String(existingLines.length).padStart(2, "0");
  const id = `TX-${month.replace("-", "")}-${nextIndex}`;
  const safe = (v) => (String(v).includes(",") ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const row = [id, date, type, category, amount, currency, safe(account), safe(title), safe(notes)].join(",");
  existingLines.push(row);
  writeFileSync(csvPath, `${existingLines.join("\n")}\n`, "utf8");
  const snapshot = refreshDashboard(month);
  console.log(JSON.stringify({ ok: true, addedId: id, month, netCashflowCNY: snapshot.cashflow.netCashflowCNY }, null, 2));
}

const [, , cmd = "refresh", ...rest] = process.argv;
const flags = parseFlags(rest);

if (cmd === "cashflow") {
  const policy = loadPolicy();
  console.log(JSON.stringify(computeCashflow(flags.month, policy), null, 2));
} else if (cmd === "portfolio") {
  const policy = loadPolicy();
  const cf = computeCashflow(flags.month, policy);
  console.log(JSON.stringify(computePortfolio(policy, cf.taxProvisionCNY), null, 2));
} else if (cmd === "subscriptions") {
  console.log(JSON.stringify(computeSubscriptions(flags.today), null, 2));
} else if (cmd === "add-ledger") {
  addLedgerEntry(flags);
} else if (cmd === "refresh" || cmd === "dashboard") {
  const snap = refreshDashboard(flags.month, flags.today);
  console.log(
    JSON.stringify(
      {
        ok: true,
        updated: ["dashboard-data.json", "dashboard.html"],
        summary: {
          netWorthCNY: snap.portfolio.netWorthCNY,
          runwayMonths: snap.portfolio.runwayMonths,
          monthNetCashflowCNY: snap.cashflow.netCashflowCNY,
          annualizedSubBurnCNY: snap.subscriptions.annualizedBurnCNY,
          pendingArCNY: snap.deals.pendingArCNY
        }
      },
      null,
      2
    )
  );
} else {
  console.error(`Unknown command: ${cmd}. Use: refresh | portfolio | cashflow | subscriptions | add-ledger`);
  process.exit(1);
}
