---
title: 今日重点战役进度盯盘
trigger:
  schedule: 0 12,17 * * 1-5
period: day
reads:
  projects:
    - radar
    - brain
    - studio
    - wealth
---

盯盘今日 3 大必赢战役（MITs）的推进状态：

1. **读取状态**：
   - 读取 `daily-mits.json`，检查各事项当前状态。
2. **跨部门检测**：
   - 检查对应部门的文件是否已发生更新（例如：`wealth/deals-and-offers.md` 是否已产生新提案、`studio/drafts/` 是否已流转至已发布）。
3. **刷新看板**：
   - 执行刷新脚本更新完成度与看板：
     ```bash
     node scripts/patrol-ctl.mjs refresh
     ```
4. **异常预警**：
   - 若下午 17:00 仍有 P0 事项处于未启动或卡阻状态，在 `journal/YYYY-MM-DD.md` 中进行黄色预警，并在必要时设置 `needsOwner: true` 提醒人类聚焦。
