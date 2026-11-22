# 频道增长复盘（Growth）

这个项目负责用真实数据回答一个问题：这个频道这个周期到底有没有跑出方向？

- `tasks/weekly-channel-retro.md`：每周日 19:00 汇总本周内容产出、平台侧真实互动与可得转化信号，产出复盘结论，供矩阵总控的周度赛马比较使用。复盘读取同级 `studio` 的 `pitches/`、`drafts/`、`published/` 与同级 `radar` 的 `signals/`，均通过 frontmatter `reads.projects` 显式声明只读授权。

没有平台后台数据时，如实写「暂无数据」并说明缺什么，不用估算数字填满复盘。

- `retros/weekly-YYYY-Www.md`：每次复盘按 ISO 周归档的事实来源，含数据表、判定结论、依据与原始链接；`digest.md` 只是本周摘要，matrix-hq 的跨周比较读 `retros/` 归档。

## 赛马阈值口径

<!-- race-thresholds:start -->

与 matrix-hq 判定表同源，数值逐项一致：周有效发布 ≥ 3 篇方可下结论；信号量（关注 + 收藏 + 私信）≥ 前 4 周中位数 × 1.5 且 ≥ 20 次 → 加注；单周低于 × 0.5 或有效发布 = 0 → 冻结候选，连续 2 周触发；冻结满 2 周且负责人书面确认 → 淘汰；数据缺失或样本不足 → 保持，观察窗 1 周。以上均为**默认阈值，首个真实周期实测后校准**。

<!-- race-thresholds:end -->
