# 动画模式库

所有模式使用官方 GreenSock GSAP 库实现（`npm install gsap`）。GSAP 核心 API 参考：https://gsap.com/docs/v3/

每种模式含：适用页面类型、HTML 骨架、GSAP 代码模板、关键参数。

## 核心原则

- **easing 选择**：入场用 `power4.out`（犀利减速），过渡用 `expo.inOut`（快速），弹性用 `back.out(3-4)`（强烈 overshoot）
- **方向多样**：不同元素从不同方向进入（x左/x右/y下/斜角），禁止全部从正下方
- **深度层次**：远元素 scale:0.1，近元素 scale:0.85，创造 Z 轴层次
- **持续漂移**：glow-ring 和 ghost-text 在整个场景中保持微弱运动
- **节奏 staggered**：`from:"edges"` 比 `from:"center"` 更有冲击力

## 前置脚本

所有 HTML 文件 `<script>` 标签开头必须内联 `scripts/skeleton.js` 的完整内容。该文件提供：`mulberry32()`、`r1`/`r2` PRNG 实例、`window.__timelines` 初始化、`tl` 时间线。

---

## 1. char-flyin — 逐字3D飞入

**适用**：封面标题、CTA 标题、任意需要视觉冲击的标题文字

**HTML**:
```html
<h1 id="title" class="gold-text">Claude Code</h1>
```

**JS（swipe-slider 升级版）**:
```js
function wrapChars(el){
  if(typeof el==='string')el=document.querySelector(el);
  if(!el)return;
  var txt=el.textContent||"",html="";
  for(var i=0;i<txt.length;i++){
    html+=txt[i]===' '?' ':'<span class="char">'+txt[i]+'</span>';
  }
  el.innerHTML=html;
}
function charFly(sel,at,dur,staggerEach){
  var el=typeof sel==='string'?document.querySelector(sel):sel;
  if(!el)return;
  wrapChars(el);
  var chars=el.querySelectorAll('.char');
  // 3D fly-in from edges, deep overshoot
  tl.fromTo(chars,{opacity:0,rotationX:-120,rotationY:15,y:80,scale:0.1,z:0.1},
    {opacity:1,rotationX:0,rotationY:0,y:0,scale:1,z:0,duration:dur||0.6,
     stagger:{each:staggerEach||0.05,from:"edges"},ease:"back.out(4)"},at);
  // Strong dual-shadow glow flash
  tl.fromTo(chars,{textShadow:"0 0 80px rgba(212,168,83,0.9)"},
    {textShadow:"0 0 0px rgba(212,168,83,0)",duration:0.9,
     stagger:{each:staggerEach||0.05,from:"edges"},ease:"expo.out"},at+0.05);
}
```

**CSS**:
```css
.char{display:inline-block;transform-origin:50% 50% -30px}
```

**参数建议**：封面 dur=0.6, stagger=0.05, from:"edges" / CTA dur=0.7, stagger=0.06

**Swipe-Slider 关键差异**：
- `back.out(4)` 替代 `back.out(2)` — 4倍强 overshoot
- `from:"edges"` 替代 `from:"center"` — 字符从两侧飞入更有冲击力
- `rotationX:-120` + `rotationY:15` — 3D 深度感
- glow flash 用 `expo.out` — 更快的辉光消退

---

## 2. counter — 数字计数器

**适用**：数据展示页的统计数字（播放量、Star数、收入金额）

**JS**:
```js
function countUp(elId,from,to,at,dur,suffix){
  var el=document.getElementById(elId);
  var proxy={v:from};
  tl.to(proxy,{v:to,duration:dur||0.8,ease:"power2.out",
    onUpdate:function(){
      el.textContent=Math.round(proxy.v).toLocaleString()+(suffix||'');
    }
  },at);
}
// Usage:
countUp('s2-num1',0,1906,10.5,0.9,'');
countUp('s5-stat1',0,87,65.7,0.7,'万');
```

**参数建议**：整数用 `Math.round()`，千分位用 `toLocaleString()`，后缀直接拼接

---

## 3. card-stagger — 卡片逐张弹入

**适用**：数据展示页的 stat 卡片、证据列举页的平台卡片

