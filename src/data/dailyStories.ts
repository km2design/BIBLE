import { characters, type DollCharacter } from './characters'

export type WisdomKind =
  | '反思'
  | '名言'
  | '提醒'
  | '警告'
  | '勸戒'
  | '鼓勵'
  | '安慰'
  | '同理'

export type DailyStory = {
  date: string
  characterId: string
  title: string
  story: string
  verseRef: string
  verse: string
  wisdomKind: WisdomKind
  wisdom: string
  devotionTitle: string
  devotion: string
  prayer: string
  sample?: boolean
}

const pool: Omit<DailyStory, 'date'>[] = [
  {
    characterId: 'xiaoguang',
    title: '小燈還在',
    story:
      '小光公仔走在雨後的巷弄，看見一盞快熄的路燈。他沒有急著抱怨黑暗，而是蹲下來，讀著口袋裡的經文卡片。風一吹，燈又亮了一點——他忽然明白：有些光，是等人願意靠近才看得見。',
    verseRef: '馬太福音 5:16',
    verse: '你們的光也當這樣照在人前，叫他們看見你們的好行為，便將榮耀歸給你們在天上的父。',
    wisdomKind: '鼓勵',
    wisdom: '你不需要成為太陽；先做一盞穩定的小燈，已經能溫暖身旁的人。',
    devotionTitle: '先照亮眼前一步',
    devotion: '今天若覺得自己不夠亮，別急著與別人比較。問自己：我能把這一小步走得真誠嗎？',
    prayer: '主啊，幫助我在微小之處仍選擇發光，不因比較而熄滅。阿們。',
  },
  {
    characterId: 'anan',
    title: '停一下也好',
    story:
      '安安公仔被一堆待辦清單追著跑。他坐在石階上喘气，翻開詩篇，發現「安息」不是偷懶，而是把心交回給那位真正掌權的。他合上清單，先喝了一口水，世界沒有塌下來。',
    verseRef: '馬太福音 11:28',
    verse: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。',
    wisdomKind: '安慰',
    wisdom: '休息不是放棄責任，而是讓心靈重新對齊愛你的那一位。',
    devotionTitle: '重擔可以放下',
    devotion: '列出讓你喘不過氣的兩三件事。哪一件可以今天交給神、明天再拿起來？',
    prayer: '主啊，教我誠實地放下，也勇敢地安息在祢裡。阿們。',
  },
  {
    characterId: 'lvren',
    title: '路比想像長',
    story:
      '旅人公仔以為很快就到山頂，卻在半路遇見泥濘。他差點轉身，卻在泥裡看見別人留下的腳印——原來有人比他更早走過，而且還往前了。他擦擦鞋，繼續走，心裡輕了一點。',
    verseRef: '希伯來書 12:1',
    verse: '我們既有這許多的見證人，如同雲彩圍著我們，就當放下各樣的重擔，脫去容易纏累我們的罪，存心忍耐，奔那擺在我們前頭的路程。',
    wisdomKind: '勸戒',
    wisdom: '長路不可怕，可怕的是以為自己必須一個人走完。',
    devotionTitle: '與雲彩同行',
    devotion: '回想一位曾經鼓勵過你的人。今天，你也可以成為別人路上的腳印。',
    prayer: '主啊，賜我忍耐與同伴，好跑完今天這一小段。阿們。',
  },
  {
    characterId: 'shouwang',
    title: '小心腳下',
    story:
      '守望公仔站在橋邊，看著人潮匆匆。他舉起小小警示牌，不是為了嚇人，而是因為他曾跌過。有人嫌他囉嗦，有人因此放慢腳步。他知道：真心的提醒，不一定立刻被喜歡，卻可能救人一跤。',
    verseRef: '箴言 4:23',
    verse: '你要保守你心，勝過保守一切，因為一生的果效是由心發出。',
    wisdomKind: '警告',
    wisdom: '忽略內心的小裂縫，往往比外面的大風浪更危險。',
    devotionTitle: '保守你的心',
    devotion: '今天有什麼情緒、慾望或習慣正在悄悄擴大？點名它，並求神守護。',
    prayer: '主啊，開我的眼睛，看見自己的盲點，也給我勇氣及時回頭。阿們。',
  },
  {
    characterId: 'rouxin',
    title: '先坐下聽',
    story:
      '柔心公仔遇見一位哭紅眼的朋友。他本來想給一堆建議，卻先把茶杯推過去，安靜坐著。後來朋友說：「謝謝你沒有急著修我。」柔心這才懂：同理有時比正確的答案更先需要。',
    verseRef: '羅馬書 12:15',
    verse: '與喜樂的人要同樂；與哀哭的人要同哭。',
    wisdomKind: '同理',
    wisdom: '陪伴不必急著解決；先讓對方感覺被看見，已經是醫治的開始。',
    devotionTitle: '同哭的勇氣',
    devotion: '今天你能否給某人十分鐘不被打斷的聆聽？不急著給結論。',
    prayer: '主啊，讓我的心柔軟，能與人同哭同樂。阿們。',
  },
  {
    characterId: 'mingyan',
    title: '一句夠用',
    story:
      '明言公仔喜歡收集句子。今天他只留下一句：「一句真話，勝過十句漂亮空話。」他把它貼在鏡子上，提醒自己說話前先問：這是建立人，還是只是炫耀自己？',
    verseRef: '箴言 16:24',
    verse: '良言如同蜂房，使心覺甘甜，使骨得醫治。',
    wisdomKind: '名言',
    wisdom: '良言是甜的，也是有力量的——它能醫治，也能指路。',
    devotionTitle: '今天說一句良言',
    devotion: '寫下一句你想對某人說的鼓勵。若合適，就真實地說出口。',
    prayer: '主啊，保守我的口，叫我說出能建立人的話。阿們。',
  },
  {
    characterId: 'xiaoguang',
    title: '失敗以後',
    story:
      '小光公仔拼模型拼壞了，差點把碎片全丟進垃圾桶。他想起經文說「重新得力」，於是把碎片排好，重新開始。成品不完美，但他學會了：跌倒不是結局，棄賽才是。',
    verseRef: '以賽亞書 40:31',
    verse: '但那等候耶和華的必從新得力。他們必如鷹展翅上騰；他們奔跑卻不困倦，行走卻不疲乏。',
    wisdomKind: '提醒',
    wisdom: '重新開始不算丟臉；拒絕成長才會讓人停在原地。',
    devotionTitle: '從新得力',
    devotion: '指出一件你想放棄的事。若神仍邀請你走一步，那一步是什麼？',
    prayer: '主啊，給我重新開始的勇氣，也給我等候祢的耐心。阿們。',
  },
  {
    characterId: 'anan',
    title: '不必假裝強壯',
    story:
      '安安公仔在大家面前總是微笑，私底下卻很累。他讀到「互相擔當」，才敢跟一位可信的朋友說：「我其實撐不住了。」那一夜，他第一次睡得沉。',
    verseRef: '加拉太書 6:2',
    verse: '你們各人的重擔要互相擔當，如此，就完全了基督的律法。',
    wisdomKind: '反思',
    wisdom: '脆弱不是缺陷；拒絕求助，才會讓重擔變成孤島。',
    devotionTitle: '讓人幫你一把',
    devotion: '你有沒有一位可以誠實說話的人？若沒有，今天求神為你預備。',
    prayer: '主啊，教我放下偽裝，也賜我可以互相擔當的同伴。阿們。',
  },
]

/** Calendar date in Asia/Hong_Kong (YYYY-MM-DD). */
export function dateKey(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function getSampleStoryForDate(date = dateKey()): DailyStory {
  const dayNum = Math.floor(new Date(date + 'T12:00:00').getTime() / 86_400_000)
  const base = pool[((dayNum % pool.length) + pool.length) % pool.length]
  return { ...base, date, sample: true }
}

export function withCharacter(story: DailyStory): DailyStory & { character: DollCharacter } {
  return { ...story, character: characters.find((c) => c.id === story.characterId) ?? characters[0] }
}
