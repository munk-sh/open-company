# 剧集定制源码归档仓 (`episodes/`)

本目录按 `YYYY-MM/<slug>/` 存放每一期动态视频的 **4 个纯文本定制源码文件**（单期仅 ~30KB，做 100 期也只有 ~3MB，绝不存放 `.mp3` 或 `.mp4` 等重型二进制文件）：

1. `scenes.json`：分镜设计、口播台词、动态视觉隐喻说明、以及由 `synth-tts.mjs` 测算锁定的精确起止秒数与字幕时间戳；
2. `index.html`：本期定制的画面 DOM 与 SVG 拓扑结构；
3. `episode.css`：本期特有的补充样式（公共画布、安全区与基础组件继承自 `../src/video-studio/shared/`）；
4. `timeline.js`：本期专属的 GSAP 动画关键帧编排。

## 如何重新挂载与编辑历史视频？
在 `../src/video-studio/` 下执行：
```bash
node scripts/studio-ctl.mjs mount 2026-11/<slug>
node scripts/synth-tts.mjs
```
即可将任意一期历史视频重新挂载到 `workspace/` 进行微调、预览或重渲染。
