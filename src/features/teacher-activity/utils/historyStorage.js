const KEY = 'teacher_activity_history_v1'
const MAX = 30

/**
 * @typedef {{ id: string; sceneLabel: string; title: string; plain: string; ts: number }} HistoryItem
 */

/** @returns {HistoryItem[]} */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** @param {HistoryItem[]} list */
export function saveHistory(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
}

/** @param {Omit<HistoryItem, 'id' | 'ts'> & { id?: string }} item */
export function pushHistory(item) {
  const id = item.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const next = [
    { id, ts: Date.now(), sceneLabel: item.sceneLabel, title: item.title, plain: item.plain },
    ...loadHistory().filter((h) => h.id !== id),
  ]
  saveHistory(next)
  return next
}

export function clearHistory() {
  localStorage.removeItem(KEY)
}
