#!/bin/sh
# 由其他脚本 source；不安装依赖，不修改系统设置。
if [ "$(uname -s)" = Linux ]; then
  PATH="/usr/local/bin:/usr/bin:/bin:$PATH"; export PATH
fi
if [ -z "${BAIDONG_SKILL_ROOT:-}" ]; then
  echo '请先设置 BAIDONG_SKILL_ROOT 为解压后的 baidong 目录。' >&2; return 1
fi
if [ -z "${LIB:-}" ]; then
  if [ -f "$HOME/lemo-opuscar/core/lib.js" ]; then LIB="$HOME/lemo-opuscar"
  else LIB="$BAIDONG_SKILL_ROOT/assets/lemo-runtime"; fi
fi
export LIB
[ -f "$LIB/core/render/page.mjs" ] || { echo "缺少 Lemo 源码：$LIB" >&2; return 1; }
