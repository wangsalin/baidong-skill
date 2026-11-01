# 白洞 v4 完整包：安装与迁移

制作规则于2026-10-30更新：每期默认制作中文横版、中文竖版、英文横版、英文竖版，用户明确缩小本次范围时除外。沿用用户认可的《沉没成本》方向。专业名词和缩写首次出现时，必须说清所属体系和字母含义。中英文竖屏使用统一的原生 9:16 版式逻辑，配色按主题变化；原生竖屏需在单期工程里实现独立画面分支。

## 包里有什么

- `SKILL.md`、`references/`：账号、冲突叙事、口语解释、科幻卡通、角色、制作与分发规则。
- `assets/episode-template/`：新一期模板、角色代码、时间线、配音处理、可听BGM混音和封面。
- `assets/music/`：用户指定的Vibe音轨与《We Never — Hi Noise》，目录使用相对路径并保留原始SHA256和来源记录。
- `assets/lemo-runtime/`：本次实际使用的Lemo轻量源码、`scifi-toon`风格文档、MIT许可、依赖锁文件；上游版本 `413a6bd6d78ebd3bdd5abaec9538a26867f890df`。不包含其他风格的演示、乐器采样或英文模型。
- `assets/examples/ep08-sunk-cost/`：已认可的完整成片、封面、源码、62句处理后配音、字幕、发布介绍及原QA记录。用途是观察动作、解释和色彩，不让下一期照抄剧情。`REFERENCE.md` 说明重建方式。
- `assets/examples/cover-styles/`：用户暂用的三种封面风格，含六张横竖参考图与总览；规则见 `references/covers.md`，不把样图冒充本期输出。
- `assets/examples/cover-v5/`：用户认可的 V5 具体冲突与原生竖版案例；含 15 期设计索引、两种竖版总览、四张代表图总览，第 1/9/13/14 期四比例中文图及第 13 期四比例英文图。样例随包读取，不依赖原本机预览站；历史案例不替代正式八人角色注册表。
- `assets/examples/vertical-layout-demo/`：已确认的第九期式竖屏版面演示和总览图。仅参考画面分区、主体位置与字幕安全区；演示配色不固定，也不是一条完整视频。
- `PACKAGE-MANIFEST.json`：包内文件大小与SHA256。安装后产生的缓存不属于原始清单。

Node/Python本体、FFmpeg、`node_modules`、Python虚拟环境、Chromium、Whisper模型和可选乐器采样库不适合跨系统直接复制，因此不随包打入。完整skill不代表已经装好了这些软件。

## 在 OpenClaw 使用

把整个 `baidong` 目录放进当前OpenClaw工作区的 `skills/baidong`，保留目录结构。然后让Agent使用白洞skill制作下一期；确认它可以运行本地Shell、访问项目目录和网络，并具备足够的执行时长。

如果运行在容器/服务器，安装与渲染必须在同一环境中进行，或者明确提供可调用的制作主机。仅导入文字而没有文件与命令执行能力，不能产出视频。工作台的 `ArtifactData` 不是普通Shell工具；未连接时只保存本地JSON，不填假的同步成功。

## Linux / WSL 环境

默认推荐Ubuntu/WSL。Windows原生先使用WSL；视频与依赖放在G盘或已有大容量Linux磁盘，不默认放C盘。

需要 Bash/sh、Python 3.11–3.13（含venv/pip）、Node.js 20+与npm、FFmpeg 8+和ffprobe。Linux浏览器运行所需系统库也要具备；若浏览器提示缺库，可按Playwright官方Linux依赖说明安装。ASR中文small模型首次下载约480MB；中文edge-tts与字体子集下载需要联网。

下方在 **Linux/WSL终端** 执行，将路径替换为实际解压位置：

```sh
export BAIDONG_SKILL_ROOT=/path/to/skills/baidong
# 默认优先复用已有 ~/lemo-opuscar；没有时用包内源码。
# 需要固定使用包内源码时，显式设置：
export LIB="$BAIDONG_SKILL_ROOT/assets/lemo-runtime"
sh "$BAIDONG_SKILL_ROOT/scripts/setup.sh" install
sh "$BAIDONG_SKILL_ROOT/scripts/setup.sh" check
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" 09 next-topic /path/to/video-projects
```

`install`只向所选LIB安装npm依赖、浏览器和Python虚拟环境；不会自动运行apt、修改DNS或下载英文配音模型。`check`实际导入Python包、核对Node/FFmpeg版本并启动浏览器，缺失即非零退出。新建项目会记录skill路径；搬动已建项目后更新 `.baidong.json`、`.baidong-runtime.sh`，或通过环境变量指定新目录。WSL内使用Linux版Node，避免PATH误选Windows版。

## 按认可的效果制作

1. 按skill完成选题和对白；用户已认可脚本并要求开工时直接进入制作，不重复索要确认。
2. 在新项目编写 `lines.json`、`story.js`、`main.js` 与必要道具；新建的20秒模板只是接线示例。
3. `python3 /path/to/episode/fonts/fetch_fonts.py` 下载本期文字子集；改了画面文字要重新取字体。若本机联网条件要求，可在Windows Python运行此步。
4. `sh /path/to/episode/build.sh` 完整制作；`from=events`可从已核查配音之后接续。ASR失败先核实发音；保留用户已认可文字，不为绕过检查随便改字幕。
5. `music/selection.json` 默认Vibe音源、增益+9dB。《We Never》使用 `track_id: "we-never-hi-noise"`；按主题选，不能把未核实音轨写成原创。关键定义使用 `music_key: true` 轻降配乐，仍需成片核查。
6. 按 `distribution.md` 交付中英文横竖四版、各自字幕、四种尺寸封面及英文适配封面、充分的中文六平台与英文海外平台介绍及对应章节；额外切片按需求制作。新主题使用真实内容，不复制示例发布文案。

每期制作默认四版时，先读 `references/vertical.md`。模板 `build.sh` 默认只渲染单语言横版；须分别准备中英文稿件、配音和时间线，为单期接入 `mode=portrait` 原生画面分支，再用随包渲染器制作与验收两种语言的竖版。中文横版渲染成功不等于另外三版已经完成。

最终执行解码、黑帧、字幕和响度检查，用混音听写检查对白；实际看样帧和动作。机器听写不等于真人试听。未接工作台就明确本地保存，未经用户指令不向平台发布。

## 重现与许可

参考工程的原片和原检查记录按原样保留；重建后应生成新的检查结果，不能沿用旧报告声称新媒体已验证。Lemo源码保留MIT许可，字体带OFL许可。音乐保留用户提供的来源与已知信息；尚未核实的曲名、作者或许可不自行补写。
