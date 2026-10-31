#!/bin/sh
# 出四种尺寸的封面：在 WSL 里运行   sh cover.sh /mnt/g/vibe/baidong/ep01-income-gap
# 封面文字、关键词、两人的表情在 story.js 的 COVER 里改；也可以临时覆盖：sh cover.sh <项目> 'title=能力不如我/凭什么赚更多？&hl=凭什么'
# 结果：项目里的 cover-16x9.jpg、cover-4x3.jpg（B 站）、cover-3x4.jpg、cover-9x16.jpg
set -eu
BAIDONG_SKILL_ROOT=$(cd "$(dirname "$0")/.." && pwd); export BAIDONG_SKILL_ROOT
. "$BAIDONG_SKILL_ROOT/scripts/runtime.sh"
P=${1:?用法：sh cover.sh <项目的 WSL 路径> [额外参数]}; EXTRA=${2:+&$2}
LIB=${LIB:-$HOME/lemo-opuscar}; cd "$LIB"
mkdir -p "$P/out/cover"
for spec in 16x9:1920x1080 4x3:1440x1080 3x4:1080x1440 9x16:1080x1920; do
  k=${spec%%:*}; size=${spec#*:}
  node core/render/still.mjs "$P" 0.5 --size "$size" --q "mode=cover&size=$k$EXTRA" --prefix "c$k-" --out "$P/out/cover"
  cp "$P/out/cover/c$k-0.5.jpg" "$P/cover-$k.jpg"
  echo "cover-$k.jpg ($size)"
done
