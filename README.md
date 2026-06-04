# GSAP Composition

从源内容到视频场景的完整管线：**源内容 → tts_script.md → HTML + GSAP 动画 → 视频渲染**。

GSAP 使用官方 [GreenSock](https://github.com/greensock/GSAP) 库，提供三种渲染方案：连续画布（DOM）、滚动画布（Swipe-Slider）、纯 Canvas 2D（高可靠性长视频首选）。

## 安装

将此目录放入任意 `.claude/skills/` 下即可作为 Claude Code 技能使用。

依赖：
```bash
npm install gsap          # GSAP 动画库（必需）
pip install edge-tts      # TTS 语音生成（可选）
brew install ffmpeg        # 音频/视频处理（可选）
npx hyperframes            # HTML → MP4 渲染（可选，首次自动安装）
```

## 快速开始

```bash
# 1. 环境检查
bash scripts/check-env.sh

# 2. 从源内容生成视频 HTML（由 Claude Code agent 执行）
#    Agent 会按 SKILL.md 工作流：源内容 → tts_script.md → HTML → 视频

# 3. 生成 TTS 音频（可选）
bash scripts/audio-tts.sh <项目目录> 8.0

# 4. 渲染视频（可选）
bash scripts/render.sh <项目目录> <TTS总时长>
```

## 目录结构

```
├── SKILL.md              — 主技能文件
├── scripts/              — 7 个可执行脚本
│   ├── check-env.sh      — 环境检查
│   ├── split-tts.js      — tts_script → txt 拆分
│   ├── audio-tts.sh      — TTS + 锚点表 + BGM
│   ├── parse-vtt.js      — VTT → JSON 字幕
│   ├── subtitle-split.py — 长字幕拆分 + 时序
│   ├── skeleton.js       — HTML 骨架（PRNG + timeline）
│   └── render.sh         — lint → render → 裁切
└── references/           — 8 个参考文档
    ├── tts-script.md     — TTS 脚本格式 + 框架速查
    ├── frameworks.md     — 4 框架页面映射
    ├── patterns.md       — 10 类动画模式 + 完整代码
    ├── audio-guide.md    — 音频生产完整指南
    ├── canvas-render.md  — Canvas 2D 框架 + helpers
    ├── subtitle-guide.md — 字幕拆分 + 时序对齐
    ├── hf-rules.md       — 视频渲染集成约束
    └── workflow-demo.md  — 完整制作流程 Demo
```

## 核心规则

1. **场景时间对齐**：HTML 场景时间取自 `timing_reference.md` 精确值，禁止使用预估时长
2. **TTS 先行**：TTS 配音总时长 = 视频总时长，动画匹配音频
3. **Canvas 优先**：长视频 (>2min) 或含复杂排版时，Canvas 立即模式比 DOM 更可靠
