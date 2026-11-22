# 自媒体矩阵 (Self-Media Matrix)

这是一套遵循 **`open-company/v0`** 标准的自媒体矩阵模板，用来运营「一个总控 + 多个独立账号」的内容生意。

它把矩阵运营拆成两层：

- **顶层矩阵总控 `projects/matrix-hq`**：按周比较各频道的转化表现，决定加注、保持、冻结或淘汰，并把验证过的爆款结构沉淀为全矩阵共享打法。
- **独立账号产品 `products/flagship-channel`**：一个账号 = 一个隔离的产品目录，拥有自己的人设、受众、内容库与 `radar` / `studio` / `growth` 三个运营项目，互不污染。

模板内置 `flagship-channel` 作为首发样板频道。它从 Day-0 空态开始：没有虚构稿件、没有假指标，第一条真实信号来自公开信源哨兵。

## 目录结构

```text
self-media/
├── Companyfile.yaml              # 矩阵身份、主页与需要人工登录的平台
├── goal.md                       # 首轮对话：确认赛道与平台，初始化样板频道
├── AGENTS.md                     # 矩阵赛马纪律（评估、淘汰、沉淀、诚实数据）
├── skills/
│   ├── web-recon/SKILL.md        # 全网采集与一手信息核验
│   └── brand-voice/SKILL.md      # 语感校准与去 AI 味写稿
├── projects/
│   └── matrix-hq/                # 顶层矩阵总控
│       ├── dashboard.html        # 只读、诚实的 Day-0 空态看板
│       └── tasks/weekly-matrix-review.md
└── products/
    └── flagship-channel/         # 首发样板频道（单账号产品）
        ├── Productfile.yaml      # 频道身份、登录需求与三个运营项目
        ├── goal.md               # 14 天方向赛马验证目标
        ├── AGENTS.md             # 单账号人设、受众画像与写稿规范
        ├── code/                 # 频道内容库骨架（pitches / drafts / published）
        └── projects/
            ├── radar/            # 零 Token 公开源哨兵 + 社媒热点扫描
            ├── studio/           # 每日选题 + 多平台成品包
            └── growth/           # 周度频道复盘
```

## 新增一个矩阵账号

1. 复制 `products/flagship-channel` 为 `products/<new-channel>`。
2. 修改 `Productfile.yaml` 的 `id` / `title` / `logins`，把频道定位写进 `goal.md` 与 `AGENTS.md`。
3. 清空 `code/` 下的内容库，让新频道同样从真实的 Day-0 空态起跑。
4. 在 `projects/matrix-hq/tasks/weekly-matrix-review.md` 的 `reads.projects` 中登记新频道的 `growth` 项目，进入周度赛马比较。
