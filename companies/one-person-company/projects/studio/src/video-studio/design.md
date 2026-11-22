---
name: One-Person Studio Motion System
themes:
  dark-keynote:
    background: "#070A0F"
    surface: "#0F1623"
    surface-elevated: "#162033"
    border: "#1E2D45"
    text-primary: "#F8FAFC"
    text-secondary: "#94A3B8"
    text-muted: "#64748B"
    accent-emerald: "#3DDC84"
    accent-cyan: "#38BDF8"
    accent-amber: "#F59E0B"
    accent-rose: "#F43F5E"
  clean-editorial:
    background: "#F8FAFC"
    surface: "#FFFFFF"
    surface-elevated: "#F1F5F9"
    border: "#E2E8F0"
    text-primary: "#0F172A"
    text-secondary: "#475569"
    text-muted: "#94A3B8"
    accent-emerald: "#059669"
    accent-cyan: "#0284C7"
    accent-amber: "#D97706"
    accent-rose: "#E11D48"
typography:
  headline:
    fontFamily: "'PingFang SC', 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif"
    fontWeight: 800
    lineHeight: 1.15
  mono:
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace"
    fontWeight: 700
  caption:
    fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif"
    fontWeight: 700
motion:
  energy: high
  easing:
    entry: "expo.out"
    connector: "power2.inOut"
    emphasis: "back.out(1.4)"
---

# Studio Motion Design Rules

1. **画布零长文（Zero Long Text on Canvas）**：画面绝不放整段文字或超过 12 字的句子。所有长句全部进入底部同步中文字幕条（`.caption-rail`）与语音音轨。
2. **每一镜必有定制动态隐喻（Bespoke Visual Metaphor）**：禁止做静态翻页 PPT。每个观点必须转化为具体的 SVG 拓扑连线、动态跳字账单、漏斗过滤或状态卡片流转，并随口播时间戳（`fragments`）分步触发。
3. **双画幅安全区硬约束**：
   - **竖屏 `9:16`（`1080×1920`）**：顶部预留 `240px`（防状态栏），底部预留 `400px`（容纳同步中文字幕轨 + 避让平台左下角文案与右侧点赞栏），核心动态图形集中在中部 `1080×1280` 黄金舞台区。
   - **横屏 `16:9`（`1920×1080`）**：四周内边距 `72px`，底部预留 `140px` 电影感字幕轨，同时写入 `application/hyperframes-slideshow+json` 的 `notes` 供真人演讲复用。
