# 白洞 · 制作

## 目录
1. 环境与命令的写法
2. 新建一期
3. 项目里有什么
4. 配音
5. 时间线（story.js）
6. 镜头（scenes.js / portrait.js；风格、表演和机制画面见 visual.md）
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
- `fonts/fetch_fonts.py` 会将长稿字符拆成有界请求，输出多个带 `unicode-range` 的本地子集。不要假设每种字体只有一个文件，也不要手写覆盖指纹；修改台词或画面文字后重新运行。
- 长任务（逐帧渲染、配乐）尽量在前台一次跑完（超时设到 10 分钟）。必须放后台时，同一回合里接着做别的事，不要留下只写“等通知”的空回合。
- 选配乐前读 `G:\vibe\baidong\music-library\catalog.json`，查用户偏好、音源路径和检查记录。按 2026-10-27 用户最新要求，后续优先尝试用户提供的《Vibe知识大赏_最火的那首BGM》视频中的音乐；《We Never — Hi Noise》保留备选，结合主题情绪和对白节奏选择，不强制每期同曲。使用前试听所选片段是否有人声干扰，配乐在对白下压低；曲名与作者以核实结果为准，在 `CREDITS` 和发布物料中如实记录来源。
- 需要另行制作配乐时，可沿用此前确认的真实乐器采样方向：112 拍、轻快有推进感，拨弦弦乐律动 + 马林巴 + 拍手沙锤大鼓；音效要有冲击力。音色库 `salamander`、`vsco2ce`、`vcsl` 已装在 `$LIB/core/audio/instruments`（884 MB）。`music/score.py` 缺某件乐器时会跳过并打印“跳过”，看到就说明音色库不全。钢琴是 CC BY 3.0，使用时将本期的 `music/credits.txt` 写进 `CREDITS` 和简介；用户提供的成品音乐不能沿用采样乐器的许可或署名。

## 2. 新建一期

### 单期目录、命名与工程保存（铁律）

用户于2026-11-02明确要求正式生成的每期文件沿用以往组织方式。四版参照本机 `G:\vibe\baidong\ep13-profit-guilt\`；新期内容与画面按当前 `content.md`、`visual.md` 直接讲解。随包《沉没成本》只参考画法、声音与技术，不延续剧情，不回退后来确认的八人角色。

本机正式项目根固定为 `G:\vibe\baidong`。一期一个目录 `ep<期号>-<短名>`，期号来自用户或已核实的工作台记录；尚未分配时使用该根下的 `<短名>` 并标注未分配，不能凭目录最大编号推断下一期。跨机器迁移时替换根路径，组织方式保持。工作台 `pending` 可保留选题记录，但不作为正式工程或成片的唯一存放位置。

以本期目录名为 `epNN-topic` 示意，正式交付结构沿用既有四版工程：

```text
G:/vibe/baidong/epNN-topic/
  epNN-topic.mp4                  中文横版
  epNN-topic.srt
  epNN-topic-vertical.mp4         中文竖版
  epNN-topic-vertical.srt
  epNN-topic-en.mp4               英文横版
  epNN-topic-en.srt
  epNN-topic-en-vertical.mp4      英文竖版
  epNN-topic-en-vertical.srt
  cover-zh-{16x9,4x3,3x4,9x16}.jpg
  cover-en-{16x9,4x3,3x4,9x16}.jpg
  variants.json                  各版真实工程、输出与状态的索引
  variants/
    zh-film/                     中文横版真实源码与素材
    zh-portrait/                 中文竖版真实源码与素材
    en-film/                     英文横版真实源码与素材
    en-portrait/                 英文竖版真实源码与素材
  tools/                         本期构建、检查与整理入口
  out/                           整期检查与中间产物
  SCRIPT.md                      汇总脚本，注明各版真实台词源
  TREATMENT.md
  FACTS.md
  CREDITS
  publish.md
  DELIVERY.md
  qa.json
