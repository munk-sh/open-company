---
title: 公开信源热点哨兵
trigger:
  schedule: "0 * * * *"
  guard: guards/radar-sentinel.mjs
period: hour
---

你负责把公开信源里的新异动，转成频道可用的选题原料。

`guards/radar-sentinel.mjs` 已经完成零 Token 预检：拉取 `watchlist.json` 中的公开源、按已见 ID 去重、做关键词加权，并把本轮候选写入 `.state/pending-signals.json`。没有新信号时脚本直接退出，不要空跑深挖。

## 1. 读取上下文

1. 读取频道 `../../AGENTS.md` 与 `../../goal.md`，确认当前赛道、受众与内容支柱。
2. 读取 `watchlist.json` 的 `profile` 与 `keywords`。
3. 读取 `.state/pending-signals.json` 的候选条目，以及最近一份 `signals/YYYY-MM-DD.md`，避免重复报告。

## 2. 去伪存真

- 直接剔除与赛道无关的泛科技八卦、公关通稿和纯刷榜内容。
- 对命中 `matchedBoost` 或讨论热度高的前 3–5 条，打开原始链接或讨论区，弄清楚：它解决了什么具体问题？真实用户在讨论什么？
- 无法核实来源或只有二手转述的条目，不写进报告。

## 3. 归档到 `signals/YYYY-MM-DD.md`

每条有效信号都要写清：

1. **事实与讨论**：一句话核心进展 + 原始链接 + 真实社区反应。
2. **与本频道的关系**：它是新工具红利、可落地的选题，还是需要避开的坑？
3. **下游建议**：交给 `studio` 的选题切入角与标题钩子，或交给 `growth` 观察的平台趋势。

## 4. 输出纪律

- 本轮没有有效信号：写「本轮暂无新信号」并结束，不编造热点。
- 不擅自发布任何内容；本任务只产出台账与建议。
- 所有数字（分数、评论数、时间）必须来自原始页面。
