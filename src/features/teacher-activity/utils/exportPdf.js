import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * 将 DOM 节点导出为 PDF（中文依赖页面已渲染字体）
 * @param {HTMLElement} el
 * @param {string} fileName
 */
export async function exportElementPdf(el, fileName) {
  const canvas = await html2canvas(el, {
    scale: Math.min(2, window.devicePixelRatio || 2),
    useCORS: true,
    backgroundColor: '#ffffff',
  })
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 36
  const maxW = pageW - margin * 2
  const maxH = pageH - margin * 2
  let rw = canvas.width
  let rh = canvas.height
  const r = Math.min(maxW / rw, maxH / rh)
  rw *= r
  rh *= r
  pdf.addImage(imgData, 'JPEG', margin, margin, rw, rh)
  pdf.save(fileName || `教师活动图文_${Date.now()}.pdf`)
}
