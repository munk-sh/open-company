# ✍️ 内容工坊 (Content Studio)

`studio` 是「一人公司」的对外影响力引擎。它绝不生产千篇一律的「AI 正确的废话」，而是将 **`radar` 抓到的新鲜热点** 与 **`brain` 沉淀的个人独特认知** 碰撞，通过 **三维语感引擎 (`voice/`)** 和 **项目级多平台工艺技能 (`.opencode/skills/`)**，精铸出像你亲手写出来的深度长文、小红书图文分镜、X 串推与视频口播稿。

---

## 一、 架构与目录说明（严格对齐 Munk 权限与技能分层）

```text
projects/studio/
├── README.md
├── dashboard.html                              # 【内容工坊看板】Kanban 流水线、3大支柱配比进度条、分镜时间轴、语感资产统计
├── dashboard-data.json                         # 看板数据快照（自动生成）
├── scripts/
│   └── content-ctl.mjs                         # 聚合 pitches/drafts/episodes/published/voice，刷新 dashboard.html
├── pillars.md                              # 【战略层】3大内容支柱(专栏定位)与目标读者画像
├── voice/                                  # 【活体语感库：允许 Task 动态读写进化】
│   ├── persona-and-lore.md                 # 1. 我是谁：人设边界、真实经历/踩坑史锚点（严禁AI瞎编假案例）
│   ├── anti-slop-rewrites.md               # 2. 去AI味手术刀：禁用词黑名单 + 句法改写对照表 + 10项自检红线
│   └── golden-samples/                     # 3. 分体裁真迹语料库（Few-Shot 标杆）
│       ├── deep-essay-samples.md           #    - 深度长文与复盘真迹段落
│       └── punchy-social-samples.md        #    - 小红书/X/即刻/口播真迹段落
├── .opencode/
│   └── skills/                             # 【战术工艺层：项目私有 Skill，供主会话与 worker 按阶段加载】
│       ├── angle-alchemy/SKILL.md          # 1. 选题炼金术：6大反平庸冲突模型 + 20分制选题打分器
│       ├── wechat-deep-essay/SKILL.md      # 2. 公众号/博客长文工艺：标题母版 + 前200字破题 + 3套骨架
│       ├── xiaohongshu-pack/SKILL.md       # 3. 小红书图文工艺：竖版封面大字公式 + P1-P6滑动卡片分页脚本 + SEO
│       ├── x-and-social/SKILL.md           # 4. X串推与社交短贴工艺：单条暴论公式 + 1/N 阶梯式 Thread
│       ├── video-podcast-script/SKILL.md   # 5. 口播逐字稿与动态视觉隐喻分镜（scenes.json）设计工艺
│       └── hyperframes-motion-craft/SKILL.md # 6. HyperFrames + GSAP 定制动态图形视频编码、check 门禁与归档工艺
├── src/
│   └── video-studio/                       # 【共享视频母机：公共画布/原语 + 单槽 workspace + TTS 测时脚本】
│       ├── shared/                         #    - 16:9 & 9:16 安全区、苹方同步字幕轨、StudioMotion 原语、可复用 blocks/
│       └── scripts/                        #    - studio-ctl.mjs (init/mount/check/render/archive) & synth-tts.mjs
├── episodes/                               # 按 YYYY-MM 分桶的每期视频纯文本定制源码归档（每期 ~30KB，100期不膨胀）
├── renders/                                # 导出的 MP4 视频成片与横竖屏封面图（支持 prune 自动瘦身）
├── pitches/                                # 每日选题提案池（YYYY-MM-DD.md，每次只出 2 个高张力角度让你挑）
├── drafts/                                 # 待你审阅的多平台成稿包（YYYY-MM-DD-<slug>.md）
├── published/                              # 已定稿/已发布作品归档（防重复写 + 供 voice-evolver 学习）
├── guards/
│   └── studio-pitch-guard.mjs              # 0-token 预检：有未处理 studio 灵感或新 radar 信号且今日未提案才唤醒
└── tasks/
    ├── topic-pitch.md                      # 1. 每日选题炼金会（每天 10:00 + Guard 守门）
    ├── content-forge.md                    # 2. 母本打磨与多端精铸（按需触发，支持派 worker 按平台并行精铸）
    ├── video-forge.md                      # 3. 动态视频与演讲 Deck 精铸（task + worker + skill 定制 SVG/GSAP 动画视频）
    └── voice-evolver.md                    # 4. 语感进化与手改学习（对比初稿与你的手改终稿，自动更新 voice/*）
```

> **配套公司级技能**：`../../skills/brand-voice/SKILL.md`（供 `company-owner` 在日常聊天中顺手帮你润色短文案、以及调度 `studio` 任务）。

---

## 二、 日常怎么用最爽？

1. **每天看一眼早间选题提案（或直接口述想法）**：
   - 当 `brain/sparks.md` 或 `radar/signals/` 有新料时，`topic-pitch` 会在 10:00 给你呈上 **2 个带冲突张力的选题切入点**；
   - 你只需对负责人说一句：*「写今天第 1 个选题，出公众号和小红书图文」*（或者哪怕没看提案，直接对负责人说：*「我今天想吐槽一下 XX，让 studio 出篇推文和小红书」*）。
2. **一键拿多端原生稿件**：
   - `content-forge` 会自动读取你在 `brain/topics/` 里的真实观点和 `voice/` 里的人设真迹，按对应平台的 `.opencode/skills/` 产出一套经过 10 项去 AI 味自检的成稿，放进 `drafts/`。
3. **越改越像你（手改进化闭环）**：
   - 你对 `drafts/` 里的草稿随手改了几刀并定稿后，告诉负责人：*「这篇我改好了，归档并学习一下我的改法」*；
   - `voice-evolver` 会自动对比你删掉了哪些词、改写了哪些句子，把新规则写回 `voice/anti-slop-rewrites.md` 和 `voice/golden-samples/`。
