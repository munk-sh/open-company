---
title: 浏览器自动对账与收支订阅审计
trigger:
  schedule: "0 20 * * *"
  guard: guards/deal-sentinel.mjs
period: day
---

执行多源账单归集、平台结算后台只读对账、吸血鬼订阅排查与看板刷新：

1. **加载技能**：首先加载本项目 `.opencode/skills/browser-billing-recon/SKILL.md`。
2. **多源对账与账单清洗**：
   - 检查 `ledger/inbox/` 是否有新投递的 `.csv` / `.tsv` / `.json` 账单文件；若有，去重并归类写入当月 `ledger/YYYY-MM.csv`，处理后将原文件重命名为 `.processed`。
   - 对照 `ledger/billing-sources.json` 中 `mode: "browser_auto"` 的平台（如 Stripe、小报童/知识星球结算台、OpenRouter/Anthropic 算力账单页），当到达巡检周期或收到 `brief` 点名时，派发 `browse` 子专员**100% 只读**摘录最新可提现余额、本月新增营收与剩余算力额度，更新 `ledger/billing-sources.json`（若遇到登录墙则调用 `munk_request_human` 请老板扫码解锁，严禁点击任何提现/转账/交易按钮）。
3. **订阅失血雷达与確定性算账**：
   - 执行 `node scripts/wealth-ctl.mjs refresh`，重算当月净现金流、储蓄率、税务预留池及年化订阅燃烧额，自动更新 `dashboard-data.json` 与 `dashboard.html`。
4. **收口汇报（`digest.md`）**：
   - 汇总本次新增入账金额、各平台待提现余额、以及 7 天内即将自动扣费的低效「吸血鬼订阅」。
   - 若发现算力余额低于预警线、存在 5 天内即将自动扣费的吸血鬼订阅需老板动手退订、或有大额可提现收入待结算，设置 `needsOwner: true` 唤醒负责人。
