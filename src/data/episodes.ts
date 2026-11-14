import { matthewEpisodes } from './matthew'

export type Gospel = 'matthew' | 'mark' | 'luke' | 'john'

export type Scene = {
  id: string
  title: string
  narration: string
  verseRef: string
  verse: string
  palette: 'night' | 'dawn' | 'sea' | 'desert' | 'garden' | 'gold' | 'storm' | 'cross' | 'empty'
  motif: 'star' | 'dove' | 'net' | 'mountain' | 'boat' | 'loaves' | 'path' | 'tomb' | 'cross' | 'light'
}

export type Episode = {
  id: string
  gospel: Gospel
  gospelLabel: string
  chapter: string
  title: string
  subtitle: string
  durationLabel: string
  devotion: {
    title: string
    body: string
    prayer: string
  }
  scenes: Scene[]
}

export const gospelMeta: Record<
  Gospel,
  { label: string; focus: string; accent: string }
> = {
  matthew: { label: '馬太福音', focus: '君王與國度 · 目前主推', accent: '#c4894a' },
  mark: { label: '馬可福音', focus: '僕人與行動 · 稍後擴充', accent: '#5a8f7b' },
  luke: { label: '路加福音', focus: '人子與憐憫 · 稍後擴充', accent: '#7a9bb8' },
  john: { label: '約翰福音', focus: '道成肉身 · 稍後擴充', accent: '#b8956a' },
}

/** 其他福音精選（馬太為主線後再擴充） */
const otherEpisodes: Episode[] = [
  {
    id: 'birth',
    gospel: 'luke',
    gospelLabel: '路加福音',
    chapter: '二章',
    title: '伯利恆之夜',
    subtitle: '道成了肉身，住在我們中間',
    durationLabel: '約 4 分',
    devotion: {
      title: '神與我們同在',
      body: '耶穌降生在馬槽，不是宮殿。神選擇走進最卑微的地方，好叫每一個尋求祂的人，都能靠近。',
      prayer: '主啊，謝謝祢降生在我們中間。求祢今夜靠近我的心。阿們。',
    },
    scenes: [
      {
        id: 'birth-1',
        title: '馬槽裡的嬰孩',
        narration: '就生了頭胎的兒子，用布包起來，放在馬槽裡，因為客店裡沒有地方。',
        verseRef: '路加福音 2:7',
        verse: '就生了頭胎的兒子，用布包起來，放在馬槽裡，因為客店裡沒有地方。',
        palette: 'dawn',
        motif: 'star',
      },
      {
        id: 'birth-2',
        title: '天使報喜',
        narration: '那天使對他們說：不要懼怕！我報給你們大喜的信息。',
        verseRef: '路加福音 2:10-11',
        verse: '那天使對他們說：「不要懼怕！我報給你們大喜的信息，是關乎萬民的；因今天在大衛的城裡，為你們生了救主，就是主基督。」',
        palette: 'gold',
        motif: 'light',
      },
    ],
  },
  {
    id: 'prodigal',
    gospel: 'luke',
    gospelLabel: '路加福音',
    chapter: '十五章',
    title: '浪子回家',
    subtitle: '父親遠遠的看見，就動了慈心',
    durationLabel: '約 3 分',
    devotion: {
      title: '奔跑的父親',
      body: '浪子還在遠處，父親就跑過去。神的愛不是等你「配得」才給，而是在你轉身的那一刻，已經向你奔來。',
      prayer: '天父，無論我走得多遠，求祢幫我轉身，奔向祢的懷抱。阿們。',
    },
    scenes: [
      {
        id: 'prodigal-1',
        title: '醒悟過來',
        narration: '他醒悟過來，說：我要起來，到我父親那裡去。',
        verseRef: '路加福音 15:17-18',
        verse: '他醒悟過來，就說：「我父親有多少的雇工，口糧有餘，我倒在這裡餓死嗎？我要起來，到我父親那裡去。」',
        palette: 'dawn',
        motif: 'path',
      },
      {
        id: 'prodigal-2',
        title: '擁抱',
        narration: '相離還遠，他父親看見，就動了慈心，跑去抱著他的頸項。',
        verseRef: '路加福音 15:20',
        verse: '於是起來，往他父親那裡去。相離還遠，他父親看見，就動了慈心，跑去抱著他的頸項，連連與他親嘴。',
        palette: 'gold',
        motif: 'light',
      },
    ],
  },
  {
    id: 'lazarus',
    gospel: 'john',
    gospelLabel: '約翰福音',
    chapter: '十一章',
    title: '拉撒路復活',
    subtitle: '我就是復活，我就是生命',
    durationLabel: '約 3 分',
    devotion: {
      title: '即使遲了',
      body: '有時我們以為太晚了，但祂仍是復活與生命。',
      prayer: '主耶穌，在我覺得「太遲」的地方，求祢顯明祢仍是生命。阿們。',
    },
    scenes: [
      {
        id: 'lazarus-1',
        title: '出來！',
        narration: '耶穌大聲呼叫說：拉撒路出來！那死人就出來了。',
        verseRef: '約翰福音 11:43-44',
        verse: '說了這話，就大聲呼叫說：「拉撒路出來！」那死人就出來了，手腳裹著布，臉上包著手巾。',
        palette: 'dawn',
        motif: 'tomb',
      },
    ],
  },
]

export const episodes: Episode[] = [...matthewEpisodes, ...otherEpisodes]

export function getEpisode(id: string): Episode | undefined {
  return episodes.find((e) => e.id === id)
}

export function episodesByGospel(gospel: Gospel): Episode[] {
  return episodes.filter((e) => e.gospel === gospel)
}

export { matthewEpisodes, nextMatthewEpisode } from './matthew'
