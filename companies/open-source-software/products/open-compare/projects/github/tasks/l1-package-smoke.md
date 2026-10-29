---
title: L1 公开下载包可得性与 3 轮反复用复验（常驻，版本走 brief）
period: day
followUp:
  maxPerDay: 3
---

先 skill({ name: "product-qa" })。维护本项目 qa-checklist.md（版本化结论在「增量验收」小节一行/版），只做这一条链路：从公开下载页取本场 brief 指定版本装到干净环境，跑真实两目录 3 轮对比（含一轮中途取消），证明用户拿得到、反复用不退化。不在代码仓建用例、不改产品源码、不重新打包。

【输入全部来自本场 brief】本场被测版本号、dmg 公开 URL、sha256、字节数、发布期只读核验证据目录、干净目录名、以及被测真实双目录路径，一律从本场 POST /tasks/<taskId>/runs 的 brief 读取，禁止写进 instructions；brief 缺任一项即停手，needsOwner: true 写明缺项，不要自行猜版本 / URL / sha。开工第一步：把 brief 全文原样抄进 digest.md 首段（Host 不回存 brief，这段是这一版口径的唯一可回查锚）。

被测对象 = 公开 Release 资产，不是仓库内构建。下载后 sha256 与字节数必须与 brief 一致，不等即停并 needsOwner: true 附实测值与下载 URL。发布期证据已断言 tag / CI / 资产 / 签名公证；本场不重跑公证 / codesign 全流程，断言以该证据为准；证据缺失或与本次下载 sha 对不上，回退完整核验并 needsOwner: true。

干净环境口径：hdiutil attach 挂载后把 .app 拷到 brief 指定的干净目录，配全新空 --user-data-dir=<临时目录>；不要覆盖或删除本机已有 /Applications 安装，也不要复用仓库 release 构建。核验 CFBundleShortVersionString 与 brief 版本号相等。

用 --remote-debugging-port=<空闲端口> 启动该干净副本，CDP 驱动真实窗口（锁屏环境用 Emulation.setFocusEmulationEnabled），打开 brief 指定的真实双目录路径对。开跑前用 ps 确认没有其它 OpenCompare 实例或重负载，有则推迟并写明；开跑前核对两侧文件数与待哈希字节数并记录实测规模。

1) 三轮：冷跑（全新 user-data-dir）/ 关掉会话后重开 / 第三轮，三轮四态计数必须逐位一致且算术自洽，记录墙钟与完整四态；墙钟只作记录，**不作为及格线**。
2) 内存：三轮各记一次 renderer JS heap（CDP 指标）与 app 进程 RSS（ps -o rss= -p <pid>，至少主进程与 renderer）；判定 app 总峰值 ≤2.5 GiB、无 OOM 无 renderer 重启、第 3 轮相对第 2 轮 renderer 增量不逐轮抬升；瞬时峰值只作回归护栏 ≤2.25 GiB。超限如实写归因。
3) 取消：另起全新 user-data-dir 开同一目录对，进度出现后**任意时点**对取消按钮 hit-test 确认可点再点击（兼容中英双语按钮文案），记录点击到回到可操作态耗时、是否提示已取消、有无残留半棵树 / 四态计数、会话与工作台状态是否不变；核 app 进程 stderr / 日志无 OperationCancelledError 或 ECANCELED 字样（记日志路径与命中数，应为 0）。

计时门槛不进 L1：180 s 持续负载 / 60 s / 3 s 采样 / 15 s 取消四条负载腿属 L2，只在 diff 触及扫描 / 哈希 / 缓存 / IPC / 树渲染 / 取消路径、或 x.y.0 里程碑时由 `l2-large-dir-load` 单独 brief 跑；本场**不得**因对照对规模缩水记 blocked，也不得自行补跑负载腿。

开工即建 digest.md 骨架，**每完成一步立刻追加一行**（步骤名、实测数字、当前判定），不得收工一次性回填；证据落 evidence/（计时 json、采样序列、RSS、日志扫描、截图）。产品行为全过 needsOwner: false，digest 给 brief 版本与 URL、实测 sha256、三轮数字与判定、取消耗时与日志结论；任一产品行为失败设 needsOwner: true 附复现与证据；环境不就绪记 blocked + needsOwner: false。收工在 qa-checklist.md「增量验收」加一行「<版本> · L1 · <结论> · <digest 路径>」。
