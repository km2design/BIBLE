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
  /** Public URL for the day's illustration (generated or default hero). */
  imageUrl?: string
}

const pool: Omit<DailyStory, 'date'>[] = [
  {
    characterId: 'siuyau',
    title: '小燈未熄',
    story:
      '茶記啲螢光燈忽明忽暗，林小悠同 Oreo 坐喺卡位等餐。Oreo 嘟嘴：「黯到連菠蘿油都睇唔清。」小悠望住窗邊那盞細燈，笑：「有陣時唔使做太陽，穩陣啲照住眼前呢枱都得。」Mochi 突然探頭：「咁你快啲照住帳單啦，阿 O 又想加多杯奶茶。」三人笑完，燈光又穩返——原來靠近，先見到光。',
    verseRef: '馬太福音 5:16',
    verse: '你們的光也當這樣照在人前，叫他們看見你們的好行為，便將榮耀歸給你們在天上的父。',
    wisdomKind: '鼓勵',
    wisdom: '唔使成日做最光嗰個；穩陣照住身邊一個人，已經好掂。',
    devotionTitle: '照住眼前一步',
    devotion: '今日你覺得自己「唔夠光」嗎？與其同人比較，不如問：我可唔可以真誠行好呢一步？',
    prayer: '主啊，幫我喺細位都揀發光，唔好因為比較熄燈。阿們。',
  },
  {
    characterId: 'oreo',
    title: '停一停都得',
    story:
      '港鐵尾班車前，小悠手機待辦清單長到 Oreo 都睇到眼冤。阿 O 搶過電話：「做人唔係咁急得嘅。」佢拉住小悠坐低飲口水，Mochi 補槍：「安息唔係懶，係交返畀真正有權嗰位。」清單合埋，世界竟然冇冧。三人先發現：原來喘一口氣，都係信靠。',
    verseRef: '馬太福音 11:28',
    verse: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。',
    wisdomKind: '安慰',
    wisdom: '休息唔係棄薄；係俾心返去對齊嗰位愛你嘅主。',
    devotionTitle: '重擔可以放低',
    devotion: '寫低兩件壓到你透唔到氣嘅事。邊一件可以今日交畀神，聽日先再執？',
    prayer: '主啊，教我誠實放低，亦有勇氣喺你裡面安息。阿們。',
  },
  {
    characterId: 'mochi',
    title: '路長過預期',
    story:
      '三人行山，小悠以為十分鐘到頂，結果踩入泥涌。想轉身時，Mochi 指住泥上面啲腳印：「有人早過你行過，仲繼續行。」Oreo 抹鞋：「咁我都行啦，唔好留低『肥仔投降』嘅腳印。」笑完繼續上——原來最怕嘅唔係路長，係以為自己一定要一個人走。',
    verseRef: '希伯來書 12:1',
    verse: '我們既有這許多的見證人，如同雲彩圍著我們，就當放下各樣的重擔，脫去容易纏累我們的罪，存心忍耐，奔那擺在我們前頭的路程。',
    wisdomKind: '勸戒',
    wisdom: '長路唔驚；驚嘅係以為自己一定要孤軍作戰。',
    devotionTitle: '同雲彩一齊行',
    devotion: '想起一個曾經托過你一把嘅人。今日你可以做邊個嘅腳印？',
    prayer: '主啊，賜我忍耐同同伴，跑完今日呢一段就得。阿們。',
  },
  {
    characterId: 'siuyau',
    title: '小心腳下',
    story:
      '天橋口人擠人，小悠差點踩空。Oreo 扯住佢：「你心散咗啦。」Mochi 毒舌：「成日刷短片，腳同心一齊飄。」三人停低睇箴言卡——原來外面風浪大，最危係心入面嗰條幼裂縫。小悠收起手機：「今日我行慢啲。」提醒唔一定受歡迎，但可以救人一跤。',
    verseRef: '箴言 4:23',
    verse: '你要保守你心，勝過保守一切，因為一生的果效是由心發出。',
    wisdomKind: '警告',
    wisdom: '忽略心入面啲細裂縫，往往比外面大風浪仲危險。',
    devotionTitle: '守住你嘅心',
    devotion: '今日有邊種情緒、慾望或者習慣喺度偷步擴張？點名佢，求神守住。',
    prayer: '主啊，開我眼睇見盲點，亦俾我勇氣及時返轉頭。阿們。',
  },
  {
    characterId: 'mochi',
    title: '先坐下聽',
    story:
      '茶記裡，小悠見到同學眼紅紅。本來想即刻教人做人，Mochi 卻推過杯凍檸茶：「你收聲，先俾位。」Oreo 默默遞紙巾。後來同學講：「多謝你哋冇急住修我。」原來同理有時比正確答案更先需要——聽住，已經係醫治嘅開始。',
    verseRef: '羅馬書 12:15',
    verse: '與喜樂的人要同樂；與哀哭的人要同哭。',
    wisdomKind: '同理',
    wisdom: '陪伴唔使急住解決；俾對方感覺被看見，已經係起步。',
    devotionTitle: '一齊喊嘅勇氣',
    devotion: '今日你可唔可以俾人十分鐘，唔打斷、唔急住下結論？',
    prayer: '主啊，令我心軟，識同人一齊笑亦一齊喊。阿們。',
  },
  {
    characterId: 'oreo',
    title: '一句夠用',
    story:
      '茶記卡位擺滿励志貼紙，Oreo 想全貼上牆。Mochi 撕走九成：「一句真話，好過十句靚空話。」小悠將剩低嗰句貼喺餐牌旁，問自己：我講嘢係建立人，定只係想自己好醒？連老闆都點頭——原來餐牌都可以提醒人收口。',
    verseRef: '箴言 16:24',
    verse: '良言如同蜂房，使心覺甘甜，使骨得醫治。',
    wisdomKind: '名言',
    wisdom: '良言係甜，亦有力——可以醫人，亦可以指路。',
    devotionTitle: '今日講一句真',
    devotion: '寫低一句你想對人講嘅鼓勵。若合適，就認真講出口。',
    prayer: '主啊，守我口，叫我講得出建立人嘅話。阿們。',
  },
  {
    characterId: 'siuyau',
    title: '失敗以後',
    story:
      '小悠整手作搞砸，碎片散滿枱，差點掃埋垃圾桶。Oreo 眼濕濕：「唔好棄咁快。」Mochi 酸：「你棄賽先真正完。」佢哋一齊執返碎片重來，成品歪歪斜斜，但三人笑得真實——跌倒唔係結局；唔肯再企先係。',
    verseRef: '以賽亞書 40:31',
    verse: '但那等候耶和華的必從新得力。他們必如鷹展翅上騰；他們奔跑卻不困倦，行走卻不疲乏。',
    wisdomKind: '提醒',
    wisdom: '重新開始唔丟臉；拒絕成長先會原地踏步。',
    devotionTitle: '從新得力',
    devotion: '指出一件你想放棄嘅事。若神仲請你行一步，嗰步係咩？',
    prayer: '主啊，俾我重新開始嘅勇氣，亦俾我等候你嘅耐心。阿們。',
  },
  {
    characterId: 'siuyau',
    title: '不必假裝強壯',
    story:
      '小組裡人人都好掂，小悠笑到臉肌痛，返到茶記先塌低。Oreo 靠住佢：「你其實撐唔住啦。」Mochi 少有溫柔：「互相擔當唔係弱。」小悠終於對朋友講：「我好攰。」當晚睡得沉——原來脆弱唔係缺陷；拒絕求助，先會變孤島。',
    verseRef: '加拉太書 6:2',
    verse: '你們各人的重擔要互相擔當，如此，就完全了基督的律法。',
    wisdomKind: '反思',
    wisdom: '脆弱唔係缺陷；拒絕求助，先會令重擔變孤島。',
    devotionTitle: '俾人幫你一把',
    devotion: '你有冇一個可以講真話嘅人？若冇，今日求神為你預備。',
    prayer: '主啊，教我放低偽裝，亦賜我可以互相擔當嘅同伴。阿們。',
  },
]

