---
title: 净值盘点与资产配置再平衡体检
trigger:
  schedule: "0 21 * * 0"
period: week
---

执行个人/家庭全口径资产负债表盘点、四层反脆弱配置偏离度测算与持仓标的纪律巡检：

1. **加载技能**：加载本项目 `.opencode/skills/portfolio-and-allocation/SKILL.md`。
2. **运行确定性配置计算引擎**：
   - 执行 `node scripts/wealth-ctl.mjs portfolio` 与 `node scripts/wealth-ctl.mjs refresh`，读取 `portfolio/net-worth.json` 与 `wealth-policy.md`。
   - 精确获取当前总净值、资产负债率、高流动性安全跑道月数（Runway Months），以及「现金与固收防守层 / 全球核心权益层 / 黄金抗通胀层 / 高赔率进攻层」的当前占比与偏离度（Drift %）。
3. **持仓与观察池标的巡检（`portfolio/watchlist.json`）**：
   - 结合公开市场估值/利率信号（必要时使用 `webfetch` 或派 `browse` 查看只读组合页），检查 `portfolio/watchlist.json` 中的核心宽基 ETF、红利资产、黄金与汇率是否触发「定投补仓线（Buy Zone）」或「过热止盈线（Trim Zone）」，并更新 `watchlist.json` 的 `currentValuationNote` 与 `signalSummary`。
   - 再次运行 `node scripts/wealth-ctl.mjs refresh` 确保 `dashboard.html` 呈现最新数据。
4. **收口汇报（`digest.md`）**：
   - 若所有资产层偏离度均在容忍带内且安全跑道充足，输出简明周度净值简报并保持 `needsOwner: false`（不折腾）。
   - 若任一资产层突破容忍带（`status: "breach"`）、安全跑道跌破警戒线、或核心标的触发买卖纪律，设置 `needsOwner: true`，并在 `digest.md` 中给出精确到金额的再平衡调仓建议单。
