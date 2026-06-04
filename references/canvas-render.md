# 纯 Canvas 2D 渲染框架

当 DOM 复杂度导致 seek-driven 渲染失效时（位置偏移、layer 错乱、内容缺失、黑屏），切换到 Canvas 立即模式。

## 核心原理

Canvas 是**立即模式**——每帧从空白画布开始重绘。不存在 CSS layout tree，不依赖浏览器布局引擎在 seek 下重建状态。`drawAll(time)` 根据当前时间纯函数式计算画面，天然确定性。

DOM 的问题：视频渲染 seek 跳帧时，浏览器需要重建 CSS layout tree、重新计算盒模型、重新层叠 z-index——这个过程在复杂 DOM 中不可靠。

Canvas 消除了这一切：一帧 = 一个纯函数调用。

## 何时使用

| 信号 | 行动 |
|------|------|
| 内容 > 5 分钟 | Canvas 默认首选 |
| 含表格、流程图、多栏对比 | Canvas（DOM 表格 seek 下易错位） |
| 出现过位置偏移/黑屏/内容缺失 | 立即切 Canvas |
| 元素数 > 20 个/场景 | Canvas（DOM timeline 维护成本高） |
| 简单标题卡（< 2 分钟） | DOM 够用 |

## 框架模板

```html
<!doctype html>
<html>
<head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0a0f;overflow:hidden}
  canvas{display:block;width:1920px;height:1080px}
</style></head>
<body>
<div id="root" data-composition-id="root" data-width="1920" data-height="1080">
  <canvas id="c" class="clip" data-start="0" data-duration="660"
          data-track-index="0" width="1920" height="1080"></canvas>
</div>

<!-- GSAP 本地引用 -->
<script src="gsap.min.js"></script>
<script>
// ===== 1. 内联 scripts/skeleton.js 全部内容（mulberry32 + tl 初始化）=====
// ===== 2. 以下为 Canvas 专用代码 =====
const c = document.getElementById("c");
const ctx = c.getContext("2d");
const W = 1920, H = 1080, CX = 960, CY = 540;
const FADE = 0.8; // 场景间 crossfade 时长（秒）

// ===== 绘制 Helpers =====

// 单行文字
function T(text, x, y, font, color, align) {
  ctx.fillStyle = color || "#fff";
  ctx.font = font;
  ctx.textAlign = align || "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

// 多行文字
function ML(lines, x, y, font, color, lineH, align) {
  ctx.fillStyle = color || "#fff";
  ctx.font = font;
  ctx.textAlign = align || "center";
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => { if (l != null) ctx.fillText(l, x, y + i * lineH); });
}

// 径向辉光
function glow(cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color); g.addColorStop(1, "transparent");
  ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

// 矩形卡片
function card(x, y, w, h, bg, border) {
  ctx.fillStyle = bg || "rgba(255,255,255,0.03)";
  ctx.fillRect(x, y, w, h);
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); }
}

// 竖线分割
function vLine(x, y1, y2, color) {
  ctx.strokeStyle = color || "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
}

// 横向箭头（带箭头尖）
function arrow(x1, y1, x2, y2, color) {
  const a = Math.atan2(y2 - y1, x2 - x1), len = 12;
  ctx.strokeStyle = color || "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.fillStyle = color || "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - len * Math.cos(a - 0.5), y2 - len * Math.sin(a - 0.5));
  ctx.lineTo(x2 - len * Math.cos(a + 0.5), y2 - len * Math.sin(a + 0.5));
  ctx.closePath(); ctx.fill();
}

// 流程条（水平箭头连接的步骤）
function processFlow(steps, y, boxW, boxH, gap) {
  const totalW = steps.length * boxW + (steps.length - 1) * gap;
  let x = CX - totalW / 2;
  steps.forEach((step, i) => {
    card(x, y, boxW, boxH, "rgba(255,255,255,0.04)", "rgba(255,255,255,0.1)");
    T(step.label, x + boxW/2, y + boxH/2 - 12, "bold 24px 'Noto Sans SC', sans-serif", "#ff8c28");
    T(step.desc, x + boxW/2, y + boxH/2 + 22, "18px 'Noto Sans SC', sans-serif", "rgba(255,255,255,0.5)");
    if (i < steps.length - 1) arrow(x + boxW + 5, y + boxH/2, x + boxW + gap - 5, y + boxH/2);
    x += boxW + gap;
  });
}

// 章节标题
function chapterTitle(num, title) {
  glow(CX, CY - 50, 400, "rgba(255,140,40,0.1)");
  T("第 " + num + " 章", CX, CY - 80, "24px 'Noto Sans SC', sans-serif", "rgba(255,255,255,0.4)");
  T(title, CX, CY, "bold 72px 'Noto Sans SC', sans-serif", "#fff");
}

// 场景标签
function sectionLabel(text) {
  T(text, CX, 80, "22px 'Noto Sans SC', sans-serif", "rgba(255,255,255,0.4)");
}

// ===== 场景注册系统 =====
const scenes = [];

function scene(name, start, end, drawFn) {
  scenes.push({ name, start, end, draw: drawFn });
}

// alpha 包裹器：每个场景 drawFn 接收外部计算的 alpha
function withAlpha(fn) {
  return function(alpha) {
    ctx.globalAlpha = alpha;
    fn();
    ctx.globalAlpha = 1;
  };
}

// ===== 场景定义示例 =====
scene("c1-title", 0, 12, withAlpha(function() {
  glow(CX, CY - 60, 350, "rgba(255,140,40,0.12)");
  T("什么是 Harness？", CX, CY - 50, "bold 96px 'Noto Sans SC', sans-serif", "#fff");
  T("第 1 章", CX, CY + 50, "32px 'Noto Sans SC', sans-serif", "rgba(255,255,255,0.55)");
}));

// ... 更多 scene() 定义 ...

// ===== 主绘制循环 =====
function drawAll(time) {
  // 清空画布
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, W, H);

  // 可选：细微噪点（使用种子确定性定位）
  ctx.fillStyle = "rgba(255,255,255,0.01)";
  for (let i = 0; i < 50; i++) {
    ctx.fillRect(((i * 7919 + 104729) % W), ((i * 6271 + 224737) % H), 2, 2);
  }

  // 计算每个场景的 alpha（crossfade 引擎）
  scenes.forEach(sc => {
    let alpha = 1;
    if (time < sc.start) {
      alpha = time > sc.start - FADE ? (time - (sc.start - FADE)) / FADE : 0;
    } else if (time > sc.end) {
      alpha = time < sc.end + FADE ? 1 - (time - sc.end) / FADE : 0;
    }
    if (alpha > 0.001) sc.draw(Math.min(alpha, 1));
  });
}

// ===== GSAP 集成 =====
// 前提：已内联 scripts/skeleton.js（提供 mulberry32, tl, window.__timelines）
// 以下使用 skeleton.js 中的 tl 变量，不重新声明
tl.to({}, {
  duration: DURATION,
  onUpdate: function() { drawAll(this.time()); },
  ease: "none"
});
drawAll(0); // 初始帧
// 注意：如 data-composition-id 不是 "root"，更新 window.__timelines 的 key
</script>
</body>
</html>
```

