# 白洞 · 商业与经济知识解说 Skill

从真实商业案例出发，为普通观众讲清生意怎样赚钱、市场怎样运转，以及它们怎样影响消费和收入。

本仓库包含给 Agent 使用的创作规则、八位固定角色、制作脚本、配乐与参考工程。可以只做选题、脚本、封面或发布文案，也可以完成一期制作。**完整制作默认交付中英文各一支完整横版和主力短竖版，共四版**；短竖版以 45–60 秒为主，各版独立写稿与验收。

[使用规则](SKILL.md) · [安装与迁移](references/installation.md) · [制作命令](references/production.md) · [角色设定](references/characters.md)

## 从哪里开始

| 你要做什么 | 先读什么 | 是否需要制作环境 |
| --- | --- | --- |
| 选题、研究、写稿 | [账号定位](references/account.md)、[内容规则](references/content.md) | 不需要；事实核验需要来源访问能力 |
| 制作视频、修改镜头 | [安装](references/installation.md)、[制作](references/production.md)、[画面](references/visual.md)、[角色](references/characters.md) | 需要 Linux / WSL、本地命令和文件访问 |
| 制作竖版 | [原生竖版规则](references/vertical.md) | 需要，分别处理各语言的字幕与画面 |
| 设计封面 | [封面规范与样例](references/covers.md) | 生成图片时需要相应工具 |
| 准备发布物料、回写工作台 | [分发与字段约定](references/distribution.md) | 回写需要真实工作台连接 |
| 维护这个仓库 | 下方“维护与验证” | Git、Python、Node.js |

每期从 A1–D2 八人库中选择两位不同角色，一位提问、一位直接回答并连续解释；中英文版本保持人物分工一致。角色身份、造型和声音固定，场景与图解随本期内容设计。旧片的剧情和站位只作参考。

## 安装

### 1. 获取完整目录

仓库公开提供，无需 GitHub 登录即可克隆。在 Linux / WSL 终端执行，并将路径换成实际安装位置：

```sh
git clone https://github.com/wangsalin/baidong-skill.git /path/to/skills/baidong
cd /path/to/skills/baidong
python3 -B scripts/verify_package.py . --source-tree
```

仓库名是 `baidong-skill`，安装文件夹名使用 **`baidong`**，与 `SKILL.md` 中的名称一致。把完整目录放到所用 Agent 的 skill 目录；OpenClaw 使用工作区内的 `skills/baidong`。Windows 上的 Agent 可在自己的 skill 目录检出仓库，再通过 WSL 使用 `/mnt/<盘符>/...` 路径执行制作。

仅复制 `SKILL.md` 会缺少模板与资源。GitHub ZIP 下载后，把包含 `SKILL.md` 的文件夹命名为 `baidong`；未安装依赖时可用 `python3 -B scripts/verify_package.py /path/to/baidong` 检查解压目录，Git 检出目录使用 `--source-tree`。

### 2. 按需准备制作环境

只写选题或脚本时可以跳过。视频制作要求 Python 3.11–3.13、Node.js 20+、FFmpeg 8+ / ffprobe，以及浏览器所需的系统库。Windows 的完整构建使用 WSL，媒体与依赖放在容量足够的磁盘。

```sh
export BAIDONG_SKILL_ROOT="$(pwd)"
export LIB="$BAIDONG_SKILL_ROOT/assets/lemo-runtime"
sh scripts/setup.sh install
sh scripts/setup.sh check
```

`install` 会下载 npm / Python 依赖与浏览器，写入所选运行环境；不会自动安装系统软件。`check` 会实际启动浏览器并检查依赖，不生成配音或下载 ASR 模型。中文 TTS、字体和首次 ASR 模型下载仍需网络。完整说明见 [安装与迁移](references/installation.md)。

### 3. 调用 Skill

在支持 `$skill-name` 的 Agent 中，可使用：

```text
使用 $baidong 分析“低价团购为什么还能赚钱”，核实资料并写脚本，先交付脚本供我确认。
使用 $baidong 制作已确认脚本的四个版本，沿用固定角色和声音，完成封面、字幕和发布物料。
使用 $baidong 为已有一期重新设计中英文四比例封面。
```

只做某一步时按明确范围执行。已有制作授权继续推进；没有脚本确认或端到端授权时，先交付脚本。工作台未连接时保留本地文件并说明未同步。

## 新建一期工程

