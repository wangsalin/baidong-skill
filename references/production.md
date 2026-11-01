# 白洞 · 制作

## 目录
1. 环境与命令的写法
2. 新建一期
3. 项目里有什么
4. 配音
5. 时间线（story.js）
6. 镜头（main.js；风格、表演和机制画面见 visual.md）
7. 自查与渲染
8. 已知的坑

---

## 1. 环境与命令的写法

跨机器安装以 `installation.md` 为准。`scripts/setup.sh check` 只检查，`install` 才安装依赖。新建脚本支持第三个参数指定项目根目录；包内默认已带两首用户音源，不必回到原电脑的 Downloads 寻找。

- 视频工具（Node、FFmpeg 8、Python、渲染用的无头浏览器）都在 **WSL 的 Ubuntu** 里，Ubuntu 的磁盘在 F 盘。Lemo-Opuscar 库在 `/home/salin/lemo-opuscar`（下文写作 `$LIB`）。
- Claude Code 跑在 Windows 上。调用 WSL 时，**`wsl.exe` 会把命令里的 `$变量` 提前展开**，所以凡是带变量的命令，都先写成一个脚本文件（放在 scratchpad），再这样运行：
  ```
  MSYS_NO_PATHCONV=1 wsl.exe -d Ubuntu -- bash /mnt/g/.../脚本.sh
  ```
  `MSYS_NO_PATHCONV=1` 不能省，否则 Git Bash 会把 `/mnt/...` 改成 Windows 路径。脚本里的路径都用 WSL 写法（`/mnt/g/...`、`/mnt/c/...`）。
- 需要访问 Google（取字体）的命令在 **Windows 的 Git Bash** 里运行，那边走代理 127.0.0.1:10808；WSL 访问不到这个代理。
- Windows 上的 Python 打开文件要写 `G:/vibe/...`，不能写 `/g/vibe/...`。
- 长任务（逐帧渲染、配乐）尽量在前台一次跑完（超时设到 10 分钟）。必须放后台时，同一回合里接着做别的事，不要留下只写“等通知”的空回合。
- 选配乐前读 `G:\vibe\baidong\music-library\catalog.json`，查用户偏好、音源路径和检查记录。按 2026-10-27 用户最新要求，后续优先尝试用户提供的《Vibe知识大赏_最火的那首BGM》视频中的音乐；《We Never — Hi Noise》保留备选，结合主题情绪和对白节奏选择，不强制每期同曲。使用前试听所选片段是否有人声干扰，配乐在对白下压低；曲名与作者以核实结果为准，在 `CREDITS` 和发布物料中如实记录来源。
- 需要另行制作配乐时，可沿用此前确认的真实乐器采样方向：112 拍、轻快有推进感，拨弦弦乐律动 + 马林巴 + 拍手沙锤大鼓；音效要有冲击力。音色库 `salamander`、`vsco2ce`、`vcsl` 已装在 `$LIB/core/audio/instruments`（884 MB）。`music/score.py` 缺某件乐器时会跳过并打印“跳过”，看到就说明音色库不全。钢琴是 CC BY 3.0，使用时将本期的 `music/credits.txt` 写进 `CREDITS` 和简介；用户提供的成品音乐不能沿用采样乐器的许可或署名。

## 2. 新建一期

在 Git Bash 里：

```
# BAIDONG_SKILL_ROOT 指向当前安装的完整包根目录（含本文件的上级目录）
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" <期号> <英文短名>
```