## 配色常量

```js
const C = {
  bg:        "#0a0a0f",
  white:     "#ffffff",
  warm:      "#ff8c28",   // 橙色强调
  gold:      "#ffaa55",   // 金色高亮
  cool:      "#64a0ff",   // 蓝色对比
  red:       "#ff6b6b",   // 红色（警告/强调）
  green:     "#4ade80",   // 绿色（成功/方法论）
  purple:    "#a78bfa",   // 紫色（工具/生态）
  dim:       "rgba(255,255,255,0.5)",
  dimmer:    "rgba(255,255,255,0.35)",
  dimmest:   "rgba(255,255,255,0.2)",
  label:     "rgba(255,255,255,0.4)",
};
```

## VTT 字幕系统（edge-tts 精确时间戳）

当 TTS 段落较长时，不应按整段显示字幕（信息溢出），而应拆分为短句，用 edge-tts 的 VTT 输出获取精确时间戳。

### 工作流

```bash
# 1. 对每个 TTS 段生成 VTT
bash scripts/audio-tts.sh <项目目录>  # 先生成 TTS + 锚点表
for f in tts_segments/s*.txt; do
  name="${f%.txt}"
  edge-tts --voice zh-CN-XiaoxiaoNeural --rate="-5%" \
    -f "$f" --write-subtitles "${name}.vtt" --write-media /dev/null
done

# 2. 解析 VTT → subtitles.json
node scripts/parse-vtt.js tts_segments/ timing_reference.md > subtitles.json
```