**JS（swipe-slider 升级版）**:
```js
function cardIn(elId,at,delay,xDir){
  var dx=(xDir||(r1()>0.5?1:-1))*r1()*40;
  tl.fromTo(elId,{opacity:0,y:50+r1()*30,x:dx,scale:0.85},
    {opacity:1,y:0,x:0,scale:1,duration:0.5,ease:"power4.out"},at+(delay||0));
}
// Usage:
cardIn('#s2-card1',10.3,0,-1);   // from left
cardIn('#s2-card2',10.3,0.12,1);  // from right
cardIn('#s2-card3',10.3,0.24,-1); // from left
```

**参数建议**：逐卡 delay 0.12-0.15s（比旧版更紧凑），ease 用 `power4.out`，xDir 交替方向

**Swipe-Slider 关键差异**：
- `power4.out` 替代 `back.out` — 犀利减速替代弹跳，更现代
- 随机水平偏移 `dx` — 卡片从不同方向滑入
- 更紧凑的 stagger（0.12s vs 0.15s）

---

## 4. glow-pulse — 辉光脉冲呼吸

**适用**：标题强调、关键数字突出

**JS**:
```js
function glowPulse(elId,at,dur){
  tl.to(elId,{textShadow:"0 0 30px rgba(212,168,83,0.5)",
    duration:dur||2.5,ease:"sine.inOut",yoyo:true,repeat:3},at);
}
// Usage:
glowPulse('#s3-title',26.9,3);
```

**参数建议**：金色 `rgba(212,168,83,0.5)`，blur 30-40px，repeat 2-4次

---

## 5. card-glow — 卡片边框发光

**适用**：重要数据卡片强调

**JS**:
```js
tl.to('#s3-card1',{boxShadow:"0 0 30px rgba(212,168,83,0.2)",
  duration:3,ease:"sine.inOut",yoyo:true,repeat:2},28.5);
```

**参数建议**：blur 25-30px，opacity 0.15-0.2，repeat 2-3次

---

## 6. vs-slide — 左右对比滑入

**适用**：对比论证页（过去 vs 现在）

**JS**:
```js
// Left box slides in from left
tl.fromTo('#s4-old',{opacity:0,x:-80,scale:0.9},
  {opacity:1,x:0,scale:1,duration:0.55,ease:"back.out(1.5)"},46.5);
// Right box slides in from right
tl.fromTo('#s4-new',{opacity:0,x:80,scale:0.9},
  {opacity:1,x:0,scale:1,duration:0.55,ease:"back.out(1.5)"},46.65);
// Arrow scale burst
tl.fromTo('#s4-arrow',{scale:0,opacity:0},
  {scale:1,opacity:1,duration:0.45,ease:"back.out(2.5)"},47.0);
// New box glow
tl.to('#s4-new',{boxShadow:"0 0 30px rgba(80,200,120,0.2)",
  duration:3,ease:"sine.inOut",yoyo:true,repeat:2},47.5);
```

**参数建议**：x 偏移 ±60-100px，箭头 ease 用 `back.out(2.5)` 产生强爆破感

---

## 7. glow-ring — 辉光环缩放

**适用**：所有场景的氛围背景

**HTML**:
```html
<div class="glow-ring" style="width:640px;height:640px;top:12%;left:50%;transform:translateX(-50%)"></div>
```

**CSS**:
```css
.glow-ring{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(212,168,83,0.12) 0%,transparent 70%);pointer-events:none}
```

**JS**:
```js
// Entrance
tl.fromTo('#s1 .glow-ring',{scale:0.8,opacity:0},
  {scale:1,opacity:1,duration:1.2,ease:"power2.out"},0);
// Ambient breathe
tl.to('#s1 .glow-ring',{scale:1.08,duration:3,
  ease:"sine.inOut",yoyo:true,repeat:2},1.5);
```

**参数建议**：scale 范围 0.8-1.15，单次呼吸 2-4s

---

## 8. canvas-particles — Canvas 粒子背景

**适用**：所有场景的全局背景纹理

**JS**:
```js
var canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
canvas.width=1080;canvas.height=1920;
var rngP=mulberry32(99),particles=[];
for(var i=0;i<80;i++){
  particles.push({
    ox:rngP()*1080,oy:rngP()*1920,
    r:1+rngP()*2.5,
    speed:0.3+rngP()*0.7,
    angle:rngP()*Math.PI*2,
    alpha:0.12+rngP()*0.25
  });
}
var partProxy={t:0};
function drawParts(){
  ctx.clearRect(0,0,1080,1920);
  for(var i=0;i<particles.length;i++){
    var p=particles[i];
    var px=((p.ox+Math.cos(p.angle)*p.speed*partProxy.t*55)%1080+1080)%1080;
    var py=((p.oy+Math.sin(p.angle)*p.speed*partProxy.t*55)%1920+1920)%1920;
    ctx.beginPath();ctx.arc(px,py,p.r,0,Math.PI*2);
    ctx.fillStyle='rgba(212,168,83,'+p.alpha+')';ctx.fill();
  }
}
function tickParts(){partProxy.t=tl.time();drawParts();}
gsap.ticker.add(function(){if(!tl.paused())tickParts();});
tickParts();
```

