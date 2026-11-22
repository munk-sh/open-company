---
name: hyperframes-motion-craft
description: HyperFrames + GSAP 动态图形视频编码与自检工艺。供 worker 子专员加载，根据已测时的 scenes.json 手写每期定制的 SVG/CSS/GSAP 动画，并通过 check 门禁渲染成片。
---

# HyperFrames Motion Craft（定制动态图形视频编码工艺）

本技能供 `studio` 的 `worker` 子专员（或主会话）在 `src/video-studio/` 工程中编写**每一期定制的 HTML/SVG 视觉结构与 GSAP 时间轴动画**。
我们的目标是：**绝不做死板的模板翻页 PPT，每一镜都要根据当期 `scenes.json` 的 `visualMetaphor` 写出丝滑、精准卡点的动态图形代码**。

---

## 一、 工程生命周期与目录铁律（防膨胀架构）

所有构建操作统一在 `src/video-studio/` 下通过 `scripts/studio-ctl.mjs` 完成：

1. **挂载工作台**：当前视频挂载在 `src/video-studio/workspace/` 下（已自动软链 `shared/` 公共库）。
2. **你只需要编辑 `workspace/` 下的 3 个定制源码文件**：
   - `workspace/index.html`：本期所有场景的 DOM 与手绘 SVG 结构；
   - `workspace/episode.css`：本期特有的布局与定制组件样式（通用变量、安全区、卡片与字幕条已在 `shared/styles/base.css` 中提供）；
   - `workspace/timeline.js`：本期专属的 GSAP 动画时间轴（对齐 `workspace/scenes.json` 测算好的精确秒数）。
3. **严禁直接塞入巨型静态文件**：音频由 `node scripts/synth-tts.mjs` 生成在 `workspace/audio/`，渲染归档时调用 `node scripts/studio-ctl.mjs archive` 会自动把 4 个纯文本源码（`~30KB`）同步回 `../../episodes/YYYY-MM/<slug>/` 并清空临时缓存。

---

## 二、 视觉与定制动画 6 条军规（继承自 DevFest Keynote 规范）

1. **画布零长文（Zero Long Text on Canvas）**：
   - 画面上绝不允许出现整段句子或密集列表！
   - 每个节点/卡片上的中文词组控制在 **4–10 个字**以内，搭配超大号等宽数字（`.metric-hero`，如 `2.5h ➔ 3m`、`0 Token`、`90%`）和状态徽标（`.status-pill.ok|.warn|.danger`）。
   - 完整口播台词已由底部 `.caption-rail`（苹方中文字幕轨）同步呈现。
2. **声画严丝合缝（Audio-Driven Timing）**：
   - 必须读取 `workspace/scenes.json` 中由 `synth-tts.mjs` 算出的每一镜 `startTime`、`duration`、`fragments[]` 和 `cues[]`。
   - `index.html` 中 `#root` 的 `data-duration` 必须等于 `scenes.json` 的 `totalDuration`；每个 `<section class="clip">` 的 `data-start` 和 `data-duration` 必须与对应 Scene 完全一致。
   - 若生成了 `.mp3` 语音文件，在 `#root` 内挂载对应的 `<audio>` 音轨标签。
3. **每镜必有段内分步动画（Fragment Choreography）**：
   - 严禁一整镜 8 秒钟画面静止不动！
   - 必须利用 `scene.fragments`（每句话的切换秒数），在 `timeline.js` 中编排分步动作：
     - **节点递进点亮**：用 `window.StudioMotion.revealGroup(tl, ".s1-node", atTime, { stagger: 0.12 })`；
     - **SVG 连线生长**：手绘 `<svg>` 连接线，用 `window.StudioMotion.drawSvgPath(tl, "#s1-arrow", fragmentTime, 320)` 让箭头随语音实时画出；
     - **状态跃迁与高亮**：在转折句秒数（`fragmentTime`）用 `tl.to("#target-card", { borderColor: "#3DDC84", scale: 1.03, duration: 0.35 }, fragmentTime)` 制造视觉焦点。
4. **HyperFrames 时间轴注册硬约束**：
   - 根时间轴必须注册在 `window.__timelines["root"] = gsap.timeline({ paused: true })`（直接调 `window.StudioMotion.createRootTimeline(...)` 即可）；
   - 加入根时间轴的任何子时间轴**绝不能**设为 `paused: true`，否则拖拽或渲染寻帧时会卡死；
   - 严禁使用 `Math.random()`、`Date.now()` 或外部网络请求，所有动画必须 100% 确定性可复现。
5. **横竖屏安全区自适应**：
   - **竖屏 `9:16`（`data-width="1080" data-height="1920"`）**：内部网格优先采用**纵向流（单列或上下对比）**，保证手机竖屏字体够大、布局不挤；
   - **横屏 `16:9`（`data-width="1920" data-height="1080"`）**：优先采用**左右双栏或横向拓扑流**，并在 `<head>` 内同步写入 `<script type="application/hyperframes-slideshow+json">`（含 `slides` 与 `notes`），让横屏视频天然兼具互动演讲 PPT 能力。
6. **沉淀惊艳积木（Block Promotion）**：
   - 如果你在本期写出了非常通用且惊艳的 SVG/CSS 动效结构，可将其 CSS/HTML 范式提取到 `src/video-studio/shared/blocks/` 下，供后续剧集复用。

---

## 三、 强制自检门禁（Checklist & Gate）

写完 `index.html`、`episode.css` 与 `timeline.js` 后，**必须**在 `src/video-studio/` 目录下执行：

```bash
node scripts/studio-ctl.mjs check
```

- 该命令会调用 `npx --yes hyperframes@0.9.0 check` 对 **语法 Lint、运行时错误、DOM 文字溢出/遮挡、动画可寻址性、颜色对比度** 进行全套扫描。
- **门禁铁律**：只要 `check` 报任何 Error，必须在当前 `worker` 会话内当场修改代码并重跑 `check`，**直到 0 Error 通过后**，才允许执行渲染或归档交差！
