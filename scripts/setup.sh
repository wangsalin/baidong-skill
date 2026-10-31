#!/bin/sh
# sh setup.sh check（只检查）或 install（在所选LIB中安装依赖）。
set -eu
BAIDONG_SKILL_ROOT=$(cd "$(dirname "$0")/.." && pwd); export BAIDONG_SKILL_ROOT
. "$BAIDONG_SKILL_ROOT/scripts/runtime.sh"
MODE=${1:-check}
case "$MODE" in check|install) ;; *) echo '用法：sh setup.sh [check|install]' >&2; exit 2;; esac
if [ "$MODE" = install ]; then
  command -v npm >/dev/null || { echo '需要先安装 Node.js 20+ 和 npm。' >&2; exit 1; }
  command -v ffmpeg >/dev/null || { echo '需要先安装 FFmpeg 8+（含 ffprobe）。' >&2; exit 1; }
  cd "$LIB"
  npm ci --ignore-scripts --no-audit --no-fund
  node node_modules/playwright-core/cli.js install chromium-headless-shell
  if [ ! -x .venv/bin/python ]; then python3 -m venv .venv; fi
  .venv/bin/python -m pip install -r "$BAIDONG_SKILL_ROOT/assets/requirements-baidong.txt"
fi
PY="$LIB/.venv/bin/python"
[ -x "$PY" ] || { echo "缺少Python虚拟环境：$PY；运行 sh setup.sh install。" >&2; exit 1; }
"$PY" - "$LIB" <<'PY'
import importlib, re, subprocess, sys
from pathlib import Path
lib = Path(sys.argv[1])
for name in ('numpy', 'scipy', 'soundfile', 'soxr', 'PIL', 'edge_tts', 'faster_whisper'):
    importlib.import_module(name)
node = subprocess.check_output(['node', '-p', 'JSON.stringify({version:process.versions.node,platform:process.platform})'], text=True).strip()
import json
info = json.loads(node)
assert info['platform'] != 'win32', 'WSL/Linux内误用了Windows版Node，请调整PATH。'
assert int(info['version'].split('.')[0]) >= 20, node
version = subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0]
release = re.search(r'version n?(\d+)', version)
assert release and int(release[1]) >= 8, version
subprocess.check_call(['ffprobe', '-version'], stdout=subprocess.DEVNULL)
print('Python依赖、Node、FFmpeg与ffprobe通过。')
PY
cd "$LIB"
node --input-type=module - <<'JS'
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME||undefined});
const page=await browser.newPage();await page.setContent('<canvas id="c"></canvas>');
if(!await page.evaluate(()=>!!document.querySelector('canvas').getContext('2d')))throw Error('Canvas不可用');
await browser.close();console.log('无头浏览器与Canvas实际启动通过。');
JS
printf 'LIB=%s\n' "$LIB"
echo '环境检查通过。中文TTS、字体下载与首次ASR模型下载仍需要网络；本检查不发起这些下载。'
