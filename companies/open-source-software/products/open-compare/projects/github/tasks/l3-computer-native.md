---
title: L3 桌面系统窗口验收（原生面板 / 启动参数 / 打包壳）
computer: true
period: day
---

先 skill({ name: "product-qa" })。维护本项目 qa-checklist.md。本任务只覆盖 CDP/浏览器驱动不了的**系统窗口与原生通道**，渲染层主链路由浏览器/CDP 场覆盖，不要在这里重复点。

排期与耗时约束：单场只排 2 条路径、墙钟 30 分钟上限；开工先建 digest.md 骨架并逐步追加结论+证据路径。

本任务范围（按 brief 选 2 条）：
A) 导出/保存走原生 NSSavePanel 的落盘闭环（快照/合并结果导出、原位保存对话框）；
B) 打包态启动：argv 路径直传、`opencompare://compare?left=&right=` 冷启动建会话、second-instance 接管、异常参数只提示不建会话；
C) 打包 `.app` 品牌图标、窗口/About 面板名称与版本、原生菜单；
D) 系统文件选择器打开真实文件/目录（非应用内路径输入）。

锁屏环境需要时用 `Emulation.setFocusEmulationEnabled`；原生面板确实驱动不了就记 blocked 并写原因，不记产品缺陷。实机产品失败才 needsOwner: true，环境不就绪记 needsOwner: false。不要在代码仓建用例。

【场次纪律】一场 = 一个 brief + 2 条明确项，30 分钟墙钟硬上限，到点没验完就写现状 + 止损行收场，不为「再确认一次」重开；同一 commit 上已出结论的路径不得重开，新场 digest 首行必须写清本场覆盖哪条未验项与相对上一场的差异；每完成一条腿立刻追加 digest 阶段行（时刻/阶段/实测/判定），digest 静默超过 20 分钟视为故障，先回填再干活。
