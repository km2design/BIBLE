export type DollCharacter = {
  id: string
  name: string
  title: string
  trait: string
  palette: string
  accent: string
}

export const characters: DollCharacter[] = [
  {
    id: 'xiaoguang',
    name: '小光',
    title: '希望公仔',
    trait: '看見微小亮光也不放棄',
    palette: 'linear-gradient(160deg,#f0d9a8,#c4894a)',
    accent: '#e8c9a0',
  },
  {
    id: 'anan',
    name: '安安',
    title: '安息公仔',
    trait: '在喧鬧中尋找安靜',
    palette: 'linear-gradient(160deg,#9bb8c9,#4a6a7a)',
    accent: '#7a9bb8',
  },
  {
    id: 'lvren',
    name: '旅人',
    title: '朝聖公仔',
    trait: '一步一步走在路上',
    palette: 'linear-gradient(160deg,#c4a06a,#6b5340)',
    accent: '#c4894a',
  },
  {
    id: 'shouwang',
    name: '守望',
    title: '守夜公仔',
    trait: '提醒人留心腳步',
    palette: 'linear-gradient(160deg,#6a7a8a,#2a3848)',
    accent: '#8a9aaa',
  },
  {
    id: 'rouxin',
    name: '柔心',
    title: '同理公仔',
    trait: '先聽，再陪著走',
    palette: 'linear-gradient(160deg,#d4a8b8,#8a5a6a)',
    accent: '#c4899a',
  },
  {
    id: 'mingyan',
    name: '明言',
    title: '箴言公仔',
    trait: '把智慧說得清楚',
    palette: 'linear-gradient(160deg,#b8c9a0,#5a7a4a)',
    accent: '#8aaa6a',
  },
]

export function getCharacter(id: string): DollCharacter {
  return characters.find((c) => c.id === id) ?? characters[0]
}