在 Linux / WSL 终端中，先设置实际项目路径。下面使用尚未分配期号的 `example-topic`，只创建四版工程，不生成可发布成片：

```sh
export BAIDONG_PROJECT_ROOT=/path/to/video-projects
EPISODE_ROOT="$BAIDONG_PROJECT_ROOT/example-topic"
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local zh-film "$EPISODE_ROOT/variants" --language zh --aspect landscape
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local zh-portrait "$EPISODE_ROOT/variants" --language zh --aspect portrait
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local en-film "$EPISODE_ROOT/variants" --language en --aspect landscape
sh "$BAIDONG_SKILL_ROOT/scripts/new_episode.sh" local en-portrait "$EPISODE_ROOT/variants" --language en --aspect portrait
```

脚本拒绝覆盖已有工程。用本期确认的讲稿和解释画面替换样例对白与镜头，再按 [制作第 2 节](references/production.md#2-新建一期) 完成配音、字体、构建和逐版验收。视频、同名字幕、封面及交付资料集中在本期根目录，真实源码与素材保留在 `variants/`。

模板默认是 `preview`。正式制作需要本期实际声音记录、音频指纹和检查结果；隐藏水印不会将预览变为正式版。

## 目录与参考资源

```text
SKILL.md                       Agent 入口与任务规则
agents/openai.yaml             Codex 显示名称与调用提示
references/                    定位、内容、画面、角色、制作、分发说明
scripts/                       新建、环境检查、打包、校验与离线回归
assets/episode-template/       每期工程模板与固定制作约束
assets/identity-reference/     八人冻结确认稿
assets/lemo-runtime/           随包 Lemo 轻量源码与上游许可
assets/music/                  配乐、署名、来源与试听
assets/examples/               历史参考片、封面与横竖样段
PACKAGE-MANIFEST.json          文件大小与 SHA-256 清单
.github/workflows/verify.yml   GitHub 自动校验
```

- [八位角色确认稿](assets/identity-reference/identity-lineup.png)：核对姓名、造型与识别配饰。
- [商业问答横竖样段](assets/examples/scifi-business-style-proof/README.md)：参考镜头、动作与特写衔接；这些源码片段不是独立完整工程。
- [《沉没成本》参考工程](assets/examples/ep08-sunk-cost/REFERENCE.md)：含原片与重建说明；原检查报告属于历史记录。
- [配乐与试听](assets/music/README.md)：选曲、来源、指纹和署名入口；历史用户音轨的许可状态与六首新增配乐分别记录。

## 维护与验证

在仓库根目录执行。以下回归只需要 Python 标准库与 Node.js，不安装制作依赖、不调用 TTS，也不下载模型：

```sh
python3 -B scripts/test_manifest.py
python3 -B scripts/test_template.py
python3 -B scripts/test_production.py
python3 -B scripts/test_fonts.py
```

Linux / WSL 会执行构建语言转发测试；Windows 原生会明确跳过这一项。离线测试通过只证明对应行为正确，不能替代浏览器、配音、混音和成片检查。

修改文件后，先检查 `git status` 与差异，再刷新分发清单并校验：

```sh
python3 -B scripts/update_manifest.py
python3 -B scripts/verify_package.py . --source-tree
git diff --check
```

更新脚本包含 Git 跟踪及未忽略的新文件；提交前先处理无关临时文件。它仅更新 `PACKAGE-MANIFEST.json`，不修改人物确认稿或固定制作约束。`skill_commit`、`skill_dirty` 记录刷新时的源状态，并不声称等于随后产生的提交；参考工程来源提交单独保留。

需要修改角色或渲染链时，另按 [角色规范](references/characters.md) 在已安装的制作环境运行 `test_identity.mjs`、`test_characters.mjs` 并检查带声画面。完整 ZIP 仍用 `scripts/package_skill.py --help` 所列入口打包，打包会重新生成分发清单。

GitHub Actions 在推送、拉取请求或手动触发时，检查文件指纹、Shell 语法和上述离线回归；不会调用付费服务或向视频平台发布。

## 来源与使用范围

各类内容按各自来源和许可使用。随包 Lemo 代码保留 [MIT 许可](assets/lemo-runtime/LICENSE)，字体和音乐沿用各自文件中的许可、来源与署名。本仓库尚未为全部原创角色、音频和参考片指定统一的开源许可。

正式发布前按 [分发规则](references/distribution.md) 核对实际用曲和资料的使用条件与署名。工作台连接、平台发布、真人试听及流量表现需分别记录真实状态。
