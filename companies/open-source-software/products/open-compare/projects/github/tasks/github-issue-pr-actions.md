---
title: GitHub Issue 与构建报错盯盘
trigger:
  schedule: "*/5 * * * *"
  guard: guards/github-sentinel.mjs
period: day
followUp:
  maxPerDay: 3
---

加载 github-issue-triage 技能，作为班次 A。本班只做分诊、回执、建档、游标。回执文案和唤醒条件听 skill。

硬护栏：
a. 不读产品源码，不 grep，不跑构建或测试。需要定位就停手，digest 写「需另派研发工作项」并 needsOwner: true。
b. 开工 30 秒内先落 digest 骨架；每处理一条追加一行：条目、类别、动作、判定。
c. 单条 ≤2 分钟、整场 ≤8 分钟。超时停手，digest 写「探测超时 + 已处理 N 条」并 needsOwner: true。

本班补充：
- bug case 只写三项：初判类别、用户报告版本（没有就写未提供）、是否需要研发介入（是/否 + 一句原因）。
- 收工前复跑 guard 必须 exit 1。未完成回执的指纹留在游标里，不要删。
- `DEPENDABOT#<number>:critical`：用 `node guards/gh.mjs api repos/<owner>/<repo>/dependabot/alerts/<number>` 取摘要，建档 `cases/dependabot-*.md`（package、severity、advisory 摘要、GHSA、manifest path、是否需要研发介入），needsOwner: true。指纹留在游标。API 无权限或返回非数组时不要另开检查。