**关键约束**：禁止 `requestAnimationFrame`，必须用 `gsap.ticker` + proxy 驱动。

---

## 辅助元素

### accent-line — 强调线
```css
.accent-line{position:absolute;height:3px;background:linear-gradient(90deg,transparent,rgba(212,168,83,0.5),transparent);pointer-events:none;transform-origin:left center}
```
```js
tl.fromTo(accentLine,{scaleX:0},{scaleX:1,duration:0.8,ease:"power2.inOut"},at);
```

### ghost-text — 背景幽灵文字
```css
.ghost-num{position:absolute;font-size:180px;font-weight:900;color:rgba(255,255,255,0.012);pointer-events:none}
```
```js
tl.fromTo(ghost,{opacity:0,y:20},{opacity:0.01,duration:2,ease:"sine.inOut"},at);
```

### data-bar — 数据条
```css
.data-bar{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg,rgba(212,168,83,0.15),rgba(212,168,83,0.05));transform-origin:bottom;height:0}
```

## 辅助函数实现

以下函数被动画模式引用，需在 HTML `<script>` 中定义（内联 skeleton.js 之后）。

```js
// glow-ring 入场 — 大环
function gIn(sel, at) {
  tl.fromTo(sel, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" }, at);
}
function gInSmall(sel, at) {
  tl.fromTo(sel, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }, at);
}
function gDrift(sel, at, dur) {
  tl.to(sel, { scale: 1.08, duration: dur || 7, ease: "sine.inOut", yoyo: true, repeat: 3 }, at);
}
function gDriftSmall(sel, at, dur) {
  tl.to(sel, { scale: 1.12, duration: dur || 5, ease: "sine.inOut", yoyo: true, repeat: 3 }, at);
}
function ghostIn(sel, at, opacity) {
  tl.fromTo(sel, { opacity: 0, y: 20 }, { opacity: opacity || 0.01, y: 0, duration: 2, ease: "sine.inOut" }, at);
}
function dotIn(sel, at) {
  tl.fromTo(sel, { opacity: 0, scale: 0 }, { opacity: 0.35, scale: 1, duration: 0.5, ease: "back.out(2)" }, at);
}
// 通用元素入场/退场
function elIn(sel, at, dur) {
  tl.fromTo(sel, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: dur || 0.5, ease: "power4.out" }, at);
}
function elOut(sel, at, dur) {
  tl.to(sel, { opacity: 0, y: -20, duration: dur || 0.4, ease: "power4.in" }, at);
}
// 标题逐字简化入场（无 glow flash）
function charIn(sel, at, dur, staggerEach) {
  charFly(sel, at, dur || 0.6, staggerEach || 0.05);
}
// 辉光脉冲
function gPulse(sel, at, dur) {
  tl.to(sel, { textShadow: "0 0 30px rgba(212,168,83,0.5)", duration: dur || 2.5, ease: "sine.inOut", yoyo: true, repeat: 3 }, at);
}
// 卡片发光
function cGlow(sel, at, dur) {
  tl.to(sel, { boxShadow: "0 0 30px rgba(212,168,83,0.2)", duration: dur || 3, ease: "sine.inOut", yoyo: true, repeat: 2 }, at);
}
// 强调线入场（横/竖）
function lineIn(sel, at) {
  tl.fromTo(sel, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, at);
}
function lineVIn(sel, at) {
  tl.fromTo(sel, { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: "power2.inOut" }, at);
}
// 标签/趋势指示器淡入
function labelIn(sel, at) {
  tl.fromTo(sel, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, at);
}
function trendIn(sel, at) {
  tl.fromTo(sel, { opacity: 0, y: 10, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, at);
}
```

---

## 9. 内容密度增强模式

以下模式解决"视频画面空泛"问题，每场景目标 15-18 个可见元素。

### 9.1 multi-ring — 多层同心辉光环

