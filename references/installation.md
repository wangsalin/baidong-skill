# 白洞 v4 完整包：安装与迁移

内容规则于2026-11-04更新：面向普通人的商业与经济知识解说，以商业案例、生活经济、工作与收入为主线，不同角色提问与解答，默认有戏问、小算盘答，问题后立即回答再解释，去掉剧情演绎。抖音以45—60秒独立短竖版为主力，完整横版深入讲案例，完整竖版按需求补充；不固定每期短版数量。每期完整制作仍默认中英文各一支完整横版与主力短竖版，用户明确缩小范围时除外。保留Sci-Fi Sitcom Toon画法、八位角色、固定声音与制作链，真实B-roll按台词和可核实来源接入；《沉没成本》只参考画法、声音与技术。中英文竖屏采用原生9:16构图，配色按主题变化，字幕单行、按语义分屏。

## 包里有什么

- `SKILL.md`、`references/`：账号定位、商业案例研究、数据分析、直接口语讲解、科幻卡通、角色、制作与分发规则。
- `assets/episode-template/`：新一期模板、角色代码、时间线、配音处理、可听BGM混音和封面。
- `assets/music/`：六首用户已确认入库的商业经济解说配乐及两首历史用户音轨，包含原音、纯音乐/双角色对白试听、作者官网与CC BY 4.0证据、相对路径、SHA256和署名。后续按题材轮换，Cold Funk 为模板起始配置；不再默认优先旧 Vibe 音轨。
- `assets/lemo-runtime/`：本次实际使用的Lemo轻量源码、`scifi-toon`风格文档、MIT许可、依赖锁文件；上游版本 `413a6bd6d78ebd3bdd5abaec9538a26867f890df`。不包含其他风格的演示、乐器采样或英文模型。
- `assets/examples/ep08-sunk-cost/`：已认可的完整成片、封面、源码、62句处理后配音、字幕、发布介绍及原QA记录。只参考画法、配色、声音与技术，不恢复新期剧情要求。`REFERENCE.md` 说明重建方式。
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

1. 按skill完成商业经济选题、研究与双角色问答稿，分别明确完整稿、独立短稿及本次范围；用户已认可脚本并要求开工时直接进入制作，不重复索要确认。
2. 在新项目编写 `lines.json`、`story.js`、`scenes.js`（横版）或 `portrait.js`（竖版）与必要图表、真实B-roll；`main.js` 是固定制作壳，不在单期改写。新建的20秒模板只是技术接线示例，旧剧情对白与镜头须替换为本期问答和解释。两位正式角色使用 `formal` 模式，谁说话谁出镜，换人时核对本人音色与口型。
3. `python3 /path/to/episode/fonts/fetch_fonts.py` 下载本期文字子集；改了画面文字要重新取字体。若本机联网条件要求，可在Windows Python运行此步。
4. `sh /path/to/episode/build.sh` 完整制作；`from=events`可从已核查配音之后接续。ASR失败先核实发音；保留用户已认可文字，不为绕过检查随便改字幕。
5. `music/selection.json` 默认Vibe音源、增益+9dB。《We Never》使用 `track_id: "we-never-hi-noise"`；按主题选，不能把未核实音轨写成原创。关键定义使用 `music_key: true` 轻降配乐，仍需成片核查。
6. 按 `distribution.md` 交付本次范围内的中英文完整横版、主力短竖版、各自字幕、封面和发布物料，完整竖版与额外短片按需制作。交付清单写清用途、实际时长与推荐先看的文件，保留已验收完整版；新主题不复制示例发布文案。

单期目录、四版工程与正式文件命名按 `references/production.md` 第2节的铁律执行：同一单期根目录内保存四版真实工程，根目录直接交付 MP4、同名 SRT、封面和资料；网页只作辅助。跨机器仅更换项目根路径，不另造深层日期轮次目录作为正式交付。每期制作默认四版时，先读 `references/vertical.md`。新建时使用 --language 和 --aspect 分别建立工程；原生竖版分支已随模板提供。分别准备中英文及缩减稿、配音与时间线，按同一 build.sh 构建，不能替换固定包装。中文横版渲染成功不等于另外三版已经完成。

最终执行解码、黑帧、字幕和响度检查，用混音听写检查对白；实际看样帧和动作。机器听写不等于真人试听。未接工作台就明确本地保存，未经用户指令不向平台发布。

## 重现与许可

参考工程的原片和原检查记录按原样保留；重建后应生成新的检查结果，不能沿用旧报告声称新媒体已验证。Lemo源码保留MIT许可，字体带OFL许可。音乐保留用户提供的来源与已知信息；尚未核实的曲名、作者或许可不自行补写。
