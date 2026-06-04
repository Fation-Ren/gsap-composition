# 视频渲染集成规则速查

生成的所有 HTML 必须遵守以下规则。视频渲染使用 HyperFrames CLI（可选，`npx hyperframes` 首次运行自动安装）。

## 结构规则

- 根元素：`data-composition-id` + `data-width="1080"` + `data-height="1920"` + `data-start="0"`
- 音频：`data-track-index` + `data-start="0"` + `id` 属性
- 场景初始状态：`opacity:0;visibility:hidden`

## GSAP 规则（致命）

| # | 规则 | 正确 | 错误 |
|---|------|------|------|
| 1 | 确定性值 | `var rng=mulberry32(42); rng()*100` | `Math.random()*100` |
| 2 | 同步构建 | 全部 tween 在脚本顶层同步创建 | 异步回调中创建 tween |
| 3 | 有限重复 | `repeat:3` | `repeat:-1` |
| 4 | 环境动画 | 环境动画挂到主 timeline | 独立无限循环 |
| 5 | 注册 | `window.__timelines[id]=tl` | 不注册 |
| 6 | 禁止叠transform | 一个元素一个 transform tween | 两个 tween 改同一个元素的 x/y |
| 7 | 场景边界 | 退出后 `tl.set({visibility:"hidden"})` | 不退场直接切场景 |
| 8 | fromTo | 全部用 `tl.fromTo()` | 单独用 `tl.from()` |
| **9** | **禁止 tl.play()** | 仅用 seek 驱动，渲染工具控制时间轴 | `tl.play()` 与 seek 冲突 |
| **10** | **JS 语法校验** | 任何文本替换后 `node --check` 验证 | 跳过校验，渲染时 JS 报错 |

## GSAP 本地管理（使用官方 GreenSock 包）

视频渲染环境中 CDN 脚本可能超时导致渲染失败。**必须将 GSAP 下载到项目本地。**

**方式 1：从 npm 包引用**
```bash
npm install gsap
```
```html
<!-- 从 node_modules 引用 -->
<script src="node_modules/gsap/dist/gsap.min.js"></script>
```

**方式 2：直接下载本地**
```bash
curl -L -o gsap.min.js "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"
```
```html
<!-- ✅ 本地引用 -->
<script src="gsap.min.js"></script>
<!-- ❌ CDN 引用（可能超时） -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
```

## 场景架构

**Swipe-Slider（方案 B）**：所有 section 堆叠在 scroll-track 上，GSAP proxy 驱动 `translateY`。过渡用 `power4.inOut` 模拟自然滑动。详见 SKILL.md Step 4 和 patterns.md §10。

**连续画布（方案 A）**：所有 section 使用 `top:0` + opacity/visibility 切换。

```css
.section {
  position: absolute; left: 0; top: 0;  /* 全部重叠 */
  width: 1080px; height: 1920px;
  opacity: 0; visibility: hidden;       /* 初始隐藏 */
}
```

```js
function sectionIn(secId, at) {
  var sel = '#' + secId;
  tl.set(sel, { visibility: 'visible' }, at);
  tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power3.out" }, at);
}
function sectionOut(secId, at) {
  var sel = '#' + secId;
  tl.to(sel, { opacity: 0, duration: 0.6, ease: "power3.in" }, at);
  tl.set(sel, { visibility: 'hidden' }, at + 0.65);
}
```

场景过渡重叠 0.6s 以实现平滑 crossfade：
```js
var T1 = 8.0;  // 第一个有声段起始时间，取自 timing_reference.md 封面静音时长
sectionOut('s0', T1 - 0.6);
sectionIn('s1', T1);       // 同时开始，重叠 0.6s
```

## Canvas 规则

Canvas 粒子用 `gsap.ticker` 驱动，禁止 `requestAnimationFrame`：

```js
// ✅ 正确：GSAP ticker 连续驱动（tl.play() 已移除，无需检查 paused）
gsap.ticker.add(function() { drawParticles(); });

// ❌ 错误：requestAnimationFrame
function loop() { drawFrame(); requestAnimationFrame(loop); }
```

## 音频规则

- TTS：`data-track-index="10"`，loudnorm + volume=1.5 增强
- BGM：`data-track-index="1"` / `"2"`，已降 -10dB（引用 `_low` 版本）
- 所有 `<audio>` 需 `id` + `data-start="0"`

## Lint 检查

```bash
bash scripts/render.sh <项目目录> <TTS时长>  # 含 lint 步骤
```

## Sub-Composition 规则（致命）

| # | 规则 | 正确 | 错误 |
|---|------|------|------|
| 1 | body 定位上下文 | `body{position:relative}` + `html,body{height:100%}` | 仅 `body{background:transparent}` |
| 2 | 父级容器裁剪 | `#composition{position:relative;overflow:hidden}` | 无 overflow:hidden |
| 3 | data-composition-id 匹配 | host 的 ID = 子合成的注册 key | host ID ≠ 子合成注册 key |
| 4 | 子合成画布填充 | 子合成 body 填满整个画布 | body 高度塌陷为 0（子元素 absolute 脱流） |

