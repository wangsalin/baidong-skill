#!/bin/sh
# 从头重建整期：在 WSL 里运行 sh build.sh（需要 Lemo-Opuscar 库的 core 和 voice 依赖，以及 /usr/local/bin 里的 FFmpeg 8）
# 只想重做后半段时，可以从中间某一步开始：sh build.sh from=events
set -e
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
BAIDONG_SKILL_ROOT=$(cd "$(dirname "$0")/../../.." && pwd); export BAIDONG_SKILL_ROOT
. "$BAIDONG_SKILL_ROOT/scripts/runtime.sh"
HERE=$(cd "$(dirname "$0")" && pwd); NAME=$(basename "$HERE")
PY=$LIB/.venv/bin/python
FROM=${1#from=}; [ "$FROM" = "$1" ] && FROM=tts
run() { case "$STARTED$1" in "$FROM"*|yes*) STARTED=yes; shift; "$@";; esac; }
cd "$LIB"
run tts    $PY core/tts/tts_zh.py "$HERE/lines.json" "$HERE/voices/raw"                     # 1. 中文配音（edge-tts，需要联网）
run voice  $PY "$HERE/voice.py"                                                              # 2. 按角色处理 + 口型数据
run asr    $PY "$HERE/tools/check-voices.py"
run events node core/render/events.mjs "$HERE" --size 1920x1080                              # 4. 时间线 → events.json
run score  $PY "$HERE/music/score.py"                                                        # 5. 配乐
run mix    $PY "$HERE/mix.py"                                                                # 6. 音效 + 配音 + 配乐 + 环境声 → mix.wav
run srt    node "$HERE/srt.mjs"                                                              # 7. 字幕 → $NAME.srt
run video  node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1920x1080 --out "$HERE/out/video.mp4"   # 8. 逐帧渲染
run mux    sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/out/master.mp4" 24 0               # 9. 合成，响度 −14 LUFS，不加颗粒
# 10. 转成手机、浏览器、Windows 播放器都能打开的格式（yuv420p、bt709、索引放在开头），音轨原样复制
run final  ffmpeg -v error -y -i "$HERE/out/master.mp4" -c:v libx264 -profile:v high -level:v 4.2 -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -crf 18 -preset slow -r 24 -c:a copy -movflags +faststart "$HERE/$NAME.mp4"
echo "done: $HERE/$NAME.mp4"
