#!/bin/sh
# 旧式竖版包装（1080×1920）：默认不要用于新片；原生竖屏按 references/vertical.md 制作。
# 只有用户明确要求横版小窗包装时才运行本脚本。
# 在 WSL 里运行：
#   sh clip.sh <项目的 WSL 路径> <开始秒数> <时长秒数> <编号> <标题> <三步因果链> <原理结论> <收尾句>
#   例：sh clip.sh /mnt/g/vibe/baidong/ep01-income-gap 21.5 48 1 '能力强为什么赚得少' '能力|议价|收入' '市场按议价结果付钱，不按辛苦程度付钱' '先问自己：我创造的价值，谁看得见？'
# 旧构图：顶部标题、中间横版画面（1080×608）、底部因果链。仅用于用户明确要求此包装的情况。
# 只裁已有的完整内容段：首句直接点题或讲原理，片段必须包含解释与结论；30–60 秒。此脚本不补开头、对白或收尾。
set -eu
BAIDONG_SKILL_ROOT=$(cd "$(dirname "$0")/.." && pwd); export BAIDONG_SKILL_ROOT
. "$BAIDONG_SKILL_ROOT/scripts/runtime.sh"
P=${1:?用法：sh clip.sh <项目> <开始> <时长> <编号> <标题> <三步因果链> <原理结论> <收尾句>}; SS=${2:?开始秒数}; DD=${3:?时长秒数}; K=${4:?编号}; TITLE=${5:?标题}; FLOW=${6:?三步因果链}; TAKEAWAY=${7:?原理结论}; CLOSING=${8:?收尾句}
TOTAL=$(awk "BEGIN{print $DD+0.5}")
LIB=${LIB:-$HOME/lemo-opuscar}; NAME=$(basename "$P"); FILM="$P/$NAME.mp4"
[ -f "$FILM" ] || { echo "找不到成片：$FILM（先跑 build.sh）"; exit 1; }
cd "$LIB"; mkdir -p "$P/out/clip"
Q=$(node -e 'const [question, flow, takeaway, closing] = process.argv.slice(1); console.log(new URLSearchParams({mode:"clipframe", question, flow, takeaway, closing}).toString())' "$TITLE" "$FLOW" "$TAKEAWAY" "$CLOSING")
node core/render/still.mjs "$P" 0.5 --size 1080x1920 --q "$Q" --prefix "frame$K-" --out "$P/out/clip"
ffmpeg -v error -y -ss "$SS" -t "$DD" -i "$FILM" -loop 1 -i "$P/out/clip/frame$K-0.5.jpg" \
  -filter_complex "[1:v]scale=1080:1920:in_range=full:out_range=tv,format=yuv420p[bg];[0:v]scale=1080:608,format=yuv420p,tpad=stop_mode=clone:stop_duration=0.5[v];[bg][v]overlay=0:430:shortest=1,format=yuv420p[o]" \
  -map "[o]" -map 0:a -t "$TOTAL" -c:v libx264 -profile:v high -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -crf 19 -preset slow -r 24 -c:a aac -b:a 192k \
  -af "apad=pad_dur=0.5,afade=t=in:d=0.05,afade=t=out:st=$DD:d=0.5" -movflags +faststart "$P/clip-$K.mp4"
echo "clip-$K.mp4（${SS}s 起，${DD}s）"
