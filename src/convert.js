// Saari conversions browser me hoti hain (koi server nahi).
import * as pdfjs from 'pdfjs-dist'
import { PDFDocument, StandardFonts } from 'pdf-lib'

const openPdf = bytes => pdfjs.getDocument({ data: bytes.slice() }).promise
const dataUrl = blob => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })

async function renderPage(doc, n, scale, type = 'png') {
  const p = await doc.getPage(n)
  const vp = p.getViewport({ scale })
  const c = document.createElement('canvas')
  c.width = vp.width; c.height = vp.height
  const ctx = c.getContext('2d')
  if (type === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height) }
  await p.render({ canvasContext: ctx, viewport: vp }).promise
  return new Promise(res => c.toBlob(res, type === 'jpg' ? 'image/jpeg' : 'image/png', 0.92))
}

// Har page ka text lines (rows) aur cells me. covers = mitaye/badle hue text ke dabbe, jinka purana text skip hota hai.
async function readLines(doc, covers = []) {
  const pages = []
  for (let n = 1; n <= doc.numPages; n++) {
    const p = await doc.getPage(n)
    const vp = p.getViewport({ scale: 1 })
    const hidden = covers.filter(c => c.page === n - 1)
    const items = (await p.getTextContent()).items
      .filter(s => s.str.trim())
      .map(s => ({ x: s.transform[4], y: vp.height - s.transform[5], w: s.width, h: Math.hypot(s.transform[0], s.transform[1]) || 10, s: s.str }))
      .filter(i => {
        const cx = i.x + i.w / 2, cy = i.y - i.h * 0.35
        return !hidden.some(c => cx >= c.x && cx <= c.x + c.w && cy >= c.y && cy <= c.y + c.h)
      })
    items.sort((a, b) => a.y - b.y || a.x - b.x)
    const rows = []
    for (const it of items) {
      const r = rows.find(r => Math.abs(r.y - it.y) < it.h * 0.5)
      r ? r.items.push(it) : rows.push({ y: it.y, items: [it] })
    }
    rows.sort((a, b) => a.y - b.y)
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x)
      r.h = Math.max(...r.items.map(i => i.h))
      r.cells = []
      for (const it of r.items) {
        const last = r.cells[r.cells.length - 1]
        if (last && it.x - last.end < it.h * 0.7) { last.s += (it.x - last.end > it.h * 0.15 ? ' ' : '') + it.s; last.end = it.x + it.w }
        else r.cells.push({ x: it.x, end: it.x + it.w, s: it.s })
      }
      r.text = r.cells.map(c => c.s).join('   ')
    }
    pages.push({ w: vp.width, h: vp.height, rows })
  }
  return pages
}

const overlap = (a, b) => a.x < b.end && a.end > b.x

// Rows[i] se shuru hone wali table dhoondta hai (columns ka text aapas me align hona chahiye)
function tableAt(rows, i) {
  if (rows[i].cells.length < 2) return null
  const grp = [rows[i]]
  let j = i
  while (j + 1 < rows.length) {
    const p = rows[j], n = rows[j + 1], gap = n.y - p.y
    if (gap > Math.max(n.h, p.h) * 2.6) break
    const c = n.cells[0]
    const touches = grp.some(r => r.cells.some(x => overlap(x, c)))
    const multi = n.cells.length >= 2
    const cont = !multi && touches && c.x > grp[0].cells[0].x + 20 && gap < n.h * 1.5 // continuation line of a cell
    const look = !multi && touches && rows[j + 2] && rows[j + 2].cells.length >= 2
    if (!multi && !cont && !look) break
    grp.push(n); j++
  }
  // columns = x-axis par wo hisse jahan kisi row me text hai
  const iv = grp.flatMap(r => r.cells.map(c => [c.x, c.end])).sort((a, b) => a[0] - b[0])
  const cols = []
  iv.forEach(([a, b]) => { const l = cols[cols.length - 1]; if (l && a <= l.b + 4) l.b = Math.max(l.b, b); else cols.push({ a, b, n: 0 }) })
  grp.forEach(r => r.cells.forEach(c => { cols.find(k => (c.x + c.end) / 2 <= k.b + 1).n++ }))
  if (grp.filter(r => r.cells.length >= 2).length < 2 || cols.filter(k => k.n >= 2).length < 2) return null
  return { type: 't', grp, cols, end: j + 1 }
}

