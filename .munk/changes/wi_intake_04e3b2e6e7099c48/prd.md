# 新建自媒体矩阵模板 companies/self-media 并退役删除 one-person-company

## 目标

背景痛点：现有 companies/one-person-company 混入个人记账/待办伪部门、6200 行紧耦合伪前端注入脚本及整套 2026-11-04 虚构业务数据，且单层公司结构无法支撑多账号矩阵隔离。
预期变化：彻底删除 companies/one-person-company，新建符合 open-company/v0 契约的两层自媒体矩阵模板 companies/self-media（顶层矩阵赛马总控 matrix-hq + 内置单账号 Product 样板 flagship-channel 含产品级 radar/studio/growth、真实 HN/RSS 零 Token 哨兵与诚实 Day-0 空态），并同步更新 scripts/build-catalog.mjs、catalog.json 与根 README.md。
价值分类：user

工程与契约红线（严禁触碰 .munk/code-gates.json）：
1. 先从旧 companies/one-person-company 提取真正可用的干净资产（radar/guards/radar-sentinel.mjs、watchlist.json 公开源骨架、skills/web-recon/SKILL.md、skills/brand-voice/SKILL.md，清除一切 2026-11-04 时间戳与 *-ctl.mjs 引用），随后彻底 git rm 删除 companies/one-person-company/** 及跟踪的 .DS_Store。
2. 新建 companies/self-media/（严格遵循 open-company/v0 导入器契约）：
   - Companyfile.yaml：spec: open-company/v0，全新合法 UUID id，name/description/homepage，requires.logins: [xiaohongshu, x, wechat-mp]。
   - 根 goal.md（首轮对话引导用户确认垂直赛道与目标平台、初始化样板频道并触发首轮真实热点抓取）+ 根 AGENTS.md（MCN 矩阵赛马纪律：按周期评估各频道转化、淘汰冻结低效号、将爆款结构沉淀共享、严禁编造假数据）+ skills/{web-recon,brand-voice}/SKILL.md。
   - 顶层项目 projects/matrix-hq/：README.md + tasks/weekly-matrix-review.md（title 必填，trigger.schedule: "0 20 * * 0" 配 period: week，reads.projects: ["flagship-channel/growth"]）+ 极简只读诚实 Day-0 空态 dashboard.html（无任何硬编码假数字、无伪复选框/伪刷新按钮）。
   - 内置首发矩阵账号产品 products/flagship-channel/：
     * Productfile.yaml：spec: open-company/v0，id: flagship-channel，title: 首发样板频道，lifecycle: live，source 必须精确写为 { path: "./code", commit: "0000000", branch: "main" }，requires: { browser: true, logins: [xiaohongshu, x] }，groups: [{ id: channel-ops, title: 频道运营 }]，projects 声明 radar、studio、growth 三项。
     * products/flagship-channel/code/：放干净的频道内容库骨架（README.md 及 pitches/.gitkeep、drafts/.gitkeep、published/.gitkeep，零假稿件）。
     * products/flagship-channel/goal.md（14 天方向赛马验证目标模板）与 AGENTS.md（单账号人设、受众画像与去 AI 味写稿规范）。
     * products/flagship-channel/projects/{radar,studio,growth}/：radar 含 guards/radar-sentinel.mjs、真实公开源 watchlist.json、tasks/public-signal-scan.md（cron "0 * * * *" 必配 period: hour 与 guard: guards/radar-sentinel.mjs）及 tasks/social-trend-scan.md（手动或 >=2h 周期合规 frontmatter）；studio 含 tasks/daily-topic-pitch.md（trigger.schedule "0 10 * * *" 配 period: day，reads.projects: ["flagship-channel/radar"]）与 tasks/multi-platform-draft.md（按需手动生成公众号长文+小红书图文卡+X 推文串成品包）；growth 含 tasks/weekly-channel-retro.md（trigger.schedule "0 19 * * 0" 配 period: week，reads.projects: ["flagship-channel/studio"]）。所有 task frontmatter 严格满足 title、schedule+period、<=60m 必带 guard 契约。
3. 更新 scripts/build-catalog.mjs 中 BILINGUAL_METADATA（用 self-media 替换 one-person-company 中英双语描述与 opsHighlights），实跑 node scripts/build-catalog.mjs 更新 catalog.json 并确认 git diff --exit-code catalog.json 为 0，同步更新根 README.md 模板列表；在合并前可对本地 17890/17891 的 POST /company/import/plan 做一次只读 dry-run 校验确保零 schema 报错。

## 验收

- ac-1: 仓库中 companies/one-person-company 目录及其历史虚构种子文件已完全移除，新建的 companies/self-media 完整包含顶层公司配置（Companyfile.yaml、goal.md、AGENTS.md、skills、projects/matrix-hq）与首发矩阵账号产品（products/flagship-channel 含 ./code 内容骨架、独立 browser 声明及 radar/studio/growth 三个运营项目）。
- ac-2: companies/self-media 全目录（含所有 Markdown、JSON、YAML 与 HTML）零历史虚构业务档案与假指标残留，所有任务与包描述文件通过 open-company/v0 规范解析校验且可通过 Host 导入预演（/company/import/plan）无格式或引用错误。
- ac-3: 运行 node scripts/build-catalog.mjs 零报错退出且生成的 catalog.json 与工作树完全一致（含 self-media 双语元数据且不再包含 one-person-company），根 README.md 已同步反映最新公司模板清单。