得到 `G:\vibe\baidong\ep<期号>-<短名>\`。然后：写 `lines.json` 和 `story.js` → `python G:/vibe/baidong/ep.../fonts/fetch_fonts.py` 取字体（改了台词要重跑）→ 在 WSL 里生成配音。

每期默认规划中英文横竖四版。新建脚本和模板只提供单语言横版起点，不会自动完成另外三版；在本期工程内分别维护各语言及竖屏专用稿的台词、配音、时间线、字幕和输出路径，避免覆盖中文工程。英语工程可用 `new_episode.sh <期号> <短名> <输出根目录> --language en` 单独创建。`episode.json` 的 `language` 只接受 `zh/en`，`characters.json` 的 `languages.en` 注册了八个独立英语技术默认音色；已查服务列表，尚未试听确认，不冒称用户认可。英语稿按英语观众改写；`build.sh` 将语言同时用于声音校验与 ASR。中英文不能共享配音或字幕时码；同语言同稿的横竖版可复用已核验音轨。

## 3. 项目里有什么

| 文件 | 作用 | 每期要改吗 |
|---|---|---|
| `episode.json` | 语言 `zh/en`、角色模式；新期使用 `formal`，历史双人兼容需显式设 `legacy` | 创建时选语言 |
| `lines.json` | 台词：`id`、`who`（新期使用 `A1`–`D2`；旧期兼容 `LAOBAI`/`XIAOWEN`）、`text`（字幕）、`say`（实际读的文字，数字写汉字）、`asr`（复核时期望听到的文字）、`voice`、`rate`、`pitch` | 改 |
| `story.js` | 期号、本期问题、评论区问题、下期预告、封面设置、**BEATS 时间线顺序** | 改 |
| `main.js` | 镜头 `SH.<镜头名>`；新期用 `character('A1', ROLE('A1', t, ...))`，`LB()`/`XW()` 只保留旧期兼容 | 改镜头部分 |
| `worlds.js` | 场景：`studio`（默认）、`office`、`street`、`home`、`night`、说明牌 `board()` | 需要新场景时加；场景用色按本期色彩方案调整 |
| `chars.js` | A1–D2 的 `character()`、`FORMAL_POSES`，以及旧版老白/小问和临时人物 `extra()` | 一般不改 |
| `characters.js` / `characters.json` | 八位正式人物的姓名、造型、性格、说话方式、固定 TTS 音色和校验数据 | 角色调整时同步改 |
| `brand.js` | 镜头 `cam()`、白洞转场、场景标签、按角色注册表显示字幕姓名、片头、片尾 | 一般不改 |
| `timeline.js` | 按 BEATS 和配音时长自动排时间线 | 不改 |
| `cover.js` | 封面；旧版切片底图仅兼容 | 按 `covers.md` 在本期工程实现风格、场景和四尺寸构图；不改声音与角色身份 |
| `check-characters.py` `voice.py` `mix.py` `music/score.py` `srt.mjs` `build.sh` | 角色校验、按人物处理配音、混音、配乐、字幕、一键构建 | 一般不改；新音效加在 `mix.py` 的 `FX` 里 |
| `TREATMENT.md` `FACTS.md` `CREDITS` | 本期的分析和脚本、事实表、素材许可 | 写 |

角色的完整用法见 `references/characters.md`；本机展示板路径仅供参考，迁移后只复用随包的 `assets/episode-template/chars.js` 和 `characters.js`，不复制预览目录的独立视频代码。

## 4. 配音

```
cd $LIB
LANGUAGE=$(.venv/bin/python <项目>/check-characters.py --language)              # 校验 ID/角色/固定音色，并读取语言
.venv/bin/python core/tts/tts_zh.py <项目>/lines.json <项目>/voices/raw     # edge-tts，需联网
.venv/bin/python <项目>/voice.py                                             # 按角色处理 + 口型
HF_ENDPOINT=https://hf-mirror.com .venv/bin/python core/tts/asr_check.py <项目>/lines.json <项目>/voices --lang "$LANGUAGE"
```

- 中文固定参数来自 `characters.json/formal`，英文来自 `languages.en`。逐句严格校验 `voice/rate/pitch`，台词 ID 必须唯一，重播也要另起 ID。历史双人只在 `episode.json` 显式设 `character_mode: "legacy"` 时启用，仍校验固定声音；既有历史工程不自动改写。
- 复核不通过时先判断：**同音字**（感灯/敢登、他/它、事/是）说明发音没问题，把模型听到的写进 `asr` 字段；**不是同音字**（头版 → 头吧）说明这个词在这个音色下容易听糊，观众也会听不清，改写台词。
- `build.sh` 里的复核不通过时会停下来（这是有意的）。处理完 `lines.json` 后用 `sh build.sh from=asr` 从复核这一步接着跑；只改了 `asr` 字段时不需要重新生成配音。
- 生成后看 `voices/dur.json` 的配音时长，再加上必要的表演停顿、片头片尾和转场。按本期内容预算检查，不用固定的“配音时长加八秒”估算，也不加快语速来掩盖内容过量。


### 谁说话谁出镜

生成真实配音和口型数据后执行 `LIB="$LIB" node <项目>/check-cast.mjs`。校验逐帧调用实际 `window.render(t)`，读取真实绘制角色及头部是否进入画面；覆盖整句发声区间、切镜前后和转场边界，不能仅检查中点或手写 cast 声明。`build.sh` 在渲染前强制执行，`from=video` 也会检查；发声期间角色不在镜内或被转场遮挡即失败。

无音频时只能用 `--preview` 做估算时长的案头接线检查；它明确不算成片验收。画面覆盖、遮挡、对嘴和口音仍需带声人工复核。自建竖版需维持同样的实际绘制记录，并运行 `check-cast.mjs --q mode=portrait --size 1080x1920`，不能用横版报告替代。模板未接竖屏时会明确报错，不静默退回横版。

## 5. 时间线（story.js）

不用手算秒数。`BEATS` 按顺序写，`timeline.js` 会按真实配音时长排出每句的开始时间、每个镜头的长度、字幕、音乐段落和章节点：

```js
export const BEATS = [
  { shot: 'hook', world: 'night', seg: 's1', segTitle: '明明很困，为什么不想睡', cue: 'tension', tag: '凌晨两点 · 卧室' },
  { line: 'x1' },
  { opener: 2.0, fx: 'opener' },                       // 片头放在钩子之后
  { shot: 'two', world: 'studio', seg: 's2', segTitle: '……', cue: 'theme' },
  { line: 'l1' }, { line: 'x2' },
  { wipe: true, shot: 'ex1', world: 'office', seg: 's4', segTitle: '……', cue: 'think', tag: '下午三点 · 工位' },
  { line: 'l2', gap: -.15 },                           // 负的 gap：下一句抢话
  { shot: 'aha', cue: 'resolve', mark: 'aha' }, { line: 'x3' },
  …
  { end: 4.0, fx: 'end' },
];
```

键的含义写在 `timeline.js` 顶部。要点：
- 根据内容推进安排镜头变化。同场景的线索、反应和机制过程可用硬切、视线或物件承接；跨地点或明显切换模拟时，可用 `wipe: true`。先按 `visual.md` 写清上一镜与下一镜的联系，不为凑频率插转场。圆环遮罩、场景切点与音效共用时间线；新场景应在遮罩覆盖时切入，下一句在遮罩退出后开始。
- 六段都要标 `seg`，`segTitle` 写成具体内容（会变成 B 站和 YouTube 的章节名），不要写“机制”这种空话。
- 音乐段落名：`theme` `think` `tension` `resolve` `silence` `end`。按情绪和动作选择；`silence` 可用于被问住、揭示或关键反应，不按段落编号禁止留白。保持用户选定 BGM 的可听度，短暂静音由剧情需要决定。
- **对白与表演共同排节奏**：默认句间隔仍为 0.08 秒；负的 `gap` 可用于抢话，但关键定义和因果不能被盖住。用 `pause` 留出看、试、犹豫和反应的时间，不设统一半秒上限；短反应可先试约 0.3–1.2 秒，更长时需有可读的表演或转折，并按带声播放结果调整。
- 镜头里需要对准某个时刻的动作，用 `mark` 记下来，镜头里读 `T.名字`。

## 6. 镜头（main.js）

每个镜头是一个函数 `SH.名字 = (t, tq) => { cam(...); world(...); 角色... }`：

```js
SH.two = (t, tq) => {
  cam(960, 560, lerp(1.0, 1.05, ss(seg(t, T.opener + 2, T.opener + 8))));   // 慢推
  world('studio', t);
  drawRole('A2', t, { x: 690, face: 1, ...FORMAL_POSES.A2.point });
  drawRole('B1', t, { x: 1230, face: -1, ...FORMAL_POSES.B1.explain });
};
```

- **镜头**：`cam(cx, cy, z)` 把世界坐标放到画面中心。正式角色近景按本人的实际脸部位置取景：站姿头中心约为 `y - bodyH*s - 100*s`；坐姿、侧面和低头需用本期样帧复核。不要套老白/小问的旧脸高，也不要把脸挤进字幕区。
- **角色**：正式镜头用 `drawRole(id,t,{...FORMAL_POSES[id].explain})` 或 `character(id, ROLE(id,t,...))`，口型按该 ID 的配音驱动。位置、朝向、表情和手势按本期分镜安排；`LB/XW` 仅历史兼容，不把新的八个人物改叫老白/小问。
- **动作要有过程**：举手、跳起来这类动作，用 `seg(tq, 开始, 结束)` 插值，不要在某一帧突然切换姿势。
- **反应镜头**：荒诞揭示、关键反驳或发现之后，切真正受到影响的人；老白和小问都可成为反应主体。用视线、眉毛、嘴型和手势呈现变化，允许必要停顿，不能只给口型和缩放。
- **机制画面**：先按 `visual.md` 明确人物操作、可见结果和比较关系；科幻装置、分屏模拟或物件特写按题目选。`Wd.board(x, y, w, h, [行...], { title })` 仅保留必要关键词和对比，不能用两人站着读说明牌代替整期情节。
- **场景配色**：每个主要世界使用 3–5 色，至少两种彩色有明显色相和明度差；主角继续黑白灰，老白的克莱因蓝围巾作为识别点。蓝色和其他鲜艳色可以出现在场景、说明牌和道具里，不必每帧只留一处颜色。注意字幕对比度；只有当蓝色场景元素与围巾挤在一起、削弱轮廓时，才把围巾临时改黑（`scarf: INK`）。
- **字幕安全区**：画面下方约 170 像素是字幕带，人物的脸不要进去。

## 7. 自查与渲染

默认四版分别执行本节检查，不能用中文横版成功代替其他三版的验收。中英文竖屏均不由模板 `build.sh` 自动生成，按 `vertical.md` 为本期接入原生 9:16 绘制分支、单独渲染和验收；不要把 `clip.sh` 的横版小窗包装当成完整竖屏。横版和竖版共用同语言的对白/音轨时，不改横版画面和成片。

进入制作后，先按 `visual.md` 用真实绘制代码检查两张本期样帧：人物冲突或反应、机制解释。已有角色转面图可复用；关键动作连续帧检查姿态过渡、视线、持物跟手及遮挡。

1. 每 2 秒截一帧拼总览图：
   ```
   cd $LIB && node core/render/still.mjs <项目> --range 0:<时长>:2 --size 1920x1080 --out <项目>/out/review
   .venv/bin/python core/render/sheet.py <项目>/out/sheet.jpg <项目>/out/review/t_*.jpg --cols 10 --w 192
   ```
   用 Read 看总览图。检查：人物被切、字幕压脸、转场时字幕没清、空镜头、场景是否有主色和对比色、相邻世界是否色相重复、颜色是否抢走字幕和事实重点。关键动作再按 0.2 秒截几帧看；随后带声音播放，确认反应留白、音乐变化和解释的因果能一起读懂。
2. 修完后整片构建（后台运行，约 2–5 分钟）：`sh <项目>/build.sh`。只改了镜头时可以从中间开始：`sh build.sh from=events`（跳过配音）或 `from=video`（只重新渲染和合成）。
3. 最后检查：
   - 响度：`mux.sh` 会打印，目标 −14 LUFS。
   - 黑帧：`ffmpeg -i <成片> -vf blackdetect=d=0.08:pix_th=0.06 -an -f null - 2>&1 | grep black_start`。逐段核对报告，非预期黑帧应为 0；白洞圆环覆盖全屏的短暂深色帧要与实际转场时码、连续帧对应，不能把渲染丢帧或黑屏停顿当成转场放过。
   - 对白：用 faster-whisper 听写成片音轨，和台词比对，相似度应在 95% 以上（差异只允许是同音字）。
   - 混音电平：`mix.py` 每10秒打印一行。默认沿用用户认可的ep08音乐增益+9dB；按源音量与对白清晰度检查，不把固定的人声音乐差值当成每期标准。`music/selection.json` 可切换音源和增益；关键定义对白在 `lines.json` 标 `music_key: true` 时轻降3dB，最终检查成片混音听写。
4. 更新 `CREDITS`（如有新素材）。

## 8. 已知的坑

| 现象 | 原因和办法 |
|---|---|
| `wsl.exe` 里的变量是空的 | `wsl.exe` 提前展开了 `$`。写成脚本文件再运行 |
| WSL 里域名解析失败 | 路由器 DNS 不可用。`/etc/wsl.conf` 已设 `generateResolvConf=false`，`/etc/resolv.conf` 用 223.5.5.5 和 8.8.8.8 |
| `mux.sh` 报“只能解码 0 秒” | 用了 Ubuntu 自带的 FFmpeg 6.1。确认 `which ffmpeg` 是 `/usr/local/bin/ffmpeg`（8.1） |
| 成片在手机或 Windows 上打不开 | 没做最后一步转码。`build.sh` 的 `final` 步骤会转成 yuv420p + faststart |
| 某个字显示成别的字体 | 改了文字没重跑 `fonts/fetch_fonts.py` |
| 配音某个词总被听错 | 换说法（“头版” → “上了报纸”，“人越壮” → “人越强壮”） |
| 模型下载失败 | Hugging Face 被墙，加 `HF_ENDPOINT=https://hf-mirror.com` |
| Docker 容器停了 | `wsl --shutdown` 会停掉 Docker。不要随便关 WSL；必须关时先让 Docker Desktop 正常退出，并征得用户同意 |

## 模板维护回归

修角色、配音接线或创建入口后，先运行 `python scripts/test_template.py`；在实际制作使用的 Linux/WSL 中运行会额外检查构建语言转发。`LIB=... node scripts/test_characters.mjs <QA目录>` 检查八人转面/坐姿、默认造型像素保持，以及错人出镜与转场边界的失败样例。浏览器模板回归使用估算时长，不代替本期真实配音、ASR、混音和整片播放验收。

导出包使用 `scripts/package_skill.py`，输出到源 Skill 之外的新路径，再对 ZIP 与解压目录运行 `scripts/verify_package.py`。清单不包含自身；复用随包参考工程再次导出时，不重复注入导入语句或冒用父目录 Git 提交。