```

未分配期号时，用真实单期目录名替换上述 `epNN-topic`，不把 `NN` 留在成品文件名。单语言或单画幅只在用户明确缩小范围时省略；额外切片沿用 `clip-1.mp4` / `clip-1.srt`，不替代四版。

各版 `lines.json`、`story.js`、镜头源码、`voices/`、`fonts/`、`music/`、`out/` 及实际使用的配置均保留在对应工程内；共享资产保留真实位置和引用。根目录摘要不能冒充各版真实台词源，不为凑目录放置未使用的源码或配置。`tools/` 记录可执行的现有构建入口、工作目录及版本对应关系；复用固定模板和 Lemo 构建链，不恢复历史工程的旧角色或替换渲染引擎。

当前模板的 `build.sh` 按内层工程目录名输出视频；根目录按上表保存对应正式视频、字幕与封面，并核对内容指纹、语言、画幅和真实时长一致。生成器输出与根目录交付名之间的映射记录在 `variants.json`、`DELIVERY.md` 和实际检查记录内。不能只改文件名把 preview 冒充 final，也不能为改交付名重写固定 `build.sh`。

后续修订在同一单期目录内进行，旧输出按需在 `out/` 留档；迁移已有工程前先检查路径配置、素材引用和校验记录，保留原件与恢复点，不覆盖用户旧文件。不得把 `production/<日期或轮次>/` 多套工程作为新的默认组织方式。正式交付给用户的是单期目录和可直接打开的 MP4；网页仅作辅助，不能替代文件。

### 模板创建入口

先确认本期根目录，将它的绝对路径记为 `EPISODE_ROOT`；在 WSL / Git Bash 中使用相应系统路径。默认四版由同一个模板入口建立在该目录内：

```sh
# BAIDONG_SKILL_ROOT 指向当前安装的完整包根目录（含本文件的上级目录）
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local zh-film "$EPISODE_ROOT/variants" --language zh --aspect landscape
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local zh-portrait "$EPISODE_ROOT/variants" --language zh --aspect portrait
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local en-film "$EPISODE_ROOT/variants" --language en --aspect landscape
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local en-portrait "$EPISODE_ROOT/variants" --language en --aspect portrait
```

上述命令仅用于尚不存在的各版目录，脚本拒绝覆盖；已有工程在原处修改，不重复初始化。模板旧双人对白仅用于技术冒烟，不是新期内容示范。分别用本期主讲稿与解释画面替换各版 `lines.json`、`story.js` 和镜头代码，运行各版 `fonts/fetch_fonts.py` 取字体（改了台词要重跑），再在 WSL 里生成配音。

每期默认规划中英文横竖四版。新建脚本支持 `--language zh|en --aspect landscape|portrait --stage preview|final`；各版本仍需独立稿件和验收，不能把四次运行同一稿称为四版内容完成。四版放在同一单期根目录下的 `variants/`，不要分别创建四个对外的单期根目录。脚本第三个参数是输出父目录：例如 `sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local zh-film "$EPISODE_ROOT/variants" --language zh --aspect landscape` 会建立 `variants/zh-film/`；其中 `EPISODE_ROOT` 是已核实的本期绝对目录，`local` 用于保持内层目录名，`story.js` 的 `NO` 则按本期已核实期号填写，未分配仍为 null。其余三版依次使用 `zh-portrait`、`en-film`、`en-portrait` 以及对应语言、画幅参数。在各版内分别维护稿件、配音、时间线、字幕和输出路径，避免覆盖中文工程。`episode.json` 的 `language` 只接受 `zh/en`；英文声音按当前注册表及 `voice-reference.json` 的实际状态核验，不把技术默认映射当作用户认可。英语稿按英语观众改写；`build.sh` 将语言同时用于声音校验与 ASR。中英文不能共享配音或字幕时码；同语言同稿的横竖版可复用已核验音轨。

## 3. 项目里有什么

| 文件 | 作用 | 每期要改吗 |
|---|---|---|
| `episode.json` | 语言 `zh/en`、角色模式；新期使用 `formal`，历史双人兼容需显式设 `legacy` | 创建时选语言 |
| `lines.json` | 台词：`id`、`who`（新期使用 `A1`–`D2`；旧期兼容 `LAOBAI`/`XIAOWEN`）、`text`（字幕）、`say`（实际读的文字，数字写汉字）、`asr`（复核时期望听到的文字）、`voice`、`rate`、`pitch` | 改 |
| `story.js` | 期号、本期问题、评论区问题、下期预告、封面设置、**BEATS 时间线顺序** | 改 |
| `main.js` / `brand.js` | 固定渲染壳、口型、原字幕、片头片尾、转场 | 不在单期改写 |
| `scenes.js` / `portrait.js` | 本期横版/原生竖版镜头，使用注入的 drawRole/cam/world | 按分镜编辑 |
| `worlds.js` | 场景：`studio`（默认）、`office`、`street`、`home`、`night`、说明牌 `board()` | 需要新场景时加；场景用色按本期色彩方案调整 |
| `chars.js` | A1–D2 的 `character()`、`FORMAL_POSES`，以及旧版老白/小问和临时人物 `extra()` | 一般不改 |
| `characters.js` / `characters.json` | 八位正式人物的姓名、造型、性格、说话方式、固定 TTS 音色和校验数据 | 只在明确角色维护任务中修改，并对照冻结确认稿 |
| `brand.js` | 镜头 `cam()`、白洞转场、场景标签、按角色注册表显示字幕姓名、片头、片尾 | 一般不改 |
| `timeline.js` | 按 BEATS 和配音时长自动排时间线 | 不改 |
| `cover.js` | 封面；旧版切片底图仅兼容 | 按 `covers.md` 在本期工程实现风格、场景和四尺寸构图；不改声音与角色身份 |
| `check-characters.py` `voice.py` `mix.py` `srt.mjs` `build.sh` | 固定的角色校验、配音、混音、字幕与构建流程 | 不在单期改写；`story.js` 引用已有音效，新音效实现属于模板维护 |
| `music/score.py` `music/selection.json` | 配乐与音源选择 | 按本期配乐需求调整，不更改人物声音后处理 |
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

不用手算秒数。`BEATS` 按顺序写，`timeline.js` 会按真实配音时长排出每句的开始时间、每个镜头的长度、字幕、音乐段落和章节点。下面仅示意主讲与账目图的接线；`presenter`、`ledger` 须在本期镜头代码中实现，line ID 须对应本期 `lines.json`，不把示例当作可直接发布的稿件：

```js
export const BEATS = [
  { shot: 'presenter', world: 'studio', seg: 's1', segTitle: '营业额高，为什么仍可能亏钱', cue: 'theme' },
  { line: 'question' },                              // 主讲直接进入问题
  { shot: 'ledger', world: 'studio', seg: 's2', segTitle: '收入与成本分别算什么', cue: 'think' },
  { line: 'revenue' }, { line: 'cost' },               // 同一主讲连续解释，图表同步推进
  { shot: 'presenter', cue: 'resolve' },
  { line: 'conclusion' },
  { end: 4.0, fx: 'end' },
];
```

键的含义写在 `timeline.js` 顶部。要点：
- 根据解释推进安排镜头变化，主讲、账目、图表与资料用明确的对象或信息关系承接；明显切换内容时可用 `wipe: true`，不为凑频率插转场。圆环遮罩、场景切点与音效共用时间线；新场景应在遮罩覆盖时切入，下一句在遮罩退出后开始。不插独立开场片头，保留固定品牌片尾与渲染壳。
- 按实际章节标 `seg`，沿用当前时间线支持的标识；`segTitle` 写具体内容（会变成 B 站和 YouTube 的章节名），不强制用满六段。工作台 `s1–s6` 仅按 `distribution.md` 做存储适配，不决定讲解结构。
- 音乐段落名：`theme` `think` `tension` `resolve` `silence` `end`。按讲解与阅读需要选择，关键定义或复杂图表可短暂降配乐或留白；保持用户选定 BGM 的可听度，不为制造人物反应停顿。
- **口播与阅读共同排节奏**：默认句间隔仍为 0.08 秒，当前声画校验禁止配音重叠。主讲保持自然连续，用 `pause` 留出必要的图表阅读、数字理解和换气时间；停顿长短按带声播放结果调整，不额外演犹豫或搭档反应。
- 镜头里需要对准某个时刻的动作，用 `mark` 记下来，镜头里读 `T.名字`。

## 6. 镜头（scenes.js / portrait.js）

每个镜头是一个函数 `SH.名字 = (t, tq) => { cam(...); world(...); 角色... }`：

```js
SH.presenter = (t, tq) => {
  cam(960, 560, 1.02);
  world('studio', t);
  drawRole('B2', t, { x: 960, face: 1, ...FORMAL_POSES.B2.explain });
};
```

- **镜头**：`cam(cx, cy, z)` 把世界坐标放到画面中心。正式角色近景按本人的实际脸部位置取景：站姿头中心约为 `y - bodyH*s - 100*s`；坐姿、侧面和低头需用本期样帧复核。不要套老白/小问的旧脸高，也不要把脸挤进字幕区。
- **角色**：正式镜头用 `drawRole(id,t,{...FORMAL_POSES[id].explain})` 或 `character(id, ROLE(id,t,...))`，口型按该 ID 的配音驱动。位置、朝向、表情和手势按本期分镜安排；`LB/XW` 仅历史兼容，不把新的八个人物改叫老白/小问。
- **动作要有过程**：举手、跳起来这类动作，用 `seg(tq, 开始, 结束)` 插值，不要在某一帧突然切换姿势。
- **主讲手势**：用视线、眉毛、嘴型和简洁手势强调当前解释，不要求搭档反应或情节动作。资料占主体时保留清晰的主讲画中画，由本人音频驱动口型并通过逐帧出镜检查。
- **解释画面**：按 `visual.md` 明确资金流、账目、变化或比较关系；用数据图、资料原页和必要的产品图帮助理解。`Wd.board(x, y, w, h, [行...], { title })` 只放必要关键词和对比，不把整篇口播贴成密集文字墙，也不要求科幻装置或人物操作戏。
- **场景配色**：每个主要世界使用 3–5 色，至少两种彩色有明显色相和明度差；八位人物保持各自确认稿的服装与识别配饰。蓝色和其他鲜艳色可以出现在场景、说明牌和道具里，不必每帧只留一处颜色。注意字幕与轮廓对比；发生冲突时调整背景明暗和位置，不在单期更换正式角色配饰。
- **字幕安全区**：画面下方约 170 像素是字幕带，人物的脸不要进去。

## 7. 自查与渲染

默认四版分别执行本节检查，不能用中文横版成功代替其他三版的验收。`build.sh` 按 episode.json 的 aspect 调用已接通的原生横竖分支；按 `vertical.md` 改写本期镜头，分别构建和验收；不要把 `clip.sh` 的横版小窗包装当成完整竖屏。横版和竖版共用同语言的对白/音轨时，不改横版画面和成片。

进入制作后，先按 `visual.md` 用真实绘制代码检查两张本期样帧：主讲画面与关键图表或资料画面。固定确认角色稿可复用，未确认派生姿态仍按 `characters.md` 限制；手势及图表变化用连续帧检查过渡、视线、标注和遮挡。

数据类选题先读 `content.md` 第6节和 `visual.md` 的“真实资料与 B-roll”。入片前复核数据底稿、素材本地文件与 `CREDITS`；候选链接不计作已完成素材。沿用本 Skill 的模板接入资料镜头，不另换视频引擎；有人物台词的资料镜头也必须通过真实出镜检查。未选到可用真实素材时如实记录，不能声称已接入 B-roll。

1. 每 2 秒截一帧拼总览图：
   ```
   cd $LIB && node core/render/still.mjs <项目> --range 0:<时长>:2 --size 1920x1080 --out <项目>/out/review
   .venv/bin/python core/render/sheet.py <项目>/out/sheet.jpg <项目>/out/review/t_*.jpg --cols 10 --w 192
   ```
   用图像工具看总览图。检查：人物被切、字幕压脸、转场时字幕没清、空镜头、图表与资料可读性、场景是否有主色和对比色、相邻世界是否色相重复、颜色是否抢走字幕和事实重点。关键手势与图表变化再按 0.2 秒截几帧看；随后带声音播放，确认阅读停顿、音乐与解释能一起读懂，字幕始终单行、按语义分屏。
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

修角色、配音接线或创建入口后，运行 `python -B scripts/test_template.py` 和 `python -B scripts/test_production.py`；在实际制作使用的 Linux/WSL 中运行会额外检查构建语言转发。`LIB=... node scripts/test_characters.mjs <QA目录>` 检查八人转面/坐姿、与独立确认稿的默认造型像素一致，以及错人出镜与转场边界的失败样例。浏览器模板回归使用估算时长，不代替本期真实配音、ASR、混音和整片播放验收。

导出包使用 `scripts/package_skill.py`，输出到源 Skill 之外的新路径，再对 ZIP 与解压目录运行 `scripts/verify_package.py`。清单不包含自身；复用随包参考工程再次导出时，不重复注入导入语句或冒用父目录 Git 提交。

## 制作约束与声音准入

`check-production.py` 在构建前检查固定文件指纹，在渲染前核对每条配音的台词/角色/参数/后处理指纹、WAV 指纹、真实时长、口型、字体文件和同版本 ASR 成功记录。修改台词或音色后不能从 events/video 阶段复用旧音频。

工程记录的源 Skill 路径失效时立即停止，不回退为本期自行核验。恢复 `.baidong.json` 对应安装路径，或从当前安装的新版本新建工程；不要重建本期约束文件。`from=mux/final` 还会校验本期字幕、镜头、字体和声音时码的画面指纹，变更后必须重渲染。

新建无编号项目用 `scripts/new_episode.sh local <短名> <输出根目录> --language zh --aspect portrait`；不得自写复制脚本绕过固定包装。主程序只调用本期 scenes.js/portrait.js，不在单期改 main.js、brand.js、chars.js、formal-art.js、voice.py 或 production-contract.json。

默认 preview 有“测试样片｜声音待确认”标记，输出 preview- 前缀。用户明确要求移除画面标记时，可在 `episode.json` 设置 `"preview_watermark": false`；仍保留 preview 状态、文件名前缀和交付说明，不能因此认可声音或转 final。此选项只控制水印绘制，不影响人物、音色和构建校验。已有工程使用该选项前须同步经过验证的模板版本，不在单期修改固定文件或重建约束。正式声音记录见 characters.md；未明确认可的音色不能转 final。构建完成只表示媒体生成，仍需本期画面、混音、字幕、黑帧和播放验收。
