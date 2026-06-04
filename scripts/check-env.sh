#!/bin/bash
# GSAP Composition — 环境检查
set -euo pipefail

echo "=== GSAP Composition 环境检查 ==="
echo ""

# 1. GSAP
echo -n "GSAP: "
if [ -f gsap.min.js ]; then
  echo "OK ($(wc -c < gsap.min.js) bytes, local)"
elif npm list gsap --depth=0 >/dev/null 2>&1; then
  echo "OK (npm: $(node -e "console.log(require('gsap/package.json').version)"))"
else
  echo "MISSING — 运行: npm install gsap"
fi

# 2. Node
echo -n "Node: "
echo "$(node -v)"

# 3. HyperFrames (optional)
echo -n "HyperFrames: "
npx hyperframes --version 2>/dev/null && echo "" || echo "NOT INSTALLED (可选)"

# 4. edge-tts (optional)
echo -n "edge-tts: "
edge-tts --version 2>/dev/null || echo "NOT INSTALLED (可选)"

# 5. ffmpeg (optional)
echo -n "ffmpeg: "
ffmpeg -version 2>/dev/null | head -1 || echo "NOT INSTALLED (可选)"

echo ""
echo "=== 检查完成 ==="