VTT 解析由 `scripts/parse-vtt.js` 完成：读取锚点表偏移 → 解析每个 .vtt 文件 → 输出 JSON 字幕数组。

### Canvas 字幕绘制

```js
const subtitles = [
  { start: 0.1, end: 3.1, text: "AI 视频渲染方案大比拼。" },
  { start: 3.05, end: 6.66, text: "从DOM翻车到Canvas稳定方案。" },
  // ... from VTT parse output
];

function drawSubtitle(time) {
  const sub = subtitles.find(s => time >= s.start && time <= s.end);
  if (!sub) return;

  const maxW = 1500, fontSize = 30;
  ctx.font = fontSize + "px 'Noto Sans SC', sans-serif";

  // Chinese word wrap (break by character)
  let lines = [], cur = "";
  for (const ch of sub.text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur.length > 0) { lines.push(cur); cur = ch; }
    else { cur = test; }
  }
  if (cur) lines.push(cur);

  // Max 2 lines
  if (lines.length > 2) lines = lines.slice(0, 2);

  const lineH = fontSize * 1.6;
  const totalH = lines.length * lineH;
  const boxY = H - totalH - 90;
  const boxH = totalH + 50;
  const boxW = maxW + 100;

  // Semi-transparent bg + accent bar
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(CX - boxW/2, boxY - 10, boxW, boxH);
  ctx.fillStyle = "#ff8c28";
  ctx.fillRect(CX - boxW/2, boxY - 10, boxW, 3);

  ctx.fillStyle = "#fff";
  ctx.font = fontSize + "px 'Noto Sans SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, CX, boxY + 15 + i * lineH + lineH/2));
}
```

### 关键点

1. **VTT 时间戳精准**：edge-tts 按语音合成的实际停顿切分，比手动估算准得多
2. **最多 2 行**：字幕区域不遮挡主画面，观众阅读负担小
3. **背景半透明**：`rgba(0,0,0,0.6)` 保证在任何画面上可读
4. **橙色 accent 线**：视觉锚点，区分字幕区和主画面
5. **字幕在 `drawAll()` 最后绘制**：确保在所有场景内容之上，不受 scene alpha 影响

## 关键规则

1. **所有定位使用像素坐标**——没有 CSS 布局，x/y 绝对精确
2. **文字使用 `textBaseline: "middle"`**——垂直居中更易对齐
3. **Crossfade 时长固定 0.8s**——太短有闪烁感，太长场景会残留
4. **场景按 start 时间排序**——便于阅读和调试，但不是强制的
5. **`withAlpha()` 包裹每个 drawFn**——crossfade 引擎统一控制 opacity
6. **`drawAll(0)` 初始化**——确保页面加载时有内容显示
7. **GSAP timeline 用 `{}` 对象**——`onUpdate` 在每次 seek 时触发重绘
8. **禁止 `Math.random()`**——噪点用质数种子做确定性定位
9. **中文字体用 'Noto Sans SC'**——视频渲染编译器可自动下载，PingFang SC 不可

## Canvas 的局限性

| 不适合 | 替代方案 |
|--------|---------|
| CSS filter / mix-blend-mode | 手动计算色彩或预渲染 |
| 文字选区、无障碍 | 无替代（Canvas 本质如此） |
| 富文本（不同字体/颜色混排一行） | 多次 `fillText` 手动拼接 |
| 视频/图片嵌入 | 需要 Image 对象 + `drawImage` |
| CSS 动画/过渡 | GSAP 手动插值 |
