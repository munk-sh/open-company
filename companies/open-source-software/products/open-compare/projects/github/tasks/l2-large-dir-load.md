---
title: 大文件夹加载性能测试
period: day
followUp:
  maxPerDay: 2
---

先 skill({ name: "product-qa" })。维护本项目 qa-checklist.md（版本化结论在「增量验收」小节一行/版）。本任务只跑 L2 负载腿，不重跑已通过的下载 / sha / 签名 / 三轮四态，不改产品源码、不在代码仓建用例、不重新打包、不动 tag / Release。

【触发条件】四条腿属 L2，只在 diff 触及扫描 / 哈希 / 缓存 / IPC / 树渲染 / 取消路径时条件触发，或 `x.y.0` 里程碑一次性跑；**不逐版补测**，只由负责人用单独 brief 手动触发，同一管线已有结论不得为「再确认一次」重起。

【输入全部来自本场 brief】本场被测版本号、dmg 公开 URL、sha256、字节数、发布期只读核验证据目录、干净目录名、夹具缓存根目录、对照对目标条目数与下限，以及「最近一次有效负载证据（digest 路径 / 关键数字）」与「适用 commit 范围」，一律从本场 POST /tasks/<taskId>/runs 的 brief 读取，禁止写进 instructions；brief 缺任一项即停手，needsOwner: true 写明缺项。开工第一步把 brief 全文原样抄进 digest.md 首段。被测对象 = brief 指定版本的公开包（不是仓库构建），下载后 sha256 与字节数必须与 brief 一致，不等即停并 needsOwner: true。

资源缓存：对比资源不每次重下，统一使用 brief 指定的夹具缓存目录（不得放进产品仓、公司目录或 `/tmp`）。`source-cache/` 长期缓存压缩源码 tarball，命名 `<owner>__<repo>__<tag>.tar.gz`；同一 tag 命中就直接用、不联网。`manifest.tsv` 记 repo、tag、URL、sha256、bytes、下载日期；复用前先校 sha256，不符才重下一次并更新 manifest。`work/` 放本次解包目录与 `cp -cR` 出来的第二侧，跑完连同快照删掉，只把条目数、体积、跑前后 `df`/`du` 留进 evidence。预算 ≤10 GB（source-cache + work 合计）：超了先清 work，再考虑 source-cache；删 source-cache 前必须先上报找人。

对照对：以 GitHub 公开大仓相邻两个 release 的真实双 tag 对为底（tag 以远端实际存在为准，先 `gh api` 或 `git ls-remote --tags` 核对），source tarball 从 source-cache 取或首次下载后入库，不 clone 全历史；两侧同构成（第二侧优先 `cp -cR` APFS clonefile 只付 delta）。目标与下限取本场 brief 值；凑不到目标就把实测条目数写进证据并退回下限判定；不许用合成树或 `.ocsnap.json` 冒充真实对照对。必须实测并记录两侧条目数、文件数、待哈希字节数与所用 tag / release 清单。低于 brief 下限（未给时默认 ≥200,000 条目/侧）写 needsOwner: true。

codeload tarball 会把每个文件 mtime 写成该 tag 的 commit 时间，两侧同名文件 mtime 必然不同 ⇒ size/mtime 快路径把每对判 modified、不读内容体，这类对照对**测的是元数据扫描管线**。digest 必须写明本场所测管线（元数据扫描 / hash），不得把元数据扫描结果当 hash 管线证据。

计时采样独占机器：每条腿开跑前 `ps` 确认没有 OpenCompare 实例、pnpm/vitest/electron-builder 或其它重负载，有就等 60 s 再查；整场拿不到独占窗口就写 blocked + needsOwner:false，不硬跑、不改口径。安装与启动按 brief 的干净环境口径，不覆盖本机 `/Applications` 安装。

四条腿（均在真实对照对上）：
1) 冷跑腿：全新 user-data-dir，建立对比到四态计数出现记墙钟，**判定「冷跑在 180 s 内完成」**；记文件数、待哈希字节、四态计数、进度文案 ≥3 s 采样（首末与最小回退值）与实测规模。
2) 热跑腿：同一实例关掉会话后重开，≤60 s，记是否命中缓存与墙钟。
3) 3 s 采样腿：另起全新 user-data-dir 冷跑，每 3 s 采一次进度计数，至少 3 条，记单调性与最小回退值。
4) 取消腿：另起全新 user-data-dir 开同一对，进度出现后**任意时点**对取消按钮 hit-test 确认可点再点（记实际取消时点，兼容中英双语按钮文案），记点击到回可操作态耗时、取消提示、有无残留半棵树 / 四态计数、会话与工作台状态是否不变、stderr / 日志 OperationCancelledError 或 ECANCELED 命中数（应为 0）。

判定口径：**冷跑 180 s 内完成 + 取消任意时点可点且回退干净**即算过。

每条腿记录 renderer JS heap（CDP）与 app 进程 RSS（`ps -o rss= -p <pid>`，主进程 + renderer）。内存判定：3 tab 建齐 +20 s 静置 ≤1300 MiB、app 总峰值 ≤2.5 GiB、无 OOM / renderer 重启；瞬时峰值只作护栏 ≤2.25 GiB。

**digest 逐段落痕**：开工即建 digest.md 骨架，**每完成一条腿立刻追加一行**（腿名、实测数字、当前判定），不得收工一次性回填。证据落 evidence/（计时 json、采样序列、RSS 曲线、df/du、缓存文件与 sha256、tag 名、条目数、截图）。全过 needsOwner:false 并给出四腿数字；任一产品行为失败 needsOwner:true 附复现与证据；磁盘 / 网络 / 独占窗口不就绪记 blocked 并写明。收工在 qa-checklist.md「增量验收」加一行「<版本> · 负载腿 · <结论> · <digest 路径>」。