async function toDocx(pages) {
  const D = await import('docx')
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = D
  const tw = pt => Math.round(pt * 20)
  const run = (s, h) => new TextRun({ text: s, size: Math.round(h * 2) })

  function buildTable(t) {
    const { grp, cols } = t
    const idx = c => cols.findIndex(k => (c.x + c.end) / 2 <= k.b + 1)
    const out = []
    grp.forEach((r, n) => {
      const ks = r.cells.map(idx)
      const prev = out[out.length - 1]
      const cont = prev && !ks.includes(0) && r.y - grp[n - 1].y < r.h * 1.5
      const cur = cont ? prev : { cells: Array(cols.length).fill(null) }
      r.cells.forEach((c, m) => {
        const k = ks[m], s = cur.cells[k]
        if (!s) cur.cells[k] = { lines: [c.s], h: r.h, a: c.x, b: c.end }
        else if (cont) s.lines.push(c.s)
        else s.lines[s.lines.length - 1] += ' ' + c.s
      })
      if (!cont) out.push(cur)
    })
    // numbers wale columns right/center align
    const al = cols.map((_, k) => {
      const cs = out.map(r => r.cells[k]).filter(Boolean)
      if (cs.length < 2) return undefined
      const sp = f => Math.max(...cs.map(f)) - Math.min(...cs.map(f))
      if (sp(c => c.b) < 3 && sp(c => c.a) > 6) return AlignmentType.RIGHT
      if (sp(c => (c.a + c.b) / 2) < 3 && sp(c => c.a) > 6 && sp(c => c.b) > 6) return AlignmentType.CENTER
      return undefined
    })
    const widths = cols.map((k, m) => tw((m < cols.length - 1 ? (k.b + cols[m + 1].a) / 2 : k.b + 2) - (m ? (cols[m - 1].b + k.a) / 2 : k.a - 2)))
    return new Table({
      width: { size: widths.reduce((x, y) => x + y, 0), type: WidthType.DXA },
      columnWidths: widths,
      rows: out.map(r => new TableRow({
        children: r.cells.map((c, k) => new TableCell({
          width: { size: widths[k], type: WidthType.DXA },
          margins: { top: 20, bottom: 20, left: 60, right: 60 },
          children: c ? c.lines.map(l => new Paragraph({ alignment: al[k], children: [run(l, c.h)] })) : [new Paragraph('')]
        }))
      }))
    })
  }

  const sections = pages.map(pg => {
    const rows = pg.rows
    if (!rows.length) return { properties: {}, children: [new Paragraph('')] }
    const left = Math.min(...rows.map(r => r.cells[0].x))
    const right = Math.max(...rows.map(r => r.cells[r.cells.length - 1].end))
    const width = right - left
    // rows ko table ya paragraph blocks me baanto
    const blocks = []
    for (let i = 0; i < rows.length;) {
      const t = tableAt(rows, i)
      if (t) { blocks.push(t); i = t.end; continue }
      const r = rows[i], p = blocks[blocks.length - 1]
      if (p && p.type === 'p' && r.y - p.last.y < p.last.h * 1.7 && Math.abs(r.h - p.h) < 1.5 &&
          p.last.cells[p.last.cells.length - 1].end > left + width * 0.8) { p.text += ' ' + r.text; p.last = r }
      else blocks.push({ type: 'p', text: r.text, h: r.h, first: r, last: r })
      i++
    }
    const lastRow = b => b.last || b.grp[b.grp.length - 1]
    const children = []
    blocks.forEach((b, k) => {
      const first = b.first || b.grp[0]
      const before = k ? Math.min(200, Math.max(0, first.y - lastRow(blocks[k - 1]).y - first.h * 1.15)) : 0
      if (b.type === 't') {
        if (before > 6) children.push(new Paragraph({ spacing: { before: 0, after: 0, line: tw(before), lineRule: 'exact' } }))
        children.push(buildTable(b))
        return
      }
      const x0 = first.cells[0].x, x1 = first.cells[first.cells.length - 1].end
      let alignment, indent
      if (x0 - left > 15 && Math.abs((x0 + x1) / 2 - (left + right) / 2) < 8) alignment = AlignmentType.CENTER
      else if (x0 > left + width * 0.45 && x1 > right - 6) alignment = AlignmentType.RIGHT
      else if (x0 - left > 8) indent = { left: tw(x0 - left) }
      children.push(new Paragraph({ alignment, indent, spacing: { before: tw(before), after: 0 }, children: [run(b.text, b.h)] }))
    })
    if (blocks[blocks.length - 1].type === 't') children.push(new Paragraph(''))
    return {
      properties: { page: {
        size: { width: tw(pg.w), height: tw(pg.h) },
        margin: { top: tw(Math.max(0, rows[0].y - rows[0].h * 1.1)), bottom: tw(36), left: tw(left), right: tw(Math.max(0, pg.w - right)) }
      } },
      children
    }
  })
  return Packer.toBlob(new Document({ styles: { default: { document: { run: { font: 'Arial' } } } }, sections }))
}

