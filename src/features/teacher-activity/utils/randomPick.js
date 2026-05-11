/**
 * @param {string[]} list
 * @returns {string}
 */
export function pickRandomFromList(list) {
  if (!Array.isArray(list) || list.length === 0) return ''
  const max = list.length - 1
  const index = Math.floor(Math.random() * (max + 1))
  return list[index]
}
