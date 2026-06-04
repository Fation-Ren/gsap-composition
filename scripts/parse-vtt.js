#!/usr/bin/env node
// GSAP Composition — VTT 字幕解析
// 用法: node scripts/parse-vtt.js <vtt_dir> <timing_reference.md>
// 输出: subtitles.json

const fs = require('fs');
const path = require('path');

// 从 timing_reference.md 解析锚点表
function parseTimingRef(filepath) {
  const offsets = {};
  const lines = fs.readFileSync(filepath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\|\s*(s\d+_\d+)\s*\|\s*([\d.]+)\s*\|/);
    if (m) offsets[m[1]] = parseFloat(m[2]);
  }
  return offsets;
}

// 解析单个 VTT 文件
function parseVTT(filepath, offset) {
  const lines = fs.readFileSync(filepath, 'utf-8').split(/\r?\n/);
  const subs = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith('WEBVTT') || /^\s*$/.test(lines[i])) { i++; continue; }
    if (/^\d+\s*$/.test(lines[i])) { i++; continue; }
    const m = lines[i].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (m) {
      const start = +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000;
      const end   = +m[5]*3600 + +m[6]*60 + +m[7] + +m[8]/1000;
      i++;
      let text = '';
      while (i < lines.length && !/^\s*$/.test(lines[i])) {
        text += (text ? ' ' : '') + lines[i].trim(); i++;
      }
      if (text) subs.push({
        start: +(start + offset).toFixed(2),
        end:   +(end + offset).toFixed(2),
        text
      });
    } else { i++; }
  }
  return subs;
}

// === Main ===
const vttDir = process.argv[2] || 'tts_segments';
const timingFile = process.argv[3] || 'timing_reference.md';

if (!fs.existsSync(timingFile)) {
  console.error('ERROR: 锚点表不存在:', timingFile);
  process.exit(1);
}

const offsets = parseTimingRef(timingFile);
console.error('锚点:', offsets);

const allSubs = [];
const vttFiles = fs.readdirSync(vttDir).filter(f => f.endsWith('.vtt')).sort();
for (const f of vttFiles) {
  const segName = path.basename(f, '.vtt');
  const offset = offsets[segName] || 0;
  const subs = parseVTT(path.join(vttDir, f), offset);
  console.error(`  ${f}: ${subs.length} 条字幕 (offset=${offset})`);
  allSubs.push(...subs);
}

console.log(JSON.stringify(allSubs, null, 2));
console.error(`总计: ${allSubs.length} 条字幕`);