**Sub-composition body 必须使用显式像素尺寸**：
```css
/* 9:16 每个子合成 style 块第一行 */
html,body{width:1080px;height:1920px}
*{margin:0;padding:0;box-sizing:border-box}
body{position:relative;background:transparent;...}

/* 16:9 每个子合成 style 块第一行 */
html,body{width:1920px;height:1080px}
```

> **关键**：`height:100%` 在视频渲染子合成环境中**不可靠**——html/body 的包含块可能没有显式高度，导致百分比失效。必须使用与 `data-width`/`data-height` 匹配的**显式像素值**。
>
> 所有子合成元素使用 `position:absolute`，body 必须同时有 `position:relative`（定位上下文）和显式像素尺寸（防止塌陷为 0×0）。

**data-composition-id 对齐**：
```html
<!-- 父级 index.html -->
<div data-composition-id="c0-hook" data-composition-src="compositions/c0-hook.html" data-start="0"></div>

<!-- 子合成 compositions/c0-hook.html -->
<script>
window.__timelines['c0-hook'] = tl;  // ← key 必须与父级 host 的 data-composition-id 一致
</script>
```

## 字幕系统规则

**HTML 结构**（放在 `</body>` 前）：
```html
<div id="subtitle-area">
  <div id="sub1"></div>
  <div id="sub2"></div>
</div>
```

**JS 初始化**（skeleton.js 之后）：
```js
var sub1 = document.getElementById('sub1');
var sub2 = document.getElementById('sub2');
```

**setSub 必须使用 `tl.call()` 调度，接收时间参数 `at`**：

```js
function setSub(l1, l2, at) {
  tl.call(function() {
    if (l1 !== undefined) {
      if (sub1.textContent !== l1) { sub1.textContent = l1; }
      sub1.style.opacity = l1 ? '1' : '0';
    }
    if (l2 !== undefined) {
      var showL2 = l2 && l2 !== sub1.textContent;
      sub2.textContent = showL2 ? l2 : '';
      sub2.style.opacity = showL2 ? '1' : '0';
    }
  }, null, at);
}
```

> **致命**：如果 `setSub` 不接收 `at` 参数、不通过 `tl.call()` 调度，所有字幕会在脚本加载时立即执行，而非在时间轴正确位置显示。

**字幕封面隐藏**：
```css
#subtitle-area { opacity: 0; }  /* 封面无声阶段隐藏 */
```
```js
tl.set('#subtitle-area', { opacity: 1 }, T1);  /* 场景 1 开始时显示 */
```

**字幕文本必须与 TTS 音频逐字一致**。TTS 念什么，字幕显示什么 —— 不简化、不改写。

## 渲染后裁切

```bash
# 裁掉尾部空白
ffprobe output.mp3  # 获取 TTS 实际时长
ffmpeg -i video.mp4 -t <TTS时长> -c copy video.mp4
```

## 低内存渲染

由 `scripts/render.sh` 自动使用 `--workers 2`。快速验证用 `-q draft`。

> `--workers 2` 降低内存压力，`-q draft` 用于快速迭代验证布局和动画。

## TTS + BGM 音频合成

> 完整指南见 `references/audio-guide.md`

### 快速命令

```bash
bash scripts/audio-tts.sh <项目目录>
```
> 完整指南见 `references/audio-guide.md`。一键执行：TTS 分段 → 锚点表 → adelay+apad 合并 → BGM 循环降噪。

> **不用 data-start 做偏移**：视频渲染工具中 `data-start` 可能不可靠。将封面静音直接嵌入 TTS 音频，`data-start="0"` 即可。
>
> **不用 concat demuxer 合并静音**：不同 MP3 编码参数可能导致静音段被跳过。`adelay + apad` 是更可靠的做法。

## 常见渲染失败原因

| 错误 | 原因 | 修复 |
|------|------|------|
| JS 渲染错误 | JS 运行时错误 | 检查所有 DOM 操作前是否 resolve 选择器 |
| `el.querySelectorAll is not a function` | 字符串传给需要元素的方法 | `charFly()` 内加 `typeof sel==='string'?document.querySelector(sel):sel` |
| `Cannot read property 'style' of null` | 元素不存在 | 检查 ID 拼写，确认 HTML 中存在 |
| 配音落后一个场景 | 场景时间用了 tts_script.md 预估时长 | 场景 start/end 严格取自 timing_reference.md |
| lint: root 缺 data-start | Canvas 根元素未加属性 | `<div ... data-start="0">` |
| TTS concat 失败 | audio-tts.sh 滤镜语法错误 | 已修复为 concat demuxer |
| split-tts 丢失首段 | 文件以 `##` 开头 | 已修复（`content.startsWith('##')` 检测） |
