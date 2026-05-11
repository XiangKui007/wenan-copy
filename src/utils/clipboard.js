/**
 * 剪贴板：纯文本 + 富文本（便于粘贴到 Word / 公众号等保留基础排版）
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyTextToClipboard(text) {
  const value = String(text ?? '')
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      /* fallthrough */
    }
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/**
 * @param {{ plain: string; html: string }} payload
 * @returns {Promise<boolean>}
 */
export async function copyRichToClipboard(payload) {
  const plain = String(payload?.plain ?? '')
  const html = String(payload?.html ?? '')
  if (navigator.clipboard && window.isSecureContext && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([plain], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ])
      return true
    } catch {
      /* fallthrough */
    }
  }
  return copyTextToClipboard(plain)
}
