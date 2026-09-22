import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const PAGE = { width: 595.28, height: 841.89 } // A4, in points
const MARGIN = 56

const STYLE = {
  h1: { size: 22, bold: true, spaceBefore: 18, spaceAfter: 10 },
  h2: { size: 18, bold: true, spaceBefore: 16, spaceAfter: 8 },
  h3: { size: 15, bold: true, spaceBefore: 14, spaceAfter: 6 },
  h4: { size: 13, bold: true, spaceBefore: 12, spaceAfter: 6 },
  h5: { size: 12, bold: true, spaceBefore: 10, spaceAfter: 5 },
  h6: { size: 11, bold: true, spaceBefore: 10, spaceAfter: 5 },
  li: { size: 11, bold: false, spaceBefore: 2, spaceAfter: 2, indent: 16, bullet: true },
  p: { size: 11, bold: false, spaceBefore: 4, spaceAfter: 8 },
}

function wrapLine(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(attempt, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = attempt
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

// blocks: [{ type: 'h1'|'h2'|...|'p'|'li', text }]
export async function buildTextPdf(blocks, { title = 'Document' } = {}) {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(title)
  pdfDoc.setCreator('ConvertHub')

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE.width, PAGE.height])
  let y = PAGE.height - MARGIN
  const maxWidth = PAGE.width - MARGIN * 2
  const lineGap = 1.35

  const ensureSpace = (needed) => {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage([PAGE.width, PAGE.height])
      y = PAGE.height - MARGIN
    }
  }

  for (const block of blocks) {
    const type = STYLE[block.type] ? block.type : 'p'
    const style = STYLE[type]
    const font = style.bold ? bold : regular
    const indent = style.indent || 0
    const prefix = style.bullet ? '•  ' : ''
    const text = `${prefix}${block.text || ''}`.trim()
    if (!text) continue

    y -= style.spaceBefore || 0
    const lines = wrapLine(text, font, style.size, maxWidth - indent)
    const lineHeight = style.size * lineGap

    for (const line of lines) {
      ensureSpace(lineHeight)
      page.drawText(line, {
        x: MARGIN + indent,
        y: y - style.size,
        size: style.size,
        font,
        color: rgb(0.11, 0.09, 0.07),
      })
      y -= lineHeight
    }
    y -= style.spaceAfter || 0
  }

  return pdfDoc.save()
}
