#!/usr/bin/env node
// GSAP Composition — 将 tts_script.md 拆分为 tts_segments/*.txt
// 用法: node scripts/split-tts.js <tts_script.md> [tts_segments_dir]
// 输出: tts_segments/s1_01.txt, s1_02.txt, ...

const fs = require('fs');
const path = require('path');

const ttsFile = process.argv[2] || 'tts_script.md';
const outDir = process.argv[3] || 'tts_segments';

if (!fs.existsSync(ttsFile)) {
  console.error('ERROR: 文件不存在:', ttsFile);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const content = fs.readFileSync(ttsFile, 'utf-8');
// 确保以 ## 开头的文件首段也能被正确捕获
const normalized = content.startsWith('##') ? '\n' + content : content;
const sections = normalized.split(/\n##\s+/);
// sections[0] = everything before first ## (ignore)
// sections[1..] = each page

let segIndex = 1;
for (let i = 1; i < sections.length; i++) {
  const section = sections[i];
  const lines = section.split('\n');
  const title = lines[0].trim();

  // Extract TTS text
  let ttsText = '';
  for (const line of lines) {
    const m = line.match(/TTS文本[：:]\s*(.+)/);
    if (m) {
      ttsText = m[1].trim();
      break;
    }
  }

  if (!ttsText) {
    console.error(`SKIP (无 TTS文本): ${title}`);
    continue;
  }

  const segKey = `s${segIndex}_01`;
  const filepath = path.join(outDir, `${segKey}.txt`);
  fs.writeFileSync(filepath, ttsText, 'utf-8');
  console.error(`  ${segKey}.txt — ${title} (${ttsText.length} 字)`);
  segIndex++;
}

console.log(outDir);
