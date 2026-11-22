---
title: 早间一页纸拍板简报
trigger:
  schedule: 0 8 * * *
  guard: guards/cadence-sentinel.mjs
period: day
reads:
  projects:
    - radar
    - brain
    - studio
    - wealth
---

执行全公司 08:00 晨会简报生成与 MIT 必赢战役对齐：

1. **跨部门数据扫描**：
   - 优先从运行上下文注入的 `reads.projects` 兄弟项目目录（本地预览环境下回退 `../radar/`、`../brain/`、`../studio/`、`../wealth/`）读取各部门的 `dashboard-data.json` 与最新摘要。
2. **生成今日晨报**：
   - 严格按「一页纸、3 分钟读完」标准，在 `briefs/YYYY-MM-DD.md` 中提炼今日重点。
   - 提炼出今日 **3 大必赢战役 (MITs)** 并保存至 `daily-mits.json`。
3. **刷新看板**：
   - 执行脚本刷新数据与看板：
     ```bash
     node scripts/patrol-ctl.mjs brief
     ```
4. **呈批与唤醒**：
   - 在 `digest.md` 与今日 `journal/YYYY-MM-DD.md` 记录核心要点；
   - 将 `needsOwner` 设为 `true`，唤醒公司负责人并在主页向人类呈批今日 MIT 与决策事项。