/** First day of the illustrated daily archive (Asia/Hong_Kong). */
export const DAILY_ARCHIVE_START = '2026-11-18'

/** Calendar date in Asia/Hong_Kong (YYYY-MM-DD). */
export function dateKey(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Tomorrow's calendar date in Asia/Hong_Kong (YYYY-MM-DD). */
export function tomorrowKey(from = new Date()): string {
  // Walk forward in 1h steps until the HK calendar day advances (handles DST-free HK cleanly).
  const start = dateKey(from)
  for (let i = 1; i <= 48; i++) {
    const probe = new Date(from.getTime() + i * 60 * 60 * 1000)
    const key = dateKey(probe)
    if (key !== start) return key
  }
  // Fallback: add 24h
  return dateKey(new Date(from.getTime() + 24 * 60 * 60 * 1000))
}

/** Add calendar days in Asia/Hong_Kong (ISO date in → ISO date out). */
export function addDaysKey(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T12:00:00+08:00`)
  if (Number.isNaN(base.getTime())) return isoDate
  return dateKey(new Date(base.getTime() + days * 86_400_000))
}

/** Seven HK calendar days starting at `start` (default today). */
export function weekDatesFrom(start = dateKey()): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysKey(start, i))
}

export function getSampleStoryForDate(date = dateKey()): DailyStory {
  const dayNum = Math.floor(new Date(date + 'T12:00:00').getTime() / 86_400_000)
  const base = pool[((dayNum % pool.length) + pool.length) % pool.length]
  return { ...base, date, sample: true }
}
