# Audio Production Guide — TTS + BGM

## 核心原则

**TTS 先行 → 字幕对齐 → 动画匹配。** 不依赖 data-start 偏移，音频自带静音前缀。

---

## 1. TTS 逐句分段 + 锚点表

### 流程

```
按字幕行拆分为独立 .txt → edge-tts 逐段生成 .mp3 → ffprobe 测量时长 → 构建锚点表
```

### Step 1: 按字幕行拆分

一个 `.txt` 文件 = 一行字幕 = 一个 setSub 调用的文本。命名规范：`s1_01.txt`, `s1_02.txt`, ...

### Step 2-4: 批量生成 + 锚点表 + 合并

自动化脚本（一键完成全部音频生产）：
```bash
bash scripts/audio-tts.sh <项目目录> <封面静音秒数> <TTS语音> <语速>
# 示例: bash scripts/audio-tts.sh gsap/ 8.0 zh-CN-XiaoxiaoNeural -5%
```

该脚本执行：逐句生成 TTS → ffprobe 测量 → 构建 timing_reference.md → adelay+apad 合并 → BGM 循环降噪。
手动步骤参考下方。

输出 `timing_reference.md`:
```
| 段 | 起始(s) | 时长(s) | 结束(s) |
|----|---------|---------|---------|
| s1_01 | 8.00 | 24.41 | 32.41 |
| s1_02 | 32.41 | 34.30 | 66.70 |
...
```

### Step 4: 合并音频（含封面静音）

由 `scripts/audio-tts.sh` 自动完成。方法：adelay + apad（推荐），concat demuxer 不稳定不推荐。

**为什么不用 data-start？** 视频渲染工具中 `data-start` 属性可能不可靠。将静音直接嵌入音频文件是最稳妥的做法。

---

## 2. BGM 降音量 + 循环

由 `scripts/audio-tts.sh` 自动完成。`-stream_loop -1` 循环到 TTS 总时长，`volume=-10dB` 降噪。

在 HTML 中引用 `_low` 版本：
```html
<audio id="bgm-audio" data-track-index="1" data-start="0" src="audio/bgm_low.mp3" preload="auto"></audio>
```

---

## 3. SSML 纠正多音字

中文多音字（如"行"读 háng 还是 xíng）edge-tts 可能读错。用 SSML `<phoneme>` 标签指定读音。

```bash
# 普通文本 → SSML 文本
# 将需要纠正的字用 <phoneme> 包裹
cat > segment_ssml.txt << 'EOF'
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
生成了约一百万<phoneme alphabet="sapi" ph="hang 2">行</phoneme>代码
</speak>
EOF

# 用 --ssml 模式生成
edge-tts --voice zh-CN-XiaoxiaoNeural --rate="-5%" --ssml -f segment_ssml.txt --write-media segment.mp3
```

**常见需纠正的多音字**：
| 词 | 误读 | 正确 | SSML ph |
|----|------|------|---------|
| 一行代码 | xíng | háng | `hang 2` |
| 长期 | zhǎng | cháng | 通常默认正确 |
| 重新 | zhòng | chóng | 通常默认正确 |

**工作流**：全文搜索 → 找出全部潜在多音字 → 仅对出错的段加 SSML → 重新生成该段 → 重新合并音频。由于单个字的修正几乎不影响时长，无需更新 timing_reference.md。

## 4. 检查清单

- [ ] 每个字幕段一个独立 `.txt` 和 `.mp3`
- [ ] 封面静音已嵌入 TTS 音频（adelay + apad）
- [ ] BGM 已循环到视频总时长
- [ ] BGM 已降 -10dB
- [ ] `data-start="0"`（静音已在音频中，不需要偏移）
