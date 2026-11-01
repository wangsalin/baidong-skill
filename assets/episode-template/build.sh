#!/bin/sh
# 从头重建整期：在 WSL 里运行 sh build.sh（需要 Lemo-Opuscar 库的 core 和 voice 依赖，以及 /usr/local/bin 里的 FFmpeg 8）
# 只想重做后半段时，可以从中间某一步开始：sh build.sh from=events
set -eu
HERE=$(cd "$(dirname "$0")" && pwd); NAME=$(basename "$HERE")
if [ -f "$HERE/.baidong-runtime.sh" ]; then . "$HERE/.baidong-runtime.sh"; fi
if [ "$(uname -s)" = Linux ]; then PATH="/usr/local/bin:/usr/bin:/bin:$PATH"; export PATH; fi
LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
PY=$LIB/.venv/bin/python
ARG=${1:-}; FROM=${ARG#from=}; [ "$FROM" = "$ARG" ] && FROM=tts
case "$FROM" in tts|voice|asr|events|score|mix|srt|video|mux|final) ;; *) echo "未知构建阶段：$FROM" >&2; exit 2;; esac
STARTED=
run() { case "$STARTED$1" in "$FROM"*|yes*) STARTED=yes; shift; "$@";; esac; }
cd "$LIB"
"$PY" "$HERE/check-production.py"
"$PY" "$HERE/check-characters.py"                                                        # 0. 角色、姓名和固定音色校验
LANGUAGE=$("$PY" "$HERE/check-characters.py" --language)
ASPECT=$("$PY" -c 'import json,sys; print(json.load(open(sys.argv[1])).get("aspect","landscape"))' "$HERE/episode.json")
STAGE=$("$PY" -c 'import json,sys; print(json.load(open(sys.argv[1])).get("stage","preview"))' "$HERE/episode.json")
SIZE=1920x1080; MODE=film
if [ "$ASPECT" = portrait ]; then SIZE=1080x1920; MODE=portrait; fi
OUTPUT=$HERE/$NAME.mp4
if [ "$STAGE" != final ]; then OUTPUT=$HERE/preview-$NAME.mp4; fi
run tts    "$PY" core/tts/tts_zh.py "$HERE/lines.json" "$HERE/voices/raw"                     # 1. 按 episode.json 语言配音（edge-tts，需要联网）
run voice  "$PY" "$HERE/voice.py"                                                              # 2. 按角色处理 + 口型数据
run asr    env HF_ENDPOINT=${HF_ENDPOINT:-https://hf-mirror.com} "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" --lang "$LANGUAGE"   # 3. Whisper 逐句复核
if [ "$STARTED" = yes ]; then "$PY" "$HERE/check-production.py" --record-asr-success; fi
"$PY" "$HERE/check-production.py" --phase render
node core/render/events.mjs "$HERE" --size "$SIZE" --q "mode=$MODE"
node "$HERE/check-cast.mjs" --size "$SIZE" --q "mode=$MODE"
"$PY" "$HERE/music/score.py"
"$PY" "$HERE/mix.py"
node "$HERE/srt.mjs"
case "$FROM" in
  mux|final) "$PY" "$HERE/check-production.py" --verify-video ;;
  *) node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size "$SIZE" --q "mode=$MODE" --out "$HERE/out/video.mp4"
     "$PY" "$HERE/check-production.py" --record-video-success ;;
esac
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/out/master.mp4" 24 0
# 10. 转成手机、浏览器、Windows 播放器都能打开的格式（yuv420p、bt709、索引放在开头），音轨原样复制
# 去掉截帧继承的 ICC，避免它覆盖 BT.709；转换输出矩阵并明确写入视频色彩信息。
ffmpeg -v error -y -i "$HERE/out/master.mp4" -map_metadata -1 -c:v libx264 -profile:v high -level:v 4.2 -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,sidedata=mode=delete:type=ICC_PROFILE,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv" \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -crf 18 -preset slow -r 24 -c:a copy -movflags +faststart+write_colr "$OUTPUT"
echo "rendered ($STAGE; 尚需实际画面、混音与媒体验收): $OUTPUT"
