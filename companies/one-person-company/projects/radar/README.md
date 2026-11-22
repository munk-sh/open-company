# 📡 情报雷达（`radar`）

`radar` 是「一人公司 · 超级个体」的外部眼睛与耳朵。

它**不是**把几十条新闻塞给你的 RSS 阅读器，而是遵循 **「平时 0 Token 静音值守，出现高价值异动与跨网信息差才带着行动方案敲门」** 的原则，为下游的 `studio`（内容工坊）、`wealth`（财富与搞钱）和 `brain`（第二大脑）持续输送高信噪比弹药。

---

## 核心架构：三擎协同（两常驻守卫 + 一主动深挖）

| 任务 (`tasks/`) | 0 Token 守卫 (`guards/`) | 触发机制 | 核心职责 |
| :--- | :--- | :--- | :--- |
| **`signal-watch.md`**<br>*(公开信源异动哨兵)* | `guards/radar-sentinel.mjs` | 每小时 (`0 * * * *`) | Node 脚本先以 **0 Token** 轮询 `watchlist.json` 中的免登录公开源（HN、Show HN、GitHub Trending、重点博客 RSS），比对 `.state/seen-items.json` 去重并按关键词加权。**只有刷出新异动时才唤醒 Agent** 深挖原文与评论区，按「情报三联单」分级归档。 |
| **`social-patrol.md`**<br>*(社媒热点与跨网信息差巡检)* | `guards/social-window-guard.mjs` | 每 4 小时 (`30 */4 * * *`) | 守卫脚本确认处于人类活跃时间窗（默认 `08:00–22:00`，夜间静默不唤醒）且冷却完毕后，唤醒 Agent 操作 **公司 Agent 浏览器**（复用已登录态），按顺序串行巡检 **X (Twitter) → 小红书 → YouTube**，专门捕捉**「外网已爆、内网空白」的跨网信息差**、**低粉爆款钩子**与**评论区「求教程」痛点**。 |
| **`deep-recon.md`**<br>*(专项情报深挖与竞品侦察)* | 无（按需点跑槽位） | 按需触发（无 `trigger` 定时钟） | 当你对公司负责人说*「帮我深扒一下某竞品/某赛道的定价和用户差评」*，或哨兵发现 S 级线索需顺藤摸瓜时，由负责人带 `brief` 立即拉起，结合 `web-recon` 技能（`webfetch` + `browse`）跨平台产出一手调研报告 `recon/YYYY-MM-DD-<topic>.md`。 |

---

## 目录与数据流契约

```text
projects/radar/
├── README.md
├── dashboard.html                # 交互式看板（S/A/B 信号三联单、跨网信息差、监测源矩阵），由 scripts/radar-ctl.mjs refresh 注入数据
├── dashboard-data.json           # 看板数据快照（自动生成）
├── scripts/
│   └── radar-ctl.mjs             # 汇总 watchlist.json 与 signals/*.md 的 JSON 数据块，刷新看板
├── watchlist.json                # 统一监测配置（赛道画像、加权/屏蔽词、公开源、社媒渠道开关）
├── guards/
│   ├── radar-sentinel.mjs        # 公开源 0 Token 增量嗅探与去重脚本
│   └── social-window-guard.mjs   # 社媒浏览器巡检时间窗与冷却守卫脚本
├── tasks/
│   ├── signal-watch.md           # 公开信源异动深挖与分级（S/A/B/Noise）
│   ├── social-patrol.md          # 社媒串行巡检与跨网信息差核验
│   └── deep-recon.md             # 按需触发的专项情报深挖与竞品侦察槽位
├── .state/                       # 运行期自动维护的去重与候选状态（自动生成）
├── recon/                        # 专项深挖调研报告归档（YYYY-MM-DD-<topic>.md）
└── signals/                      # 沉淀的情报档案（供 studio / wealth / brain / daily-patrol 跨项目读取）
    ├── YYYY-MM-DD.md             # 公开源精选情报三联单
    └── social-YYYY-MM-DD.md      # 社媒爆款拆解与跨网信息差档案
```

---

## 怎么定制？（只动嘴，不改代码）

你不需要手动编辑 `watchlist.json`。直接在 Munk AI 主页右栏对 **公司负责人（Company Owner）** 说：

- *“我现在主攻跨境独立站和 TikTok 选品，帮我把雷达的关键词和监测源换成跨境电商方向。”*
- *“帮我在雷达里加上这几个同行博客的 RSS，另外把 YouTube 巡检打开、小红书先关掉。”*
- *“如果某个社媒登录过期了，在『要你』里喊我扫码就行。”*
