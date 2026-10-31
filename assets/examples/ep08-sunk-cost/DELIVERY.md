# 白洞08 · 沉没成本

完整内容沿用已认可对白，采用v4科幻情景喜剧卡通。主片153.250秒，切片39.458秒。

| 文件 | 内容 |
|---|---|
| ep08-sunk-cost.mp4 | 1920×1080，24fps，H.264/AAC；影院争执、选择模拟器、小吃店立场反转 |
| ep08-sunk-cost.srt | 62条对白，与画面字幕同一时间线 |
| clip-1.mp4 / clip-1.srt | 1080×1920，约39秒，排队时间的冲突与选择；19条字幕 |
| cover-16x9.jpg / cover-4x3.jpg / cover-3x4.jpg / cover-9x16.jpg | 4种比例封面；同名PNG一并保存 |
| publish.md / chapters.txt | 6平台标题与完整介绍、6章、小红书6张卡片文案、置顶评论 |
| TREATMENT.md / FACTS.md / CREDITS | 内容、事实摘录与情景边界、素材与工具署名 |
| qa.json / delivery-qa.json | 实测规格、响度、黑帧、ASR、文件指纹、字体、封面边界、播放与跳转检查 |
| review-final.jpg | 最终编码文件的12张画面抽查 |
| workbench-episode.json / workbench-sync.json | 本地候选记录；未云端同步 |

验证：主片-14.0 LUFS，真峰值-1.0 dBFS；切片-14.5 LUFS。完整解码无错误、无黑帧；整片混音听写99.12%。浏览器播放推进、跳转均通过。

限制：已检查实际样帧、连续动作与最终抽帧，未进行真人试听或真实受众测试；未向平台发布。音乐曲名与作者尚未核实，沿用用户指定音源。

制作恢复：源码已有Git本地提交。生成媒体、逐句配音及字体二进制按.gitignore保存在本地，Git不覆盖这些文件；请保留整个本期目录。重建使用WSL中的build.sh；局部重建可传from=events等参数，勿运行prepare.py重置已修正的语音断句。
