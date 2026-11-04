# 白洞配乐库

2026-11-04 用户要求增加配乐，原有曲目已不好听。本轮新增六首完整原音，提供纯音乐、相同双角色问答及组合试听；旧两首保留历史。Cold Funk 只是暂用推荐，六首均尚待用户试听选择。

试听入口：[六首对比](previews/20261104/index.html)。每段组合试听先8秒音乐，再接22.446秒“有戏问、小算盘答”；也可分别播放25秒纯音乐和22秒问答。

| track_id | 曲目 | 风格与试配方向 |
| --- | --- | --- |
| kevin-macleod-cold-funk | Cold Funk | 轻放克；商业案例、赚钱逻辑，优先试配 |
| kevin-macleod-cipher | Cipher | 电子律动；平台生意、科技商业 |
| kevin-macleod-space-jazz | Space Jazz | 太空爵士；日常经济、商业常识，优先试配 |
| kevin-macleod-mining-by-moonlight | Mining by Moonlight | 轻快爵士；消费、算账与问答 |
| kevin-macleod-cool-vibes | Cool Vibes | 慢爵士；收入、成本与舒缓讲解 |
| kevin-macleod-district-four | District Four | 强节奏；价格战、竞争与快速推进 |

曲风和试配方向依据作者官网的乐器、描述及节拍信息整理，不代表真人听感已确认。原音未变速、变调或替换；SHA256、实际时长与解码检查见 `catalog.json`。试听的对白来自已制作蜜雪短版的逐句WAV，按原时间线重建，没有叠加含旧音乐的成片混音。技术检查见 `previews/20261104/verification.json`。

六首音乐作者均为 Kevin MacLeod，来自 [incompetech 作者官网](https://incompetech.com/music/royalty-free/music.html)，官网提供 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可。可在遵守许可的条件下商业使用；正式视频、广告及发布简介须保留曲名、作者、来源、许可链接，并注明截取、循环、淡化和混音等实际改动。逐曲可复制署名见 `CREDITS.txt` 和 `catalog.json`。两首旧用户音源不属于这次核实的CC许可范围。

`sources/` 保存作者目录中的原始曲目记录、官网许可页面及许可摘要页面快照，记录获取时间与指纹；公开可播放不等于免署名。发布使用哪一首，就附哪一首的署名和处理记录，不把整个候选目录当作实际用曲。

新期读取 Skill 内 `assets/music/catalog.json`；本机库为同步副本。设置 `music/selection.json` 的 `track_id`、`start_seconds`、`gain_db`。新模板暂用 Cold Funk / 16秒起 / -3dB；按题材轮换，不再优先旧 Vibe。正式混音按真实对白校准；本轮问答试听把有声区间音乐RMS设为比人声低16dB，纯音乐按约-20 LUFS比较。

重建这组试听（沿用本次源工程，需 numpy / scipy / soundfile 与 FFmpeg）：

```powershell
C:/Python313/python.exe -X utf8 tools/preview_candidates.py --voice-project G:/vibe/baidong/mixue-business-model/variants/zh-portrait-short-01 --skill-root G:/vibe/baidong-skill-v4-full-20261030/baidong
```

原音完整保存于本机 `audio/` 并在 Skill 的 `assets/music/audio/` 纳入版本，素材库仓库继续沿用忽略 `audio/` 的约定。Git中的目录及指纹不等于已备份媒体本体；迁移使用整个Skill目录。
