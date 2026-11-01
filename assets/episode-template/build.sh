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
"$PY" "$HERE/check-characters.py"                                                        # 0. 角色、姓名和固定音色校验
LANGUAGE=$("$PY" "$HERE/check-characters.py" --language)
run tts    "$PY" core/tts/tts_zh.py "$HERE/lines.json" "$HERE/voices/raw"                     # 1. 按 episode.json 语言配音（edge-tts，需要联网）
run voice  "$PY" "$HERE/voice.py"                                                              # 2. 按角色处理 + 口型数据
run asr    env HF_ENDPOINT=${HF_ENDPOINT:-https://hf-mirror.com} "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" --lang "$LANGUAGE"   # 3. Whisper 逐句复核
run events node core/render/events.mjs "$HERE" --size 1920x1080                              # 4. 时间线 → events.json
node "$HERE/check-cast.mjs"                                                                 # 按真实发声区间检查出镜；from=video 也不能跳过
run score  "$PY" "$HERE/music/score.py"                                                        # 5. 配乐
run mix    "$PY" "$HERE/mix.py"                                                                # 6. 音效 + 配音 + 配乐 + 环境声 → mix.wav
run srt    node "$HERE/srt.mjs"                                                              # 7. 字幕 → $NAME.srt
run video  node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1920x1080 --out "$HERE/out/video.mp4"   # 8. 逐帧渲染
run mux    sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/out/master.mp4" 24 0               # 9. 合成，响度 −14 LUFS，不加颗粒
# 10. 转成手机、浏览器、Windows 播放器都能打开的格式（yuv420p、bt709、索引放在开头），音轨原样复制
# 去掉截帧继承的 ICC，避免它覆盖 BT.709；转换输出矩阵并明确写入视频色彩信息。
run final  ffmpeg -v error -y -i "$HERE/out/master.mp4" -map_metadata -1 -c:v libx264 -profile:v high -level:v 4.2 -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,sidedata=mode=delete:type=ICC_PROFILE,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv" \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -crf 18 -preset slow -r 24 -c:a copy -movflags +faststart+write_colr "$HERE/$NAME.mp4"
echo "done: $HERE/$NAME.mp4"
