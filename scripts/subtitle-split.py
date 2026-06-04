#!/usr/bin/env python3
# GSAP Composition — 长字幕拆分 + 时序估算
# 用法: python3 scripts/subtitle-split.py <timing_reference.md> <tts_script.md>
# 输出: subtitle_timeline.json

import re
import sys
import json
import os

def split_text(text, max_chars=70):
    """在句号处拆分长字幕，用字符比例估算分段时间"""
    if len(text) <= max_chars:
        return [text]

    sentences = re.split(r'(?<=[。！？])(?=\S)', text)
    if len(sentences) <= 1:
        sentences = re.split(r'(?<=，)(?=\S)', text)

    chunks = []
    current = ""
    for s in sentences:
        if len(current) + len(s) > max_chars and current:
            chunks.append(current.strip())
            current = s
        else:
            current += s
    if current:
        chunks.append(current.strip())
    return chunks


def estimate_timing(chunks, seg_start, seg_duration, full_text_len):
    """按字符比例估算每段字幕的起始时间"""
    result = []
    for i, chunk in enumerate(chunks):
        if i == 0:
            start = seg_start
        else:
            prev_ratio = sum(len(c) for c in chunks[:i]) / full_text_len
            start = seg_start + seg_duration * prev_ratio
        result.append({"start": round(start, 2), "text": chunk})
    return result


def parse_timing_ref(filepath):
    """从 timing_reference.md 解析锚点表"""
    offsets = {}
    with open(filepath, 'r') as f:
        for line in f:
            m = re.match(r'^\|\s*(s\d+_\d+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|', line)
            if m:
                offsets[m.group(1)] = {
                    "start": float(m.group(2)),
                    "duration": float(m.group(3))
                }
    return offsets


def parse_tts_script(filepath):
    """从 tts_script.md 提取 TTS 文本段"""
    with open(filepath, 'r') as f:
        content = f.read()

    segments = []
    pattern = re.compile(r'##\s+(.+?)\n(.*?)(?=\n##|\Z)', re.DOTALL)
    for m in pattern.finditer(content):
        title = m.group(1).strip()
        body = m.group(2)
        tts_match = re.search(r'TTS文本[：:]\s*(.+?)(?:\n|$)', body)
        if tts_match:
            segments.append({"title": title, "text": tts_match.group(1).strip()})

    return segments


def main():
    timing_file = sys.argv[1] if len(sys.argv) > 1 else 'timing_reference.md'
    tts_file = sys.argv[2] if len(sys.argv) > 2 else 'tts_script.md'

    if not os.path.exists(timing_file):
        print(f"ERROR: 锚点表不存在: {timing_file}", file=sys.stderr)
        # Fallback: generate from TTS script only
        segments = parse_tts_script(tts_file)
        print(f"从 TTS 脚本生成 (无锚点表): {len(segments)} 段", file=sys.stderr)
        subtitle_timeline = []
        for seg in segments:
            chunks = split_text(seg["text"])
            subtitle_timeline.append({
                "title": seg["title"],
                "chunks": [{"start": 0, "text": c} for c in chunks]
            })
    else:
        offsets = parse_timing_ref(timing_file)
        segments = parse_tts_script(tts_file)
        print(f"锚点: {len(offsets)} 段, TTS脚本: {len(segments)} 段", file=sys.stderr)

        subtitle_timeline = []
        for i, seg in enumerate(segments):
            seg_key = list(offsets.keys())[i] if i < len(offsets) else None
            if seg_key:
                seg_start = offsets[seg_key]["start"]
                seg_duration = offsets[seg_key]["duration"]
                full_text = seg["text"]
                chunks = split_text(full_text)
                chunks_with_timing = estimate_timing(chunks, seg_start, seg_duration, len(full_text))
                subtitle_timeline.append({
                    "title": seg["title"],
                    "seg_key": seg_key,
                    "seg_start": seg_start,
                    "chunks": chunks_with_timing
                })
            else:
                chunks = split_text(seg["text"])
                subtitle_timeline.append({
                    "title": seg["title"],
                    "chunks": [{"start": 0, "text": c} for c in chunks]
                })

    print(json.dumps(subtitle_timeline, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