**效果**：2-3 个不同大小的 glow-ring 叠在一起，不同速度呼吸，创造深度感。

```html
<div class="glow-ring" id="g3a" style="width:560px;height:560px"><!-- 大环，慢速 --></div>
<div class="glow-ring" id="g3b" style="width:380px;height:380px"><!-- 中环，中速 --></div>
<div class="glow-ring" id="g3c" style="width:240px;height:240px"><!-- 小环，快速 --></div>
```
```js
gIn('#g3a',at);     gDrift('#g3a',at+1.5,7);  // 大环慢
gInSmall('#g3b',at+0.3); gDriftSmall('#g3b',at+2,5);
gInSmall('#g3c',at+0.6); gDriftSmall('#g3c',at+2.3,4); // 小环快
```

### 9.2 card-accent — 卡片顶部强调线

**效果**：卡片顶部 3px 渐变线 + 右下角点缀圆点，让卡片不再"裸"。

```css
.stat-card{overflow:hidden}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,rgba(212,168,83,0.4),rgba(212,168,83,0.1),transparent)}
.stat-card .accent-dot{position:absolute;width:6px;height:6px;background:#d4a853;
  border-radius:50%;opacity:0.4;bottom:10px;right:10px}
```

### 9.3 accent-dots — 散布装饰点

**效果**：8-10 个 8px 金色圆点散布在画面各处，随场景进出。

```html
<div class="accent-dot-f" id="d3a" style="top:400px;left:860px"></div>
```
```css
.accent-dot-f{position:absolute;width:8px;height:8px;background:#d4a853;border-radius:50%;opacity:0}
```
用法：`dotIn(sel, at)`（定义见上方"辅助函数实现"）。

### 9.4 trend-indicators — 趋势指示器

**效果**：绿色 ↑ 箭头 + 标签文字，标注关键增长数据。

```html
<div class="trend-up" id="tu3" style="top:640px;left:860px">↑</div>
<div class="trend-label" id="tl3" style="top:650px;left:890px">80x YoY</div>
```
```css
.trend-up{position:absolute;font-size:32px;color:#4ecb71;opacity:0}
.trend-label{position:absolute;font-size:18px;color:rgba(255,255,255,0.35);opacity:0}
```

### 9.5 double-ghost — 双幽灵文字层

**效果**：同场景 2 个 ghost-num（不同大小/位置/透明度），创造空间层次。

```html
<div class="ghost-num" id="h3a" style="font-size:180px">440</div>  <!-- 0.01 opacity -->
<div class="ghost-num" id="h3b" style="font-size:100px">250%</div> <!-- 0.006 opacity -->
```
```js
ghostIn('#h3a',at,0.01);  // 深
ghostIn('#h3b',at+0.5,0.006); // 浅
```

### 9.6 grid-overlay — 网格背景纹理

**效果**：60px 网格 overlay，给纯色背景增加"制作感"。

```css
.bg-grid{position:absolute;inset:0;opacity:0.03;
  background-image:linear-gradient(rgba(212,168,83,0.3) 1px,transparent 1px),
    linear-gradient(90deg,rgba(212,168,83,0.3) 1px,transparent 1px);
  background-size:60px 60px}
```

### 9.7 platform-color-coding — 平台色彩编码

**效果**：不同平台卡片用不同顶部强调色。

```css
.pl-card.pb::before{background:linear-gradient(90deg,rgba(251,114,153,0.5),transparent)} /* B站粉 */
.pl-card.pz::before{background:linear-gradient(90deg,rgba(5,110,232,0.5),transparent)} /* 知乎蓝 */
.pl-card.pj::before{background:linear-gradient(90deg,rgba(30,128,255,0.5),transparent)} /* 掘金蓝 */
```

### 9.8 double-data-bar — 双数据条

**效果**：两条不同宽度的数据条叠放，创造层次。

```html
<div class="data-bar" style="width:460px"><!-- 主条，宽 --></div>
<div class="data-bar" style="width:320px;top:+10px"><!-- 副条，窄 --></div>
```

### 9.9 每场景元素数量基准

| 元素类型 | 最少数量 |
|---------|---------|
| glow-ring（多层） | 2-3 |
| accent-line 横线 | 1-2 |
| accent-line-v 竖线 | 1-2 |
| ghost-num 幽灵数字 | 1-2 |
| ghost-label 标签 | 1-2 |
| accent-dot 装饰点 | 2-3 |
| title + subtitle + body | 3 |
| stat-cards / pl-cards | 2-4 |
| data-bar | 1-2 |
| trend 指示器 | 0-2 |
| **合计** | **15-18** |

