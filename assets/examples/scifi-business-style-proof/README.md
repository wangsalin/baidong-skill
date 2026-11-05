# Sci-Fi Sitcom Toon · 商业问答修订样段

2026-11-05，取《低价团购》的四句原配音制作约17.6秒风格样段。A2跳跳提问，C1流程哥回答，未新增TTS。此处只验空间、动作和镜头，不是该题完整解释，也不是最终声音审批。

- preview-landscape.mp4 / preview-portrait.mp4：1920×1080 / 1080×1920，24fps，原生横竖构图；同一配音与混音。
- comparison.jpg：原版、该题旧画面、本段修正后；contact-*.jpg：实际最终视频抽帧。
- scenes.js / portrait.js / story.js / lines.json / captions.js / caption-times.js：本段可编辑内容源码，按新模板接口接线的参考，不是独立可重建工程。未附逐句音频、口型元数据与字库，不能直接运行这些片段冒充完整项目。

先用 new_episode.py 新建工程，再按本期需要设计镜头；不要将本段柜台、配色、角色站位或这四句照抄成下一期模板。重点是同空间的双人关系、人物近景、看账指账、同一账单的特写、按台词更新金额与收势。present 只在已建立声音身份的物件镜头声明。

本段全为自制矢量画面，教学假设明确标识；不将其充当新增真实B-roll。原版视频仅用于研究画面语法，对照中两张缩略图取自上游官方 Sci-Fi Sitcom Toon / Coffee Run 示例，完整源与MIT许可见 assets/lemo-runtime/LICENSE；上游 https://github.com/lemomo-ai/lemo-opuscar 。没有把原片配音或素材嵌入白洞样段。

配乐：Cold Funk — Kevin MacLeod (incompetech.com)。CC BY 4.0，https://creativecommons.org/licenses/by/4.0/ ，源 https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100499 。从16秒选取，原速原调，淡入淡出和对白压低；实际来源指纹在制作工程 music/source.json，库音源见 assets/music/catalog.json。

已验证：媒体解码、黑帧、响度/峰值、源WAV复用、八人默认身份一致、逐帧声音归属、字幕单行和时码；已检查最终视频总览、关键原图与约0.2秒动作连续帧。尚未真人带声试听，未验证平台流量。不把技术校验等同风格已获用户认可。
