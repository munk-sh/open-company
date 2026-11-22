# 一人公司 · 超级个体 (One-Person Company)

这是一套严格遵循 **`open-company/v0`** 规范打造的「一人公司（超级个体）」AI 运营班子模板。

导入 Munk AI 后，你就是这家公司的 CEO：**主页右栏的「公司负责人」是你的全职幕僚长，左栏的 5 大常驻部门（情报雷达、第二大脑、内容工坊、财富与搞钱、每日巡检）按任务钟与零 Token 守卫替你自主运转**。只有高价值选题拍板、正式发稿、登录解锁与真金白银的交易确认才会进入 **「要你」** 队列（支持桌面端与飞书 / 钉钉 / Telegram 远程批复）。

---

## 目录全景与架构说明

```text
one-person-company/
├── Companyfile.yaml                         # open-company/v0 公司身份契约
├── AGENTS.md                                # 公司总宪章（主线目标、幕僚长分流规则、五大部门协同纪律）
├── skills/                                  # 5 项公司级共享技能（导入后自动注册至主机技能库）
│   ├── web-recon/SKILL.md                   # 三级网页与社媒情报提取路由（API -> webfetch -> browse）
│   ├── second-brain/SKILL.md                # 去碎片化常青认知卡合成法与 Inbox Zero 规程
│   ├── brand-voice/SKILL.md                 # 个人语感克隆与去 AI 味三刀手术规范
│   ├── wealth-ledger/SKILL.md               # 真实有效时薪 (EHR) 算盘、反脆弱配置与账本规范
│   └── company-cadence/SKILL.md             # 08:00 晨报 MIT 对齐 + 21:00 复盘规则进化节律
└── projects/                                # 5 大常驻经营部门（共 15 项任务 + 6 个 0-Token 守卫）
    ├── radar/                               # 📡 情报雷达：公开信源哨兵 + 社媒信息差巡检 + 专项深挖
    │   ├── guards/
    │   │   ├── radar-sentinel.mjs           # 0 Token 拉取 HN/GitHub/RSS 去重初筛
    │   │   └── social-window-guard.mjs      # 社媒活跃时间窗与平台冷却守卫
    │   ├── scripts/radar-ctl.mjs            # 信号池统计与 dashboard.html 刷新引擎
    │   └── tasks/
    │       ├── signal-watch.md              # 公开信源异动哨兵（每小时预检）
    │       ├── social-patrol.md             # 社媒热点与跨网信息差巡检（每 4 小时预检）
    │       └── deep-recon.md                # 专项情报深挖与竞品侦察（按需点跑槽位）
    ├── brain/                               # 🧠 第二大脑：碎片内化、常青认知卡与火花池唯一写入口
    │   ├── guards/brain-inbox-guard.mjs     # 0 Token 监测 inbox/ 投喂与 radar 联动信号
    │   ├── scripts/brain-ctl.mjs            # 常青卡、火花池与原则索引看板刷新引擎
    │   └── tasks/
    │       ├── inbox-digest.md              # 碎片内化与常青认知卡合成（每 2 小时预检）
    │       └── weekly-synthesis.md          # 周度认知串联与思维底座进化（每周日晚）
    ├── studio/                              # 🎨 内容工坊：选题炼金、多端母本裂变、HyperFrames 动态视频与语感进化
    │   ├── .opencode/skills/                # 6 项内容工坊专属技能（选题冲突模型、公众号、小红书、X、口播、动态视频）
    │   ├── guards/studio-pitch-guard.mjs    # 0 Token 检测未提报火花与新鲜信号
    │   ├── scripts/content-ctl.mjs          # 选题/草稿/成片/语感看板刷新引擎
    │   ├── src/video-studio/                # HyperFrames + GSAP 单槽工作台与神经语音测时脚本
    │   └── tasks/
    │       ├── topic-pitch.md               # 每日选题炼金会（每日 10:00 预检）
    │       ├── content-forge.md             # 母本打磨与多端精铸（按需点跑槽位）
    │       ├── video-forge.md               # 动态视频与演讲 Deck 精铸（按需点跑槽位）
    │       └── voice-evolver.md             # 语感进化与手改学习（每周日晚）
    ├── wealth/                              # 💰 财富与搞钱：毒舌商机测算、多源只读对账与四层反脆弱资产体检
    │   ├── .opencode/skills/                # 3 项财富专属技能（浏览器只读对账、EHR 报价参谋、资产再平衡）
    │   ├── guards/deal-sentinel.mjs         # 0 Token 监测新搞钱火花、待处理账单、吸血鬼订阅与到期 AR
    │   ├── scripts/wealth-ctl.mjs           # 净值/跑道/现金流/订阅燃烧确定性计算引擎
    │   └── tasks/
    │       ├── deal-and-quote.md            # 搞钱火花毒舌尽调与商务报价参谋（每日 12:00 预检）
    │       ├── cashflow-and-billing.md      # 浏览器自动对账与收支订阅审计（每日 20:00 预检）
    │       └── wealth-allocation-review.md  # 净值盘点与资产配置再平衡体检（每周日晚）
    └── daily-patrol/                        # ☀️ 每日巡检：08:00 一页纸晨报、MIT 必赢战役盯盘与 21:00 规则进化
        ├── .opencode/skills/                # 2 项巡检技能（一页纸高管简报、人类决策偏好规则提炼）
        ├── guards/cadence-sentinel.mjs      # 早晚窗口幂等防重跑守卫
        ├── scripts/patrol-ctl.mjs           # 跨部门数据聚合与全公司总控看板刷新引擎
        └── tasks/
            ├── morning-brief.md             # 早间一页纸拍板简报（每日 08:00）
            ├── mit-tracker.md               # 今日重点战役进度盯盘（工作日 12:00 / 17:00）
            └── nightly-review.md            # 晚间进度盘点与规则进化（每日 21:00）
```

---

## 跨部门单写者契约（Single-Writer & Read-Only Sibling）

为严格匹配 Munk AI 的项目沙箱边界（每个任务仅写自身项目目录，跨部门通过 `reads.projects` 声明只读访问）：

1. **`radar` 只写自身 `signals/` 与 `recon/`**，通过 `→ studio` / `→ wealth` / `→ brain` 路由标记通知下游守卫。
2. **`brain` 是 `sparks.md` 与 `topics/` 的唯一写入口**：`studio` 与 `wealth` 只读消费火花并在各自目录（`pitches/`、`drafts/`、`deals-and-offers.md`）记录关联 `SPARK-*` 编号，守卫自动去重，由 `brain` 在认知对账中统一归档。
3. **`daily-patrol` 通过 `reads.projects` 只读聚合四大部门看板快照**，向人类呈报晨夕简报并将成熟经验提请负责人合入公司级 `AGENTS.md`。

---

## 如何定制成你自己的「一人公司」？（零配置，直接对话）

1. **一键导入 Munk AI**，打开首页（`/` 公司主页）。
2. **跟右栏的「公司负责人」聊三句话**：
   告诉它你目前关注的赛道、平时发什么平台、靠什么变现、哪些部门任务想立即开启定时钟。负责人会自动帮你更新 `AGENTS.md`、设定当前阶段主线（`goal.md`）并按需开启各部门任务开关。
3. **（可选）登录一次「公司 Agent 浏览器」**：
   在左栏开启并登录你常用的社媒或创作者结算后台，让 `radar`、`studio` 与 `wealth` 在只读/草稿红线内替你自动巡检、填草稿与对账。