---

## 10. Swipe-Slider 滚动 + 分区装饰 + 内容富化

### 10.1 swipe-scroll — 连续滚动画布

**效果**：替代离散淡入淡出。所有段垂直堆叠在一个 scroll-track 上，GSAP proxy 驱动 `translateY`，过渡用 `power4.inOut` 模拟 Observer 驱动的 scrub 手感。

**HTML**：
```html
<div class="scroll-view" id="viewport" style="overflow:hidden">  <!-- 视口 -->
<div class="scroll-track" id="track">  <!-- 滚动轨道 -->
  <div class="section" style="top:0;height:1920px">...</div>     <!-- S1 @ y=0 -->
  <div class="section" style="top:1920px;height:1920px">...</div> <!-- S2 @ y=1920 -->
  <div class="section" style="top:3840px;height:1920px">...</div> <!-- S3 @ y=3840 -->
  <!-- ... 每段间隔 = 视口高度 -->
</div>
</div>
```

**JS**：
```js
// 前提：已内联 scripts/skeleton.js（提供 tl 变量）
// 以下使用 skeleton.js 中的 tl，不重新声明
var scrollY={v:0};
var track=document.getElementById('track');
function updateScroll(){track.style.transform='translateY('+(-scrollY.v)+')px'}

tl.eventCallback("onUpdate",updateScroll);

// 过渡：power4.inOut 模拟自然 swipe 手感
tl.to(scrollY,{v:1920,duration:1.2,ease:"power4.inOut"},7.5);  // S1→S2
tl.to(scrollY,{v:3840,duration:1.5,ease:"power4.inOut"},23.0); // S2→S3
tl.to(scrollY,{v:5760,duration:1.8,ease:"power4.inOut"},44.0); // S3→S4
// 越往后过渡越长，营造"惯性衰减"感
```

### 10.2 zone-decoration — 上下分区装饰

**问题**：9:16 竖屏中心内容集中 Y 250-950，上方 250px 和下方 950px 空洞，浪费画面空间。

**解决**：每段分三个视觉区域，装饰元素只做氛围不抢焦点。

```
┌─ TOP ZONE (Y 0-250) ─────────────────────┐
│  line-h ×2 (opacity 0.2-0.4, 长短叠放)    │
│  ghost-label (阶段名/元信息, opacity 0.05) │
│  dot ×2-3 (边缘散布, opacity 0.12-0.2)     │
│  glow-ring ×1 (小号角落, opacity 0.4)      │
├─ CENTER (Y 250-950) ──────────────────────┤
│  主标题 + 副标题 + 卡片 + badge            │
│  ← 此处为视觉关注中心，opacity 全满         │
├─ BOTTOM ZONE (Y 950-1920) ────────────────┤
│  line-h ×2 (opacity 0.18-0.35)            │
│  ghost-num (大号数字纹理, opacity 0.004)    │
│  ghost-label ×2 (补充数据/来源, 0.05)       │
│  dot ×2-3 (边缘, opacity 0.1-0.18)         │
│  glow-ring ×2 (两侧, opacity 0.25-0.35)    │
└────────────────────────────────────────────┘
```

**关键约束**：上下装饰总 opacity ≤0.4，CENTER 区保持 opacity=1.0 绝对焦点。

### 10.3 badge-system — Badge 标签系统

**效果**：金色=数据点，绿色=方法论/正向指标。让关键概念可快速扫描。

```css
.badge{display:inline-block;font-size:16px;padding:4px 12px;border-radius:8px;margin:2px 4px}
.badge-gold{background:rgba(212,168,83,0.15);color:#d4a853;border:1px solid rgba(212,168,83,0.25)}
.badge-green{background:rgba(70,200,120,0.1);color:#4ecb71;border:1px solid rgba(70,200,120,0.2)}
```

```html
<span class="badge badge-gold">80x增长</span>
<span class="badge badge-green">100%AI代码</span>
```

### 10.4 content-enrich — 从研究文档富化内容

**问题**：仅展示 headline 数据（如"B站80万播放"）太空泛，缺乏信息密度。

**解决**：从 info/ 研究文档中提取具体数据点注入卡片和标签：

