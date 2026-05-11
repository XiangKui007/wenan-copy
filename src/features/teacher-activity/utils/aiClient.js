/**
 * 兼容 OpenAI Chat Completions 格式的网关（豆包/千帆/自建代理等可填 Base URL + Key）
 * 未配置 Key 时返回 null，由调用方走本地润色。
 */

const LS_KEY = 'teacher_ai_api_key'
const LS_BASE = 'teacher_ai_base_url'
const LS_MODEL = 'teacher_ai_model'

export function getAiSettings() {
  return {
    apiKey: localStorage.getItem(LS_KEY) || import.meta.env.VITE_AI_API_KEY || '',
    baseUrl:
      localStorage.getItem(LS_BASE) ||
      import.meta.env.VITE_AI_BASE_URL ||
      'https://api.openai.com/v1',
    model:
      localStorage.getItem(LS_MODEL) ||
      import.meta.env.VITE_AI_MODEL ||
      'gpt-4o-mini',
  }
}

export function setAiSettings(patch) {
  if (patch.apiKey !== undefined) {
    if (patch.apiKey) localStorage.setItem(LS_KEY, patch.apiKey)
    else localStorage.removeItem(LS_KEY)
  }
  if (patch.baseUrl !== undefined) {
    if (patch.baseUrl) localStorage.setItem(LS_BASE, patch.baseUrl)
    else localStorage.removeItem(LS_BASE)
  }
  if (patch.model !== undefined) {
    if (patch.model) localStorage.setItem(LS_MODEL, patch.model)
    else localStorage.removeItem(LS_MODEL)
  }
}

/**
 * @param {string} systemPrompt
 * @param {string} userContent
 * @returns {Promise<string|null>} 失败或未配置返回 null
 */
export async function chatComplete(systemPrompt, userContent) {
  const { apiKey, baseUrl, model } = getAiSettings()
  if (!apiKey) return null
  const url = `${String(baseUrl).replace(/\/$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  return typeof text === 'string' ? text.trim() : null
}

/** 本地「AI 感」润色：无 Key 时使用 */
export function localPolishTeacherCopy(title, body) {
  const t = String(title || '').trim()
  const b = String(body || '').trim()
  const tails = [
    '愿我们携手，把每一次活动都化作学生成长的养分。',
    '教育在路上，我们与学生一同前行、一同收获。',
    '记录当下，是为了更好地出发；感谢每一位参与者的用心与陪伴。',
    '以活动促成长，以细节见温度；期待下一次更精彩的相聚。',
  ]
  const pick = tails[Math.floor(Math.random() * tails.length)]
  const merged = `${b}\n\n${pick}`
  return { title: t, body: merged }
}

/**
 * @param {{ title: string; body: string; sceneLabel: string }} input
 * @returns {Promise<{ title: string; body: string; via: 'remote' | 'local' }>}
 */
export async function optimizeArticle(input) {
  const system =
    '你是资深中小学教师文案助手。请在不改变事实的前提下，把下列活动图文改得更正式、温馨、简洁；保留「标题」与「正文」结构，用中文输出 JSON：{"title":"...","body":"..."}，不要其它说明。'
  const user = `场景：${input.sceneLabel}\n标题：${input.title}\n正文：\n${input.body}`
  const remote = await chatComplete(system, user)
  if (remote) {
    try {
      const j = JSON.parse(remote.replace(/^```json\s*|```$/g, '').trim())
      if (j && j.title && j.body) {
        return { title: String(j.title), body: String(j.body), via: 'remote' }
      }
    } catch {
      /* fallthrough */
    }
  }
  const loc = localPolishTeacherCopy(input.title, input.body)
  return { title: loc.title, body: loc.body, via: 'local' }
}
