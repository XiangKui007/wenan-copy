import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { saveAs } from 'file-saver'

/**
 * @param {{ title: string; paragraphs: string[]; images?: { dataUrl: string; width: number; height: number }[] }} payload
 */
export async function exportArticleDocx(payload) {
  const children = []
  children.push(
    new Paragraph({
      text: payload.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  )
  for (const line of payload.paragraphs) {
    if (!line.trim()) {
      children.push(new Paragraph({ text: '' }))
      continue
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: line, font: 'Microsoft YaHei' })],
        spacing: { after: 120 },
      }),
    )
  }
  if (payload.images?.length) {
    children.push(new Paragraph({ text: '活动剪影', heading: HeadingLevel.HEADING_2 }))
    for (const im of payload.images) {
      const buf = dataUrlToUint8Array(im.dataUrl)
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: buf,
              type: 'jpg',
              transformation: {
                width: Math.min(im.width, 520),
                height: Math.min(im.height, 360),
              },
            }),
          ],
          spacing: { after: 200 },
        }),
      )
    }
  }
  const doc = new Document({
    sections: [{ properties: {}, children }],
  })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `教师活动图文_${Date.now()}.docx`)
}

function dataUrlToUint8Array(dataUrl) {
  const comma = dataUrl.indexOf(',')
  const b64 = dataUrl.slice(comma + 1)
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