| 来源 | 提取内容 | 注入位置 |
|------|---------|---------|
| B站视频列表 | UP主名 + 精确播放量 | 平台卡片 `.pl-desc` |
| 知乎文章列表 | 作者名 + 赞数 + 文章标题 | 平台卡片 |
| 36氪/虎嗅报道 | 估值、IPO时间、基础设施数据 | 数据卡片 `.stat-sub` + bottom ghost-label |
| 方法论文章 | SDD/Vibe Coding/5个反常识 | badge 标签 + 描述文字 |
| 技术分析 | 工具名(BashTool等)、隐藏功能(Kairos等) | 卡片副描述 |

**原则**：每个数字都标注来源，每个概念都用 badge 标记类型。

### 10.5 更新后的每段元素基准

| 区域 | 元素类型 | 数量 |
|------|---------|------|
| TOP | line-h + ghost-label + dot + glow-ring | 6-8 |
| CENTER | title + subtitle + cards + badges + desc | 8-12 |
| BOTTOM | line-h + ghost-num + ghost-label + dot + glow-ring | 7-9 |
| 全局 | canvas particles + bg layers + subtitles | 4 |
| **合计** | | **25-33** |

---

## GSAP 官方插件说明

本技能涉及以下 GSAP 插件，全部免费（Webflow 收购后已开源）：

| 插件 | 用途 | 官方导入 |
|------|------|---------|
| SplitText | 逐字/逐行拆分文本 | `import { SplitText } from "gsap/all"` |
| ScrambleTextPlugin | 文字乱码滚动效果 | `import { ScrambleTextPlugin } from "gsap/all"` |
| MorphSVGPlugin | SVG 形状变形 | `import { MorphSVGPlugin } from "gsap/all"` |
| DrawSVGPlugin | SVG 描边绘制 | `import { DrawSVGPlugin } from "gsap/all"` |
| CustomEase | 自定义缓动曲线 | `import { CustomEase } from "gsap/all"` |
| Physics2DPlugin | 物理模拟动画 | `import { Physics2DPlugin } from "gsap/all"` |
| InertiaPlugin | 惯性动量动画 | `import { InertiaPlugin } from "gsap/all"` |
| MotionPathPlugin | 沿路径运动 | `import { MotionPathPlugin } from "gsap/all"` |

所有插件在 npm 包 `gsap` 中已包含，无需单独安装。详见：https://gsap.com/docs/v3/Plugins/

## Easing 参考

| Ease | 感觉 | 适用场景 |
|------|------|---------|
| `power4.out` | 犀利减速 | 入场动画（现代感） |
| `expo.inOut` | 快速过渡 | 段间切换 |
| `back.out(4)` | 强烈 overshoot | 弹性入场（冲击力） |
| `sine.inOut` | 柔和呼吸 | 辉光脉冲、循环动画 |
| `power2.out` | 轻微减速 | 数字计数 |
| `power4.in` | 逐渐加速 | 退场动画 |
| `none` | 线性 | Canvas 时间驱动 |

详见 GSAP 官方 Easing 文档：https://gsap.com/docs/v3/Eases/

## 模式变体速查

以下名称在框架映射表（SKILL.md Step 3、frameworks.md、tts-script.md）中引用，均为上述基础模式的变体组合：

| 名称 | 对应实现 | 说明 |
|------|---------|------|
| `slow-flyin` | `charIn(sel, at, 0.65, 0.06)` | 慢速逐字入场（CTA 页面），比封面 dur=0.6 更慢 |
| `breathe` | `gPulse(sel, at, 2)` 或 glow-ring yoyo | 标题/光环呼吸效果（yoyo×2） |
| `platform-grid` | `cardIn()` 批量 stagger + §9.7 编码 | 平台卡片网格排列，基础=card-stagger |
| `arrow-burst` | vs-slide §6 箭头动画 | 对比页箭头爆破（scale:0→1, back.out(2.5)） |
| `multi-ring` | `gIn()`/`gDrift()` ×N 层 | 多层同心辉光环，§9.1 |
| `double-data-bar` | data-bar ×2（不同宽度） | 双数据条叠放，§9.8 |
| `double-ghost` | `ghostIn()` ×2（不同 opacity） | 双幽灵文字层，§9.5 |
| `accent-dots` | `dotIn()` ×8-10 | 散布装饰点，§9.3 |
| `trend-indicators` | `trendIn()` + `.trend-up` CSS | 趋势指示器，§9.4 |
| `platform-color-coding` | `.pl-card.pb/.pz/.pj` CSS | 平台色编码，§9.7 |
