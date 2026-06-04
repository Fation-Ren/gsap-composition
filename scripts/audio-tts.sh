#!/bin/bash
# GSAP Composition — TTS 批量生成 + 锚点表 + BGM 处理
# 用法: bash scripts/audio-tts.sh <项目目录>
set -euo pipefail

DIR="${1:-.}"
TTS_DIR="${DIR}/tts_segments"
AUDIO_DIR="${DIR}/audio"
COVER_SILENCE="${2:-8.0}"  # 封面静音秒数
VOICE="${3:-zh-CN-XiaoxiaoNeural}"
RATE="${4:--5%}"

mkdir -p "${TTS_DIR}" "${AUDIO_DIR}"

# 检查 .txt 分段文件是否存在
if ! ls "${TTS_DIR}"/s*.txt >/dev/null 2>&1; then
  echo "ERROR: 未找到分段文件 (${TTS_DIR}/s*.txt)"
  echo "请先运行: node scripts/split-tts.js tts_script.md ${TTS_DIR}/"
  exit 1
fi

# === Step 1: 逐句生成 TTS（从 tts_segments/*.txt） ===
echo "=== 生成 TTS ==="
for f in "${TTS_DIR}"/s*.txt; do
  name="${f%.txt}"
  echo "  TTS: $(basename "$f")"
  edge-tts --voice "${VOICE}" --rate="${RATE}" -f "$f" --write-media "${name}.mp3"
done

# === Step 2: 构建锚点表 ===
echo ""
echo "=== 锚点表 (timing_reference.md) ==="
echo "| 段 | 起始(s) | 时长(s) | 结束(s) |"
echo "|----|---------|---------|---------|"
acc="${COVER_SILENCE}"
for f in "${TTS_DIR}"/s*.mp3; do
  name=$(basename "${f%.mp3}")
  d=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  end=$(echo "$acc + $d" | bc -l)
  printf "| %s | %.2f | %.2f | %.2f |\n" "$name" "$acc" "$d" "$end"
  acc=$end
done > "${DIR}/timing_reference.md"
cat "${DIR}/timing_reference.md"

# === Step 3: 合并 TTS ===
echo ""
echo "=== 合并 TTS ==="
# 用 concat demuxer 拼接（比 filter_complex adelay+concat 更可靠）
CONCAT_LIST="${DIR}/tts_segments/concat-list.txt"
for f in "${TTS_DIR}"/s*.mp3; do
  echo "file '$(basename "$f")'" >> "${CONCAT_LIST}"
done

# TOTAL 由上一步锚点表累加得出
TOTAL="${acc}"

# 拼接所有段
ffmpeg -f concat -safe 0 -i "${CONCAT_LIST}" -c copy "${AUDIO_DIR}/tts_body.mp3" -y

# 嵌入封面静音
ffmpeg -i "${AUDIO_DIR}/tts_body.mp3" \
  -af "adelay=${COVER_SILENCE}000|${COVER_SILENCE}000,apad=whole_dur=${TOTAL}" \
  -c:a libmp3lame -b:a 48k "${AUDIO_DIR}/tts.mp3" -y

echo "  TTS 合并完成: ${AUDIO_DIR}/tts.mp3 (${TOTAL}s)"

# === Step 4: BGM 循环 + 降音量 ===
echo ""
echo "=== BGM 处理 ==="
if [ -f "${AUDIO_DIR}/bgm.mp3" ]; then
  ffmpeg -stream_loop -1 -i "${AUDIO_DIR}/bgm.mp3" \
    -t "$TOTAL" \
    -af "volume=-10dB" \
    -c:a libmp3lame -b:a 128k \
    "${AUDIO_DIR}/bgm_low.mp3" -y
  echo "  BGM: ${AUDIO_DIR}/bgm_low.mp3"
else
  echo "  跳过 (未找到 ${AUDIO_DIR}/bgm.mp3)"
fi

echo ""
echo "=== 音频生产完成 ==="
echo "  TTS: ${AUDIO_DIR}/tts.mp3"
echo "  BGM: ${AUDIO_DIR}/bgm_low.mp3 (如有)"
echo "  锚点: ${DIR}/timing_reference.md"
