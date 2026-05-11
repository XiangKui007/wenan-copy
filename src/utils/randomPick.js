/**
 * 原生随机抽取：从数组中均匀随机取一条（含边界）
 * 不依赖 lodash 等第三方库，便于模板项目零依赖复用
 * @param {string[]} list 非空字符串数组
 * @returns {string}
 */
export function pickRandomFromList(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return ''
  }
  const max = list.length - 1
  const index = Math.floor(Math.random() * (max + 1))
  return list[index]
}
