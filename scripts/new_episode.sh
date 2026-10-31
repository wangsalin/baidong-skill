#!/bin/sh
# 从模板新建一期：在 Windows 的 Git Bash 里运行
#   sh new_episode.sh <期号> <英文短名>        例：sh new_episode.sh 01 income-gap
# 结果：G:\vibe\baidong\ep01-income-gap\（WSL 里是 /mnt/g/vibe/baidong/ep01-income-gap）
set -eu
SKILL=$(cd "$(dirname "$0")/.." && pwd)
if command -v python3 >/dev/null 2>&1; then PYTHON=python3; else PYTHON=python; fi
exec "$PYTHON" "$SKILL/scripts/new_episode.py" "$@"
