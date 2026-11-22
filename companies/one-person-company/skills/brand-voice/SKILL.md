---
name: brand-voice
description: 个人语感校准、去 AI 味改写手术与内容工坊协同协议。供公司负责人日常对话润色、studio 撰稿自检、以及从手改定稿中提炼语感进化规则时调用。
---

# Brand Voice（个人语感校准与去 AI 味手术刀）

本技能让整家「一人公司」对外发出的每一段文字——无论是负责人在聊天框顺手帮你润色的一条朋友圈、一条评论回复，还是 `studio` 部门精铸的公众号深度长文、小红书图文、X 串推和视频口播——都带着你鲜明的个人烙印，彻底消灭一眼假的「AI 腔 / 爹味公文风」。

---

## 一、 语感真源（Single Source of Truth）

所有与「我是谁、怎么说话、讨厌什么词、代表性真迹长什么样」相关的活体数据，均存放在 `projects/studio/voice/` 目录下（相对于公司根目录；若在 `studio` 项目内运行则为 `./voice/`）：

1. **`voice/persona-and-lore.md`（人设边界与个人经历锚点库）**
   - 规定「我是谁、我跟读者是什么关系、我绝不扮演什么角色」。
   - 收录你的**真实背景、在做的事、踩过的坑、算过的真账与高频口头禅**。
   - **铁律**：举例或讲故事时，只准引用 `persona-and-lore.md` 或 `projects/brain/topics/*.md` 里的真实案例，**严禁生造「假设某大厂产品经理小明」之类的虚假故事**。
2. **`voice/anti-slop-rewrites.md`（去 AI 味黑名单与句法改写对照表）**
   - 收录绝对禁用词、禁用句式结构、「典型 AI 废话 $\rightarrow$ 真人表达」改写对照表、以及交稿前 10 项主编自检红线。
3. **`voice/golden-samples/`（分体裁真迹语料库）**
   - `deep-essay-samples.md`：写公众号/博客深度长文、商业拆解、复盘时必读的 Few-Shot 标杆段落。
   - `punchy-social-samples.md`：写小红书、X (Twitter)、即刻、朋友圈、短视频口播时必读的短句与情绪钩子标杆。

---

## 二、 三种调用场景与标准动作

### 场景 A：公司负责人（`company-owner`）在日常对话中顺手改稿/润色
当用户在主页对话中直接丢来一段草稿或想法（如：*「帮我润色一下这段发朋友圈的话」*、*「把这段回复改得像人话一点、别太客套」*）：
1. **不派重型后台任务**：直接在当前会话先读 `projects/studio/voice/persona-and-lore.md`、`projects/studio/voice/anti-slop-rewrites.md` 与 `projects/studio/voice/golden-samples/punchy-social-samples.md`。
2. **给 2 个梯度版本**：
   - **版本 1（克制务实版）**：砍掉所有废话和修饰词，直接亮数字、事实和结论；
   - **版本 2（网感锋利版）**：痛点或反常识结论前置，短句断行，结尾留一个自然的同行互动钩子。
3. 如果用户顺手给了一条很有潜力的长文选题，除了给短评版本外，主动问一句：*「这个切入点很适合展开成一篇深度稿/小红书图文，要不要我派 `studio` 的 `content-forge` 帮你出一套完整多端草稿？」*

### 场景 B：`studio` 部门任务（`topic-pitch` / `content-forge`）撰稿与去 AI 味自检
任何成稿落盘到 `projects/studio/drafts/` 之前，必须完整走完 **「去 AI 味三刀手術（3-Pass Surgery）」**：
1. **第一刀：砍帽去尾（Kill the Intro & Outro）**
   - 检查第一段是不是在宏观叙事（如“随着 AI 的飞速发展…”、“最近很多人讨论…”）。如果是，**直接整段删掉**，从原本的第二段（具体场景、具体账单、反直觉结论）开篇。
   - 检查最后一段是不是在喊口号或机械总结（如“总而言之，未来属于…”）。如果是，改成一个具体的行动建议或留给读者的真实问题。
2. **第二刀：词句换血（Lexical & Syntactic Swap）**
   - 对照 `voice/anti-slop-rewrites.md`，清空所有黑名单词汇（赋能、抓手、闭环、底层逻辑、双刃剑、不言而喻等）。
   - 打碎连续 3 句以上字数相近的对仗排比句；将超过 45 字的复合长句拆成有呼吸感的短句。
3. **第三刀：锚点核验（Lore & Brain Verification）**
   - 检查文中的每个核心论点是否都有来自 `brain/topics/*.md`、`radar/signals/` 或 `voice/persona-and-lore.md` 的真实细节（数字、耗时、踩坑现场）支撑。没有细节支撑的空洞道理一律删掉。

### 场景 C：`company-owner` 派发 `studio` 任务的路由协议
当用户需要体系化选题或成稿时，负责人通过 `POST /tasks/:taskId/runs`（带 `brief`）调度 `studio` 部门的 3 个任务：
- **让我挑选题** $\rightarrow$ 触发 `studio` 的 **`topic-pitch`**：`brief` 写明近期关注方向或指定消费哪些新灵感；
- **指定角度出多端成稿** $\rightarrow$ 触发 `studio` 的 **`content-forge`**：`brief` 写明：① 核心立意/靶子、② 需引用的 `brain/topics/` 卡片或 `radar` 信号路径、③ 目标分发平台（公众号 / 小红书 / X / 视频口播）；
- **生成动态图形视频 / 演讲 Deck** $\rightarrow$ 触发 `studio` 的 **`video-forge`**：`brief` 写明源草稿路径（或视频主题）、画幅（`9:16` 竖屏短视频或 `16:9` 横屏长视频/演讲 Deck）及重点视觉隐喻要求；
- **我改完定稿了，让它学我的改法** $\rightarrow$ 将定稿存入 `projects/studio/published/` 后，触发 `studio` 的 **`voice-evolver`**：对比 `drafts/` 初稿与 `published/` 终稿的 Diff，自动把你删掉的讨厌词句追加进 `anti-slop-rewrites.md`，把你改写得精彩的段落补进 `golden-samples/`。
