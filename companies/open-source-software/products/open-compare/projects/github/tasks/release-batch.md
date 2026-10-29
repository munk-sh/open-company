---
title: 每日 07:00 定时发版
trigger:
  schedule: 0 7 * * *
period: day
followUp:
  maxPerDay: 3
---

先 skill({ name: "github-oss-release" })。本任务是 OpenCompare 的标准批次发版通道（遵循公司宪章「研发 / 验证 / 发版三流解耦」）。日常只在 07:00 窗口跑；急修（崩溃 / 数据损坏或丢失 / 公开版主链路不可用 / 安全）可由负责人手动开跑。远端 chaxiu/OpenCompare，发布点全部走 codebase main。

【第 0 步：有没有当日迭代（此步不得改任何 ref）】
在代码仓 main 上跑 `git describe --tags --abbrev=0 main` 得 last，再跑 `git rev-list --count last..main` 得 n。
- n=0：digest.md 首行写「无当日迭代，本窗口不发版」，needsOwner: false 收工；不构建、不打 tag、不推 ref、不 dispatch、不唤醒任何人。**这是唯一允许安静收工的分支，其余任何情况都不许设 needsOwner: false。**
- n>0 继续第 1 步。

【第 1 步：定发布点（可回退，禁止拼版）】
- 只读 now.md / handoff.md 的「未发布：<sha> <标题> <原因>」记录与最近 digest，列出 last..main 的提交与每条是否已过 code_gates。
- 发布点必须是已过门的 commit；若最后一项长验 / 专项门结论未过或未落地，回退到它的父提交，本窗口只发它之前的 commit。
- 禁止 cherry-pick 拼版；禁止在发布点上做任何代码改动；发布点一旦确定写进 digest。

【第 2 步：版本号前置（不满足就停手）】
发布点上的 package.json#version 必须严格大于 last tag（至少 patch+1）。不满足：digest.md 设 needsOwner: true，标题「缺版本收敛 commit」，写清 last tag、发布点、当前 version；不构建、不打 tag；严禁自己 bump 版本或改代码补版本。

【第 3 步：在发布点跑全量门】
用 `git worktree add` 把发布点检出到仓库外临时目录，在隔离目录跑全量 code_gates（install / lint / typecheck / build / build:web / test；windows-latest 相关断言以 CI 为准）。门红就停：needsOwner: true，写失败项与命令输出路径，不发版。

【第 4 步：推 tag（停在权限卡等人点一次）】
- 本地创建 annotated tag v<version> 指向发布点 commit（message 写 Release v<version>），记录 tag 对象与 commit SHA。
- 用 munk_task_publish 推 tag。403 human_required：把报错里的 request 原样贴进 POST /opencode-tools/owner-human-request（kind=approve），digest 写「等待放行」，needsOwner: true。不得手敲 git push，不得让人手动跑 git 命令代替。
- 400 task_publish_remote_tag_conflict：立即 needsOwner: true 上报，不强推、不删远端 ref。已公开 tag 永不重写、永不重发。

【第 5 步：CI 与公开件核验】
gates 全绿（含 windows-latest 门）；mac 签名+公证成功（日志无 skipped macOS application code signing）；该 tag 恰好一个公开正式 Release（非 draft 非 prerelease）；11 件资产齐全（dmg/zip/exe/AppImage/deb 各 blockmap + latest*.yml×3），latest*.yml 与产物名为本版，Windows 资产名 OpenCompare-Setup-<version>.exe；dmg 下载 sha256 与资产一致；另外核 Release 正文是否由发布流水线按仓内 `docs/release-notes/<version>.md` 写入（含末尾 Full Changelog 行、长度 > 1000 字符）；不一致时不要自己拼写正文，digest 记「正文未同步 · <实测长度与差异>」并 needsOwner: true，其余判定按上文。任一资产/签名/Release 形态不符：needsOwner: true 附证据路径，不对外写「已发布」。

【第 6 步：digest 与回执——发版成功是里程碑，必须叫醒负责人】
digest.md 写清 tag、发布点 commit、dmg 公开 URL 与 sha256、CI run 链接、资产清单、失败项。
- **发版成功**（tag 推成、CI 全绿、公开件核验通过）：digest 首行固定写「发布成功 · 待 L1 / 对外收口」，**needsOwner: true**；正文给 tag、发布点 commit、dmg 公开 URL + sha256、CI run 链接、资产清单，并写明随后要做的两件：1 小时内跑 L1（常驻 `l1-package-smoke` + brief，brief 带版本 / dmg URL / sha256 / 字节数 / 发布期证据目录 / 干净目录），L1 通过后才对外写「已发布」。
- **任一核验失败、或停在权限卡等人 approve**：needsOwner: true，digest 首行写「发布失败 · <失败项>」或「等待放行 · tag 未推」。
- **needsOwner: true 在成功分支不代表故障**：负责人按 digest 首行的标记分诊——「发布成功」→ 去跑 L1 与对外收口；「发布失败 / 等待放行」→ 去修或去放行。不要把成功当异常去建修复工作项。
- 定时跑（trigger=schedule）没有 notifyOwner 通道，窗口的成功回执只能落在 digest 的 needsOwner 上。
- **L1 结论落地前对外口径只能写「已构建、公开件就绪」**，不得写「已发布 / 已修复 / 已通过验收」。

约束：同一时间只允许一个正式 Release 在收口，不并发 dispatch 抢 Release；不改 README / 版本以外的产品文件；不动已公开的 tag / Release / 资产；凭据只从 CI Secrets 读取且不入库 / 日志 / digest；不为凑绿放宽门禁或删测试。
