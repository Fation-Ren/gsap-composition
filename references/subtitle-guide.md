# Subtitle Production Guide — 字幕拆分 + 时序 + 显隐

## 核心原则

**字幕文本 = TTS 音频文本（逐字一致）。** 不简化、不改写 —— TTS 念什么，字幕显示什么。

---

## 1. 长字幕拆分

超过 15 秒或 70 字的字幕段，观众来不及读完。在自然句号处拆分。

### 拆分 + 时序估算

由 `scripts/subtitle-split.py` 完成：
```bash
python3 scripts/subtitle-split.py timing_reference.md tts_script.md > subtitle_timeline.json
```

内部逻辑：按中文句号/逗号拆分 → 字符比例估算分段时间 → 输出 JSON。详见脚本源码。

> **不需要重新生成 TTS**。TTS 音频保持不变，只增加更多 setSub 调用来分段显示字幕。

---

## 2. 字幕时间轴

使用 timing_reference.md 的精确锚点时间，每个 setSub 调用的时间直接取自锚点表：

```js
// ✅ 精确时间来自 TTS 锚点表
setSub('先听一个故事。小明有一匹很快的马叫AI模型...', '', 8.00);
setSub('在计算机世界里，Harness有两个意思...', '', 32.41);
setSub('为什么现在大家都在说Harness？...', '', 66.70);

// ❌ 估算时间，必然错位
setSub('...', '', T1 + 5);
```

**字幕与前一个场景的退出重叠 2 秒以上**，确保不会出现字幕空白。

---

## 3. 封面隐藏字幕

封面展示期间（无声阶段）不显示字幕区域：

```css
#subtitle-area { opacity: 0; }
```

```js
// 场景 1 开始时显示字幕区
tl.set('#subtitle-area', { opacity: 1 }, T1);
```

`setSub` 函数使用 `tl.call()` 调度，确保在正确的时间点触发：

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

> **关键**：`setSub` 的第三个参数 `at` 是必须的 —— 它确保字幕在时间轴正确位置切换，而非脚本加载时立即执行。

---

## 4. 字幕样式

```css
#subtitle-area {
  position: fixed; bottom: 80px; left: 0; z-index: 100;
  width: 1080px; height: 120px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}
#sub1, #sub2 {
  max-width: 880px; text-align: center;
  font-size: 30px; font-weight: 500; color: #fff;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  opacity: 0; transition: opacity 0.15s;
}
```

- 底部 80px 留出安全距离
- 最大宽度 880px（左右各 100px margin）
- 文字阴影增强可读性
- 双行 sub1/sub2 支持轮换显示
