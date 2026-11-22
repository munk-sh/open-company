# 视频成片与封面交付仓 (`renders/`)

本目录存放由 `video-forge` 任务最终导出的 `.mp4` 视频成片及横竖屏封面图（按 `<slug>/` 归档）。

## 自动瘦身策略
为防止大量历史高清 `.mp4` 撑爆磁盘，可在 `../src/video-studio/` 下运行：
```bash
node scripts/studio-ctl.mjs prune --keep 15
```
自动清理超出最近 15 期的历史 `.mp4` 大文件（封面图与 `../episodes/` 下的纯文本源码永久保留，随时可一键无损重渲）。
