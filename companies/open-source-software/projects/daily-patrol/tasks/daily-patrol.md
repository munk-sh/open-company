---
title: 晚间进度盘点与经验总结
trigger:
  schedule: 0 21 * * *
period: day
---

执行全公司每日经营对账与跨产品经验提炼：
1. 跨产品推进对账：检查 `../../products/*/` 下各活跃产品的 `Productfile.yaml`、`goal.md`、`handoff.md`、`.munk/now.md` 与 `goals/index.md`，识别长期无进展、卡在等待、或已满足结案条件却未推进的产品。
2. 跨产品经验与基建资产提炼：检查各产品仓库与产品目录的 `AGENTS.md`（尤其是 `## 近期结论`）、运营项目 `.opencode/skills/` 及 `../../../toolchains/tabs.json`，提炼具有跨产品普适价值的工程规范、常见避坑经验或可复用能力。
3. 在本场 `digest.md` 中汇总：
   - 需要督办或纠偏的产品清单（写明 `codebaseId`、卡点原因与建议留话内容）；
   - 建议上收到公司级 `AGENTS.md` 的通用经验候选条目（若无新结论则写明无需更新）。
