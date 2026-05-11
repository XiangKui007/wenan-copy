/**
 * 浏览器本地图片压缩（Canvas + encode），不上传服务器。
 * 优先输出 WebP（同等画质体积更小，且可保留 PNG 透明度）；不支持 WebP 编码时降级为 JPEG。
 */

let _webpEncodeCache = null

/** @returns {boolean} 当前环境是否支持将 Canvas 导出为 WebP */
export function supportsWebPEncode() {
  if (_webpEncodeCache !== null) return _webpEncodeCache
  try {
    const c = document.createElement('canvas')
    c.width = 2
    c.height = 2
    const u = c.toDataURL('image/webp')
    _webpEncodeCache = typeof u === 'string' && u.startsWith('data:image/webp')
  } catch {
    _webpEncodeCache = false
  }
  return _webpEncodeCache
}

/** @param {string} mime */
export function isSupportedImageMime(mime) {
  const m = String(mime || '').toLowerCase()
  return m === 'image/jpeg' || m === 'image/png' || m === 'image/webp'
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${Math.round(n)} B`
  const kb = n / 1024
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb < 10 ? mb.toFixed(2) : mb.toFixed(1)} MB`
}

/**
 * @param {number} original
 * @param {number} compressed
 * @returns {{ percent: number; label: string; worse: boolean }}
 */
export function savingsMeta(original, compressed) {
  const o = Number(original)
  const c = Number(compressed)
  if (!Number.isFinite(o) || o <= 0 || !Number.isFinite(c)) {
    return { percent: 0, label: '—', worse: false }
  }
  const ratio = 1 - c / o
  const pct = Math.round(ratio * 100)
  if (pct >= 0) {
    return { percent: pct, label: `节省 ${pct}%`, worse: false }
  }
  const inc = Math.round(-ratio * 100)
  return { percent: pct, label: `体积增加 ${inc}%`, worse: true }
}

/**
 * @param {File} file
 * @param {number} quality 0.1–1
 * @returns {Promise<{ blob: Blob; mime: string; width: number; height: number; name: string }>}
 */
export async function compressImageFile(file, quality) {
  const q = Math.min(1, Math.max(0.1, Number(quality) || 0.82))
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('无法读取图片，文件可能已损坏')
  }

  const w = bitmap.width
  const h = bitmap.height
  if (!w || !h) {
    bitmap.close?.()
    throw new Error('图片尺寸无效')
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    throw new Error('Canvas 不可用')
  }

  const useWebp = supportsWebPEncode()
  const mime = useWebp ? 'image/webp' : 'image/jpeg'
  const ext = useWebp ? 'webp' : 'jpg'

  if (!useWebp) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }

  try {
    ctx.drawImage(bitmap, 0, 0)
  } catch {
    bitmap.close?.()
    throw new Error('绘制图片失败')
  } finally {
    bitmap.close?.()
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('压缩导出失败'))),
      mime,
      q,
    )
  })

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
  return {
    blob,
    mime,
    width: w,
    height: h,
    name: `${baseName}.${ext}`,
  }
}
