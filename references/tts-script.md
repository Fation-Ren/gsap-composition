# TTS 脚本格式规范

输入文案需符合 `tts_script.md` 格式。每段标注类型、TTS 文本和预估时长。

## 格式模板

```markdown
## 封面
- 标题：<视频主标题>
- TTS文本：<封面旁白文本>
- 预估TTS时长：8秒
- 动画：char-flyin 逐字飞入

## 正文段落 N
- TTS文本：<段落旁白文本>
- 预估TTS时长：10秒
- 动画：card-stagger 卡片弹入

## 数据展示
- TTS文本：<数据展示旁白>
- 预估TTS时长：8秒
- 动画：counter 数字跳动 + data-bar

## CTA收尾
- TTS文本：<结尾号召语>
- 预估TTS时长：10秒
- 动画：slow-flyin + breathe
```

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| 标题 | 封面必填 | 视频主标题，用于 char-flyin 动画 |
| TTS文本 | 必填 | 旁白文本，所有标点保留，用于 TTS 合成和字幕 |
| 预估TTS时长 | 必填 | 按中文 ~4字/秒 估算，实际以 edge-tts 生成为准 |
| 动画 | 建议 | 主要动画模式，详见 `references/patterns.md` |

## 框架类型

4 种标准框架，6 页基础，可扩展至 8-9 页。详见 `references/frameworks.md`。

| 框架 | 适用场景 | 结构 |
|------|---------|------|
| SCR | 行业趋势/技术变革 | Situation → Complication → Resolution → Evidence → CTA |
| PAS | 行业乱象/用户痛点 | Problem → Agitate → Solve → Evidence → CTA |
| VVV | 辟谣/反常识 | 你以为 → 实际上 → 深层原因 → Evidence → CTA |
| 红杉 | 创业/投资判断 | 赛道 → 痛点 → 方案 → 数据 → CTA |

## 动画模式速查

| 页面类型 | 主模式 | 辅助模式 |
|---------|--------|---------|
| 封面 | char-flyin | multi-ring + double-ghost + accent-dots |
| 数据展示 | counter + card-stagger | card-glow + trend-indicators |
| 对比论证 | vs-slide | arrow-burst + double-data-bar |
| 证据列举 | platform-grid + counter | platform-color-coding + trend-up |
| CTA收尾 | slow-flyin + breathe | multi-ring + ghost-num |