async function toXlsx(pages) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  pages.forEach((pg, i) => {
    const xs = [...new Set(pg.rows.flatMap(r => r.cells.map(c => c.x)))].sort((a, b) => a - b)
    const cols = []
    xs.forEach(x => { if (!cols.length || x - cols[cols.length - 1] > 12) cols.push(x) })
    const colOf = x => { let k = 0; cols.forEach((c, j) => { if (x >= c - 12) k = j }); return k }
    const aoa = pg.rows.map(r => {
      const a = []
      r.cells.forEach(c => { const k = colOf(c.x); a[k] = a[k] ? a[k] + ' ' + c.s : c.s })
      return Array.from(a, v => v ?? '')
    })
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Page ' + (i + 1))
  })
  return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })])
}

async function toPptx(pages, doc, asImage) {
  const m = await import('pptxgenjs/dist/pptxgen.bundle.js')
  const Pptx = m.default || m
  const pptx = new Pptx()
  pptx.defineLayout({ name: 'PDF', width: pages[0].w / 72, height: pages[0].h / 72 })
  pptx.layout = 'PDF'
  for (let i = 0; i < pages.length; i++) {
    const slide = pptx.addSlide(), pg = pages[i]
    if (asImage) {
      slide.addImage({ data: await dataUrl(await renderPage(doc, i + 1, 2)), x: 0, y: 0, w: pg.w / 72, h: pg.h / 72 })
    } else {
      pg.rows.forEach(r => slide.addText(r.text, {
        x: r.cells[0].x / 72, y: (r.y - r.h) / 72, w: (r.cells[r.cells.length - 1].end - r.cells[0].x) / 72 + 0.3,
        h: (r.h * 1.3) / 72, fontSize: r.h, margin: 0, valign: 'top', fit: 'none'
      }))
    }
  }
  return pptx.write({ outputType: 'blob' })
}

// PDF se baqi formats. covers = edit shuda text ke dabbe
export async function fromPdf(kind, bytes, covers) {
  const doc = await openPdf(bytes)
  if (kind === 'png' || kind === 'jpg') {
    const blobs = []
    for (let n = 1; n <= doc.numPages; n++) blobs.push(await renderPage(doc, n, 2, kind))
    if (blobs.length === 1) return { blob: blobs[0], ext: kind }
    const Zip = (await import('jszip')).default
    const zip = new Zip()
    blobs.forEach((b, i) => zip.file(`page-${i + 1}.${kind}`, b))
    return { blob: await zip.generateAsync({ type: 'blob' }), ext: 'zip' }
  }
  const pages = await readLines(doc, covers)
  if (kind === 'pptx-img') return { blob: await toPptx(pages, doc, true), ext: 'pptx' }
  if (!pages.some(p => p.rows.length)) throw new Error('No text found in this PDF (it may be a scanned PDF; OCR is not supported yet)')
  if (kind === 'docx') return { blob: await toDocx(pages), ext: 'docx' }
  if (kind === 'xlsx') return { blob: await toXlsx(pages), ext: 'xlsx' }
  if (kind === 'pptx') return { blob: await toPptx(pages, doc, false), ext: 'pptx' }
  throw new Error('This format is not supported yet')
}

// ---------- baqi formats se PDF ----------
async function makePdf(blocks, { mono = false, landscape = false } = {}) {
  const pdf = await PDFDocument.create()
  const reg = await pdf.embedFont(mono ? StandardFonts.Courier : StandardFonts.Helvetica)
  const bold = await pdf.embedFont(mono ? StandardFonts.CourierBold : StandardFonts.HelveticaBold)
  const [W, H] = landscape ? [842, 595] : [595, 842]
  const M = 50
  let page = pdf.addPage([W, H]), y = H - M
  for (const b of blocks) {
    if (b.pageBreak) { page = pdf.addPage([W, H]); y = H - M; continue }
    const size = b.size || 11, font = b.bold ? bold : reg
    const text = (b.text || '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?') // Helvetica sirf Latin letters
    const lines = []
    let cur = ''
    for (const w of text.split(' ')) {
      const t = cur ? cur + ' ' + w : w
      if (!mono && cur && font.widthOfTextAtSize(t, size) > W - 2 * M) { lines.push(cur); cur = w } else cur = t
    }
    lines.push(cur)
    y -= b.gap ?? 4
    for (const l of lines) {
      if (y - size < M) { page = pdf.addPage([W, H]); y = H - M }
      page.drawText(l, { x: M, y: y - size, size, font })
      y -= size * 1.3
    }
  }
  return pdf.save()
}

