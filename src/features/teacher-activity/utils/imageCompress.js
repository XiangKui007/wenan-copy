/**
 * 浏览器端压缩 JPG/PNG：限制最大边、输出 JPEG（体积更小）
 * @param {File} file
 * @param {{ maxEdge?: number; quality?: number }} opts
 * @returns {Promise<{ blob: Blob; dataUrl: string; name: string }>}
 */
export async function compressImageFile(file, opts = {}) {
  const maxEdge = opts.maxEdge ?? 1600
  const quality = opts.quality ?? 0.82
  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)
  const { width, height } = scaleToMaxEdge(img.width, img.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')
  ctx.drawImage(img, 0, 0, width, height)
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('压缩失败'))),
      'image/jpeg',
      quality,
    )
  })
  const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
  return {
    blob,
    dataUrl: canvas.toDataURL('image/jpeg', quality),
    name: `${base}.jpg`,
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('图片加载失败'))
    i.src = src
  })
}

function scaleToMaxEdge(w, h, maxEdge) {
  const m = Math.max(w, h)
  if (m <= maxEdge) return { width: w, height: h }
  const r = maxEdge / m
  return { width: Math.round(w * r), height: Math.round(h * r) }
}
