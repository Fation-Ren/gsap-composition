# 正确工作流 Demo：从内容规划到最终视频

## 核心原则

```
TTS 先行 → 动画匹配 → Draft 验证 → 最终渲染
```

**永远不要让 GSAP 时间线决定视频总时长。TTS 配音的总时长 = 视频总时长。**

---

## Demo：制作一个 3 分钟技术科普视频

### Step 1：内容规划

使用 SKILL.md Step 0 的 6 条规则生成 `tts_script.md`，每段标注预估 TTS 朗读秒数。格式见 `references/tts-script.md`。

```markdown
## 封面
- 标题：什么是 Harness？
- TTS文本：AI模型就像一匹千里马，但如果没有缰绳和马鞍，它会把你摔下来。这套缰绳和马鞍，就是Harness。
- 预估TTS时长：8秒
- 动画：char-flyin 逐字飞入

## 正文段落1
- TTS文本：Harness Engineering 是2026年最热门的AI工程范式。它不是在教AI说什么，而是在给AI建立一整套行为规则。
- 预估TTS时长：10秒
- 动画：card-stagger 卡片弹入

## 数据展示
- TTS文本：LangChain的实验证明，不换模型，只优化Harness，编码得分从52.8%跃升到66.5%。
- 预估TTS时长：8秒
- 动画：counter 数字跳动 + data-bar
```

### Step 2：生成 TTS 并确定视频总时长

```bash
node scripts/split-tts.js tts_script.md tts_segments/
bash scripts/audio-tts.sh gsap/ 8.0
```
拆分 → 逐句 TTS → 锚点表 → `timing_reference.md` 中获取视频总时长。

### Step 3：场景时间对齐（致命步骤）

> **tts_script.md 的预估时长仅用于 Step 0 文案规划。实际 TTS 生成后，timing_reference.md 是唯一时间来源。**

```js
// ❌ 致命错误：用 tts_script.md 预估时长写场景时间
scene("cover", 0, 10, ...)     // 预估 10s，实际 TTS 可能 19s → 配音错位

// ✅ 正确：从 timing_reference.md 读取精确值
// timing_reference.md:
// | s1_01 | 8.00 | 11.69 | 19.69 |
// | s2_01 | 19.69 | 15.17 | 34.86 |
// ...
scene("cover",    0,      19.69, ...)   // = s1_01 结束时间
scene("problem",  19.69,  34.86, ...)   // = s2_01 起止时间
scene("solution", 34.86,  53.12, ...)   // = s3_01 起止时间

// Canvas data-duration = timing_reference 最后一行结束时间 + 2s
var DURATION = 105;  // 103.16 + 2s 缓冲
```

验证方法：渲染后检查场景切换是否与 TTS 配音同步。不同步则检查场景 `start`/`end` 是否严格等于锚点表值。

### Step 4：Draft 渲染验证布局

```bash
# 快速验证（~2分钟）
npx hyperframes render <项目目录>/ -o video_draft.mp4 -q draft --workers 2
```

### Step 5：合成 TTS 音频（adelay 逐段对齐）

由 `scripts/audio-tts.sh` 自动完成（adelay + apad + BGM amix 混合）。

### Step 6：最终渲染 + 合并

```bash
bash scripts/render.sh <项目目录> <TTS总时长>
```
该脚本自动执行：lint → render -q high → ffmpeg 裁切。

---

## 检查清单（每次制作前对照）

- [ ] TTS 脚本是否已写好，每段有预估朗读时长？
- [ ] TTS 是否已逐段生成，每段实际时长是否已测量？
- [ ] GSAP 时间戳是否基于 TTS 段的时间戳（不是手动设定）？
- [ ] 视频总时长 = 最后一段 TTS 的 (start + dur) + 2s 缓冲？
- [ ] 是否先用 `-q draft` 验证了布局？
- [ ] 子合成 body 是否用了显式像素尺寸（不是 `height:100%`）？
- [ ] `data-composition-id` 是否与 `window.__timelines[key]` 一致？
- [ ] `setSub` 函数是否包含自动去重逻辑？
- [ ] 场景退出是否加了 `tl.set('body',{visibility:'hidden'})`？

---

## 本次 Harness 视频的教训速查

| 问题 | 原因 | 预防 |
|------|------|------|
| 内容偏离 | body 无 position:relative + 高度塌陷 | 显式像素 body + padding |
| TTS 提前说完 | GSAP 时间线设计在先，TTS 在后 | TTS 先行，动画匹配 |
| 字幕重复 | setSub 未去重 | 内置去重逻辑 |
| 场景残留 | 只 fade-out 未 hidden | visibility:hidden |
| 渲染内存不足 | 默认 4 worker + high quality | --workers 2 |