async function imagesToPdf(files) {
  const pdf = await PDFDocument.create()
  for (const f of files) {
    let im
    if (f.type === 'image/jpeg') im = await pdf.embedJpg(new Uint8Array(await f.arrayBuffer()))
    else {
      const bmp = await createImageBitmap(f)
      const c = document.createElement('canvas')
      c.width = bmp.width; c.height = bmp.height
      c.getContext('2d').drawImage(bmp, 0, 0)
      const blob = await new Promise(r => c.toBlob(r, 'image/png'))
      im = await pdf.embedPng(new Uint8Array(await blob.arrayBuffer()))
    }
    const h = (im.height * 595) / im.width
    pdf.addPage([595, h]).drawImage(im, { x: 0, y: 0, width: 595, height: h })
  }
  return pdf.save()
}

async function docxToPdf(f) {
  if (!/\.docx$/i.test(f.name)) throw new Error('Only .docx files are supported (not the older .doc)')
  const m = await import('mammoth/mammoth.browser.js')
  const mammoth = m.default || m
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() })
  const dom = new DOMParser().parseFromString(value, 'text/html')
  const sizes = { H1: 22, H2: 18, H3: 15, H4: 13, H5: 12, H6: 12 }
  const blocks = []
  dom.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,tr').forEach(el => {
    if (el.tagName === 'P' && el.closest('li,td,th')) return
    const head = sizes[el.tagName]
    const text = el.tagName === 'TR' ? [...el.cells].map(c => c.textContent.trim()).join(' | ') : (el.tagName === 'LI' ? '- ' : '') + el.textContent
    if (text.trim()) blocks.push({ text, size: head || 11, bold: !!head, gap: head ? 10 : 5 })
  })
  return makePdf(blocks)
}

async function xlsxToPdf(f) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await f.arrayBuffer())
  const blocks = []
  wb.SheetNames.forEach((name, i) => {
    if (i) blocks.push({ pageBreak: true })
    blocks.push({ text: name, size: 12, bold: true, gap: 6 })
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
    const w = []
    rows.forEach(r => r.forEach((c, j) => { w[j] = Math.min(24, Math.max(w[j] || 0, String(c).length)) }))
    rows.forEach(r => blocks.push({ text: r.map((c, j) => String(c).slice(0, 24).padEnd(w[j])).join(' | '), size: 8, gap: 2 }))
  })
  return makePdf(blocks, { mono: true, landscape: true })
}

async function pptxToPdf(f) {
  if (!/\.pptx$/i.test(f.name)) throw new Error('Only .pptx files are supported (not the older .ppt)')
  const Zip = (await import('jszip')).default
  const zip = await Zip.loadAsync(await f.arrayBuffer())
  const num = s => parseInt(s.match(/\d+/g).pop())
  const names = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b))
  const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
  const blocks = []
  for (const [i, n] of names.entries()) {
    if (i) blocks.push({ pageBreak: true })
    blocks.push({ text: 'Slide ' + (i + 1), size: 14, bold: true, gap: 8 })
    const xml = await zip.file(n).async('string')
    for (const p of xml.match(/<a:p[ >][\s\S]*?<\/a:p>/g) || []) {
      const t = dec([...p.matchAll(/<a:t(?: [^>]*)?>([^<]*)<\/a:t>/g)].map(m => m[1]).join(''))
      if (t.trim()) blocks.push({ text: t, size: 12, gap: 5 })
    }
  }
  return makePdf(blocks, { landscape: true })
}

export async function toPdf(kind, files) {
  if (kind === 'image') return imagesToPdf(files)
  if (kind === 'docx') return docxToPdf(files[0])
  if (kind === 'xlsx') return xlsxToPdf(files[0])
  if (kind === 'pptx') return pptxToPdf(files[0])
  throw new Error('This format is not supported yet')
}
