# 热点雷达（Radar）

这个项目负责让频道第一时间看到真实的外部信号，而不是靠凭空想选题。

- `guards/radar-sentinel.mjs`：零 Token 预检脚本。拉取 `watchlist.json` 里的公开免鉴权源（HN、GitHub Trending RSS、公开博客），去重并按关键词加权；严格遵循 `0 唤醒 / 1 跳过 / 2 报错` 退出码协议：有新信号 exit 0，至少一个源成功但无新信号 exit 1，配置缺失损坏、未捕获异常或全部外部源抓取失败则向 stderr 写明原因并 exit 2。
- `watchlist.json`：频道画像、关键词与真实公开信源；首轮对话确认赛道后替换 `profile` 与 `keywords`。
- `tasks/public-signal-scan.md`：每小时执行的公开信源扫描。
- `tasks/social-trend-scan.md`：每 4 小时或手动触发的社媒热点与跨网信息差扫描。

所有信号都要保留原始链接。没有抓到新信号时，写「本轮暂无新信号」，不要编造热点。
