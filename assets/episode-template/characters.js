// 白洞正式角色注册表：A1–D2 是生产中的唯一新角色 ID。
// 视觉代码、字幕、配音校验都从这里读取同一组 ID；视频形式不得重新映射人物。
export const CHARACTER_IDS = Object.freeze(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2']);

export const CHARACTERS = Object.freeze({
  A1: {
    code: 'A1', name: '阿津', group: '街头快嘴', title: '慢刀子老江湖',
    personality: '沉稳慢热，讲理但不端着；先听完，再拆话里的漏洞。',
    speech: '天津话目标方向；慢半拍，句中留停顿，最后落一句。',
    visual: { variant: 'tall', accessory: 'long-scarf', accent: '#002FA7', coat: '#2A2A2A', shade: '#161616' },
    voice: { provider: 'edge-tts', id: 'zh-CN-YunyangNeural', target: '天津话｜相声演员', status: 'Edge 普通话替代音色；天津话音色待外部供应商接入', rate: '-6%', pitch: '-4Hz', treatment: 'low-sat' },
  },
  A2: {
    code: 'A2', name: '跳跳', group: '街头快嘴', title: '快嘴接梗王',
    personality: '反应快、好奇心旺；从小细节跳到关键问题，顺手补刀。',
    speech: '四川方向；连珠炮起步，想到重点突然刹车。',
    visual: { variant: 'slim', accessory: 'hair-clip', accent: '#4D7CFE', coat: '#FFFFFF', shade: '#DCD8D2' },
    voice: { provider: 'edge-tts', id: 'zh-CN-XiaoyiNeural', target: '四川方向｜明亮女声', status: '固定生产音色', rate: '+12%', pitch: '+5Hz', treatment: 'bright' },
  },
  B1: {
    code: 'B1', name: '丁叔', group: '市井搭档', title: '热心操心邻居',
    personality: '热心仗义，爱操心，嘴硬心软；先帮人把事办了，再念叨两句。',
    speech: '东北方向；像拉家常，句子饱满，越说越来劲。',
    visual: { variant: 'broad', accessory: 'check-neckerchief', accent: '#C7553C', coat: '#F2F0EB', shade: '#C7C1B6' },
    voice: { provider: 'edge-tts', id: 'zh-CN-YunxiaNeural', target: '东北方向｜温厚男声', status: '固定生产音色', rate: '+2%', pitch: '+1Hz', treatment: 'warm' },
  },
  B2: {
    code: 'B2', name: '小算盘', group: '市井搭档', title: '生活算账派',
    personality: '务实细致，账目清楚，不爱吃暗亏；专挑被忽略的成本。',
    speech: '上海方向；先问细节，停半拍，再给结论。',
    visual: { variant: 'broad', accessory: 'blue-cuff', accent: '#2D6DB5', coat: '#F7F7F7', shade: '#C7C7C7' },
    voice: { provider: 'edge-tts', id: 'zh-CN-XiaoxiaoNeural', target: '上海方向｜清亮女声', status: '固定生产音色', rate: '-2%', pitch: '+0Hz', treatment: 'dry' },
  },
  C1: {
    code: 'C1', name: '流程哥', group: '都市打工人', title: '认真流程侦探',
    personality: '谨慎专业，流程脑，但心里有人；看出制度和生活的错位。',
    speech: '陕西方向；把事实讲清楚，结尾轻轻冷一下。',
    visual: { variant: 'long', accessory: 'headphones', accent: '#12AEB5', coat: '#2A2A2A', shade: '#161616' },
    voice: { provider: 'edge-tts', id: 'zh-CN-YunjianNeural', target: '陕西方向｜沉稳男声', status: '固定生产音色', rate: '-4%', pitch: '-2Hz', treatment: 'low-sat' },
  },
  C2: {
    code: 'C2', name: '小账本', group: '都市打工人', title: '冷面记录员',
    personality: '观察细、话不多，记性好，也不忘账；让事实自己变得好笑。',
    speech: '粤语方向；短句、少起伏，最后一句不抬音量。',
    visual: { variant: 'long', accessory: 'badge-bag', accent: '#D66B4F', coat: '#F7F7F7', shade: '#C9C9C9' },
    voice: { provider: 'edge-tts', id: 'zh-HK-WanLungNeural', target: '粤语方向｜克制男声', status: '固定生产音色', rate: '-7%', pitch: '-2Hz', treatment: 'dry' },
  },
  D1: {
    code: 'D1', name: '有戏', group: '几何怪咖', title: '脑补戏精派',
    personality: '想象力过剩，爱把小事演成大戏；铺垫半天，包袱突然落地。',
    speech: '河南方向；情绪起伏大，先演一步再落包袱。',
    visual: { variant: 'angular', accessory: 'triangle-scarf', accent: '#F5C842', coat: '#F2F2F2', shade: '#AAAAAA' },
    voice: { provider: 'edge-tts', id: 'zh-CN-YunxiNeural', target: '河南方向｜夸张男声', status: '固定生产音色', rate: '+10%', pitch: '+6Hz', treatment: 'bright' },
  },
  D2: {
    code: 'D2', name: '反问姐', group: '几何怪咖', title: '浪漫拆台家',
    personality: '愿意相信好想法，也会追问谁来收尾；先给理想留面子，再戳中难题。',
    speech: '北京方向；语气温和，末尾用一句反问收住。',
    visual: { variant: 'diamond', accessory: 'geo-brooch', accent: '#8A5AE6', coat: '#FFFFFF', shade: '#B9B9B9' },
    voice: { provider: 'edge-tts', id: 'zh-CN-liaoning-XiaobeiNeural', target: '北京方向｜清醒女声', status: '固定生产音色', rate: '+0%', pitch: '+2Hz', treatment: 'clear' },
  },
});

// 旧期工程仍使用这两个岗位名；它们只为兼容旧项目，不属于新的八人角色库。
export const LEGACY_CHARACTERS = Object.freeze({
  LAOBAI: { code: 'LAOBAI', name: '老白', legacy: true },
  XIAOWEN: { code: 'XIAOWEN', name: '小问', legacy: true },
});

export const SPEAKER_NAMES = Object.freeze({
  ...Object.fromEntries(CHARACTER_IDS.map(id => [id, CHARACTERS[id].name])),
  ...Object.fromEntries(Object.entries(LEGACY_CHARACTERS).map(([id, c]) => [id, c.name])),
});

export function getCharacter(id) {
  return CHARACTERS[id] || LEGACY_CHARACTERS[id] || null;
}

export function isFormalCharacter(id) {
  return CHARACTER_IDS.includes(id);
}

// 英文技术默认映射：与 characters.json 同步，尚未试听确认；中文既有参数不变。
export const ENGLISH_VOICES = Object.freeze({
  "A1": {
    "voice": "en-US-GuyNeural",
    "rate": "-6%",
    "pitch": "-4Hz",
    "status": "技术默认映射；已查当前服务音色列表，尚未试听确认"
  },
  "A2": {
    "voice": "en-US-JennyNeural",
    "rate": "+12%",
    "pitch": "+5Hz",
    "status": "技术默认映射；已查当前服务音色列表，尚未试听确认"
  },
  "B1": {
    "voice": "en-US-ChristopherNeural",
    "rate": "+2%",
    "pitch": "+1Hz",
    "status": "技术默认映射；已查当前服务音色列表，尚未试听确认"
  },
  "B2": {
    "voice": "en-US-AriaNeural",
    "rate": "-2%",
    "pitch": "+0Hz",
    "status": "技术默认映射；已查当前服务音色列表，尚未试听确认"
  },
  "C1": {
    "voice": "en-US-EricNeural",
    "rate": "-4%",
    "pitch": "-2Hz",
    "status": "技术默认映射；已查当前服务音色列表，尚未试听确认"
  },
  "C2": {
    "voice": "en-US-RogerNeural",
    "rate": "-7%",
    "pitch": "-2Hz",
    "status": "技术默认映射；已查当前服务音色列表，尚未试听确认"
  },
  "D1": {
    "voice": "en-US-SteffanNeural",
    "rate": "+10%",
    "pitch": "+6Hz",
    "status": "技术默认映射；已查当前服务音色列表，尚未试听确认"
  },
  "D2": {
    "voice": "en-US-MichelleNeural",
    "rate": "+0%",
    "pitch": "+2Hz",
    "status": "技术默认映射；已查当前服务音色列表，尚未试听确认"
  }
});
export function getVoice(id, language = 'zh') {
  if (!CHARACTER_IDS.includes(id)) throw new Error('Unknown formal character: ' + id);
  if (language === 'en') return ENGLISH_VOICES[id];
  if (language === 'zh') { const v = CHARACTERS[id].voice; return { voice: v.id, rate: v.rate, pitch: v.pitch }; }
  throw new Error('Unsupported language: ' + language);
}
