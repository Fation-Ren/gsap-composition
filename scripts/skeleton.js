// GSAP Composition — HTML 文件骨架脚本
// 所有生成的 HTML 文件必须在 <script> 标签开头内联此文件内容

// 确定性 PRNG（替代 Math.random）
function mulberry32(a) {
  a |= 0;
  a = a + 1831565813 | 0;
  var t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
var r1 = mulberry32(42);  // 主动画随机
var r2 = mulberry32(99);  // 粒子/背景随机

// 时间线注册（key 必须与 HTML 中 data-composition-id 一致）
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
window.__timelines["root"] = tl;
