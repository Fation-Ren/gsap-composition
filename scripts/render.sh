#!/bin/bash
# GSAP Composition — 视频渲染 + 裁切
# 用法: bash scripts/render.sh <project_dir> <tts_duration_seconds>
set -euo pipefail

DIR="${1:-gsap}"
DURATION="${2:-60}"

# 检查 HyperFrames
if ! npx hyperframes --version >/dev/null 2>&1; then
  echo "ERROR: HyperFrames 未安装。首次运行将自动安装："
  echo "  npx hyperframes --version"
  echo "或跳过视频渲染，在浏览器中直接预览 HTML。"
  exit 1
fi

echo "=== Lint: ${DIR}/ ==="
npx hyperframes lint "${DIR}/"

echo "=== Render: ${DIR}/ → video.mp4 ==="
npx hyperframes render "${DIR}/" -o "${DIR}/video.mp4" -q high --workers 2

echo "=== 裁切: 尾部空白 → ${DURATION}s ==="
ffmpeg -i "${DIR}/video.mp4" -t "${DURATION}" -c copy "${DIR}/video_final.mp4" -y

echo "=== 完成: ${DIR}/video_final.mp4 ==="
