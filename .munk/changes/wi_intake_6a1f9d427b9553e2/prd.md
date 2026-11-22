# self-media：赛马判定量化

## 背景
`companies/self-media` 已由公司补丁单（98dda1d / c824f1d）修正导入后运行期路径、reads.projects 与 guard 退出码。剩余唯一实质缺口：赛马判定仍是定性话术（`projects/matrix-hq/tasks/weekly-matrix-review.md:34-37`、`products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md:40-44`），无指标定义、无数值阈值、无最小样本门槛，决策不可证伪；growth 复盘也只写裸 `digest.md`，无跨周期归档。

## 范围
1) 统一阈值表（唯一事实来源）
- 在 `companies/self-media/projects/matrix-hq/tasks/weekly-matrix-review.md` 增加「赛马判定表」，四态（加注/保持/冻结/淘汰）各含：触发条件（可用数值表达）、最小样本门槛、观察窗、复核要求。阈值写成显式默认值并标注「默认阈值，首个真实周期实测后校准」。建议基线（可微调但必须成表可解析）：周有效发布 ≥3 篇方可下结论；「关注+收藏+私信」周合计 ≥ 该频道前 4 周中位数的 1.5 倍且 ≥20 次 → 加注；单周低于前 4 周中位数 0.5 倍或有效发布为 0 → 冻结候选（需连续 2 周）；冻结满 2 周且负责人书面确认 → 淘汰；任何缺失数据或样本不足 → 保持并写「样本不足」。
- `products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md` 引用同一张表：阈值数值必须与 matrix-hq 完全一致，不得另起一套措辞；仅保留频道视角的解释。
- `projects/matrix-hq/README.md` 与 `products/flagship-channel/projects/growth/README.md` 各加一段口径摘要，数值与阈值表一致。
2) 复盘归档（沿用项目内 cwd 约定，不引入跨项目相对路径）
- growth 每次复盘在自身项目 cwd 内写两份：`digest.md`（本周摘要，供快速预览）与 `retros/weekly-YYYY-Www.md`（按 ISO 周归档，含数据表、判定、依据、原始链接）。补 `retros/.gitkeep`。
- matrix-hq 任务改为读取各频道 growth 的 `retros/` 归档做跨周比较（`reads.projects` 已声明，不新增越界路径）。
3) 测试加固 `scripts/validate-company.test.mjs`
- 断言 matrix-hq 判定表四态齐全且可正则解析出 ≥4 组数值阈值；
- 断言 growth 任务与两个 README 中出现的阈值数值集合与 matrix-hq 完全一致（抽数值比较，不一致即 fail）；
- 断言 growth 任务文档提到 `retros/weekly-YYYY-Www.md`，且 `retros/` 目录存在；
- 断言全 `companies/self-media/**` 不再出现未带归档路径的裸 `digest.md` 交接（只允许 growth 自身摘要用法，且必须同时提 retros 归档）。

## 验收
- ac-race-thresholds: matrix-hq 判定表四态齐全，每态含数值条件与最小样本门槛，并标注「默认阈值待实测校准」；测试能正则取到 ≥4 组数值阈值。
- ac-rule-consistency: growth 任务与 matrix/growth 两个 README 的阈值数值与 matrix-hq 完全一致（测试断言相等）。
- ac-retro-archive: growth 复盘同时产出 `digest.md` 与 `retros/weekly-YYYY-Www.md`，目录与 .gitkeep 存在，matrix-hq 读取 `retros/`；测试断言上述引用。
- ac-no-fake-metrics: 全变更不出现任何具体表现数据（粉丝数、曝光量、转化率、爆款案例）作为事实；阈值均以策略默认值呈现并标注可校准。
- ac-tests-green: `node scripts/build-catalog.mjs && node --test scripts/validate-company.test.mjs` 退出码 0；catalog.json 仅因任务/摘要文案变化而更新。

## 非目标（反范围）
- 不改任务 cwd/路径约定、不改 `reads.projects` 声明、不改 radar guard 及其退出码（公司补丁单已收口）。
- 不触碰 `.munk/code-gates.json`，不改 companies/open-source-software，不改根 README 定位文案，不新增第三方依赖。
- 不写 HTML 注入脚本、不加伪交互按钮。

## 实现约束
- 改动集中在 `companies/self-media/projects/matrix-hq/**`、`companies/self-media/products/flagship-channel/projects/growth/**`、`scripts/validate-company.test.mjs`，必要时由 `node scripts/build-catalog.mjs` 重生成 catalog.json。
- 阈值只作为策略默认值出现，不得伪装成实测结果。

## 本单执行约束（不 fold）
- 交棒前本地执行 `node scripts/build-catalog.mjs && node --test scripts/validate-company.test.mjs`，两者通过；不需要浏览器验收。
