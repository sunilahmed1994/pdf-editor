// Organize/Edit tools: sab pdf-lib se, browser me.
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

const load = async f => PDFDocument.load(new Uint8Array(await f.arrayBuffer()), { ignoreEncryption: true })
const base = f => f.name.replace(/\.pdf$/i, '')
const pdfBlob = bytes => new Blob([bytes], { type: 'application/pdf' })

// "1-3, 5, 8-" -> [0,1,2,4,7,...]
export function parseRanges(str, n) {
  const s = new Set()
  for (const p of str.split(',').map(x => x.trim()).filter(Boolean)) {
    const [a, b] = p.split('-').map(x => x.trim())
    const from = parseInt(a), to = p.includes('-') ? (b ? parseInt(b) : n) : from
    if (!(from >= 1) || !(to >= from)) throw new Error('Invalid page range: ' + p)
    for (let i = from; i <= Math.min(to, n); i++) s.add(i - 1)
  }
  return [...s].sort((a, b) => a - b)
}

async function pick(src, idx) {
  const out = await PDFDocument.create()
  ;(await out.copyPages(src, idx)).forEach(p => out.addPage(p))
  return out.save()
}

export async function runTool(id, files, o = {}) {
  const f = files[0]
  if (id === 'merge') {
    if (files.length < 2) throw new Error('Choose at least 2 PDF files')
    const out = await PDFDocument.create()
    for (const x of files) {
      const s = await load(x)
      ;(await out.copyPages(s, s.getPageIndices())).forEach(p => out.addPage(p))
    }
    return { blob: pdfBlob(await out.save()), name: 'merged.pdf' }
  }
  const src = await load(f), n = src.getPageCount()
  if (id === 'extract' || id === 'remove') {
    const r = parseRanges(o.ranges || '', n)
    if (!r.length) throw new Error('Enter pages, e.g. 1-3, 5')
    const idx = id === 'extract' ? r : src.getPageIndices().filter(i => !r.includes(i))
    if (!idx.length) throw new Error('You cannot delete all pages')
    return { blob: pdfBlob(await pick(src, idx)), name: `${base(f)}-${id === 'extract' ? 'extracted' : 'edited'}.pdf` }
  }
  if (id === 'split') {
    const parts = o.mode === 'ranges'
      ? (o.ranges || '').split(',').map(x => parseRanges(x, n)).filter(p => p.length)
      : src.getPageIndices().map(i => [i])
    if (!parts.length) throw new Error('Enter ranges, e.g. 1-3, 5')
    if (parts.length === 1) return { blob: pdfBlob(await pick(src, parts[0])), name: `${base(f)}-part1.pdf` }
    const Zip = (await import('jszip')).default
    const zip = new Zip()
    for (const [k, p] of parts.entries()) zip.file(`${base(f)}-${k + 1}.pdf`, await pick(src, p))
    return { blob: await zip.generateAsync({ type: 'blob' }), name: `${base(f)}-split.zip` }
  }
  if (id === 'rotate') {
    const r = o.ranges ? parseRanges(o.ranges, n) : src.getPageIndices()
    r.forEach(i => { const p = src.getPage(i); p.setRotation(degrees((p.getRotation().angle + Number(o.angle || 90)) % 360)) })
    return { blob: pdfBlob(await src.save()), name: `${base(f)}-rotated.pdf` }
  }
  const font = await src.embedFont(StandardFonts.Helvetica)
  if (id === 'numbers') {
    const start = Number(o.start) || 1
    src.getPages().forEach((p, i) => {
      const { width: w, height: h } = p.getSize()
      const t = String(start + i), s = 11, tw = font.widthOfTextAtSize(t, s)
      const x = o.pos?.endsWith('l') ? 36 : o.pos?.endsWith('r') ? w - 36 - tw : (w - tw) / 2
      const y = o.pos?.startsWith('t') ? h - 36 : 28
      p.drawText(t, { x, y, size: s, font, color: rgb(0.2, 0.2, 0.2) })
    })
    return { blob: pdfBlob(await src.save()), name: `${base(f)}-numbered.pdf` }
  }
  if (id === 'watermark') {
    const text = (o.text || '').trim()
    if (!text) throw new Error('Enter the watermark text')
    if (/[^\x20-\x7E]/.test(text)) throw new Error('The watermark currently supports only English letters and numbers')
    const size = Number(o.size) || 60, tw = font.widthOfTextAtSize(text, size), c = Math.SQRT1_2
    src.getPages().forEach(p => {
      const { width: w, height: h } = p.getSize()
      p.drawText(text, { x: w / 2 - (tw / 2) * c + 0.35 * size * c, y: h / 2 - (tw / 2) * c - 0.35 * size * c, size, font,
        color: rgb(0.5, 0.5, 0.5), opacity: Number(o.opacity) || 0.3, rotate: degrees(45) })
    })
    return { blob: pdfBlob(await src.save()), name: `${base(f)}-watermarked.pdf` }
  }
  throw new Error('This tool is not available yet')
}
