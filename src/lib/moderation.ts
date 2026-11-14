const BLOCKED = [
  '幹你',
  '操你',
  '肏',
  '他媽',
  '他媽的',
  '傻逼',
  '白癡',
  '白痴',
  '去死',
  '屌你',
  '仆街',
  '尻',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
]

export function containsBlockedLanguage(text: string): boolean {
  const lower = text.toLowerCase()
  return BLOCKED.some((w) => lower.includes(w.toLowerCase()))
}

export function sanitizeNickname(raw: string): string {
  return raw.trim().slice(0, 20).replace(/\s+/g, ' ')
}

export function sanitizeBody(raw: string): string {
  return raw.trim().slice(0, 500)
}

export const COMMENT_RULES =
  '留言規則：請溫柔、尊重、彼此建立。禁止粗口、人身攻擊、色情、仇恨或廣告宣傳。違規留言會由版主刪除，情節嚴重者可能限制發言。'
