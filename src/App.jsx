import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import PageView from './PageView.jsx'
import ConvertDialog from './ConvertDialog.jsx'
import Home from './Home.jsx'
import * as T from './tools.js'
import * as C from './convert.js'
import './styles.css'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const SCALE = 1.3
const uid = () => Math.random().toString(36).slice(2, 9)
const hex = h => rgb(...[1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255))
const save = (blob, name) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export default function App() {
  const [file, setFile] = useState(null)   // { name, bytes }
  const [doc, setDoc] = useState(null)     // pdf.js document
  const [objs, setObjs] = useState([])     // added text/images
  const [past, setPast] = useState([])     // undo history
  const [future, setFuture] = useState([]) // redo history
  const [sel, setSel] = useState(null)
  const [page, setPage] = useState(0)      // active page
  const [busy, setBusy] = useState(false)
  const [editMode, setEditMode] = useState(false) // maujooda text edit mode
  const [convOpen, setConvOpen] = useState(false)
  const [path, setPath] = useState(window.location.pathname) // page ka URL (/merge-pdf wagera)
  const navigate = p => { window.history.pushState(null, '', p); setPath(p); window.scrollTo(0, 0) }
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const imgInput = useRef()
  const objsRef = useRef(objs)
  objsRef.current = objs

  const snap = () => { setPast(p => [...p, objsRef.current]); setFuture([]) }
  const change = (id, patch) => setObjs(os => os.map(o => (o.id === id ? { ...o, ...patch } : o)))
  const add = o => { snap(); setObjs(os => [...os, o]); setSel(o.id) }
  const drop = id => { snap(); setObjs(os => os.filter(o => o.id !== id)); setSel(null) }
  const remove = () => {
    const o = objsRef.current.find(x => x.id === sel)
    if (!o) return
    if (o.type === 'edit') { snap(); change(o.id, { text: '' }) } else drop(o.id)
  }
  const undo = () => {
    if (!past.length) return
    setFuture(f => [objs, ...f]); setObjs(past[past.length - 1]); setPast(past.slice(0, -1)); setSel(null)
  }
  const redo = () => {
    if (!future.length) return
    setPast(p => [...p, objs]); setObjs(future[0]); setFuture(future.slice(1)); setSel(null)
  }

  useEffect(() => {
    const onKey = e => {
      if (['TEXTAREA', 'INPUT'].includes(e.target.tagName)) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
      else if (e.key === 'Delete' || e.key === 'Backspace') remove()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const run = async fn => {
    setBusy(true)
    try { await fn() } catch (e) { alert('Something went wrong: ' + e.message) }
    setBusy(false)
  }

  const loadBytes = async (bytes, name) => {
    const d = await pdfjs.getDocument({ data: bytes.slice() }).promise
    setFile({ name, bytes }); setDoc(d)
    setObjs([]); setPast([]); setFuture([]); setSel(null); setPage(0)
  }
  const openFile = f => run(async () => { if (f) await loadBytes(new Uint8Array(await f.arrayBuffer()), f.name) })

  const addText = () => add({ id: uid(), page, type: 'text', x: 60, y: 60, text: 'Your text here', size: 18, color: '#000000' })

  // Purane text par click: usay edit object bana deta hai (text mitane ke liye khali kar den)
  const pickText = (pg, it) => {
    const ex = objsRef.current.find(o => o.key === it.key)
    if (ex) { setSel(ex.id); return }
    add({ id: uid(), page: pg, type: 'edit', key: it.key, x: it.x, y: it.y, w: it.w, h: it.h, size: it.size,
          text: it.str, color: '#000000', bg: '#ffffff' })
  }

  const addImage = f => run(async () => {
    if (!f) return
    const url = URL.createObjectURL(f)
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
    const c = document.createElement('canvas')
    c.width = im.naturalWidth; c.height = im.naturalHeight
    c.getContext('2d').drawImage(im, 0, 0)
    URL.revokeObjectURL(url)
    const w = Math.min(200, im.naturalWidth)
    add({ id: uid(), page, type: 'image', x: 60, y: 60, w, h: (w * im.naturalHeight) / im.naturalWidth, src: c.toDataURL('image/png') })
  })

  // Original PDF + added objects ko mila kar nayi PDF banata hai
  async function buildPdf() {
    const pdf = await PDFDocument.load(file.bytes)
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const ordered = [...objs.filter(o => o.type === 'edit'), ...objs.filter(o => o.type !== 'edit')]
    for (const o of ordered) {
      const pg = pdf.getPage(o.page)
      const H = pg.getHeight()
      if (o.type === 'edit') {
        // purane text par rang ka dabba (whiteout) aur uske upar naya text
        pg.drawRectangle({ x: o.x, y: H - o.y - o.h, width: o.w, height: o.h, color: hex(o.bg) })
        o.text.split('\n').forEach((line, i) => line && pg.drawText(line,
          { x: o.x + 1, y: H - o.y - o.size * 0.9 - i * o.size * 1.15, size: o.size, font, color: hex(o.color) }))
      } else if (o.type === 'text') {
        o.text.split('\n').forEach((line, i) =>
          pg.drawText(line, { x: o.x, y: H - o.y - o.size * 0.98 - i * o.size * 1.15, size: o.size, font, color: hex(o.color) }))
      } else {
        const im = await pdf.embedPng(o.src)
        pg.drawImage(im, { x: o.x, y: H - o.y - o.h, width: o.w, height: o.h })
      }
    }
    return pdf.save()
  }

  const base = () => file.name.replace(/\.pdf$/i, '')

  const download = () => run(async () => {
    const bytes = await buildPdf()
    save(new Blob([bytes], { type: 'application/pdf' }), base() + '-edited.pdf')
  })

  // PDF se Word/Excel/PowerPoint/Picture (edit shuda PDF se)
  // f di ho (pehli screen) to wahi PDF seedha convert hokar download hoti hai
  const exportAs = (kind, f) => run(async () => {
    if (f) {
      const o = await C.fromPdf(kind, new Uint8Array(await f.arrayBuffer()), [])
      save(o.blob, `${f.name.replace(/\.pdf$/i, '')}.${o.ext}`)
      return
    }
    const out = await C.fromPdf(kind, await buildPdf(), objs.filter(o => o.type === 'edit'))
    save(out.blob, `${base()}.${out.ext}`)
  })

  // Word/Excel/PowerPoint/Picture se PDF banakar editor me khol deta hai
  const importAs = (kind, files) => run(async () => {
    const bytes = await C.toPdf(kind, files)
    await loadBytes(bytes, files[0].name.replace(/\.[^.]+$/, '') + '.pdf')
    setConvOpen(false)
  })

  // Merge/Split/Rotate wagera tools
  const runTool = (id, files, opts) => run(async () => {
    const out = await T.runTool(id, files, opts)
    save(out.blob, out.name)
  })

  const cur = objs.find(o => o.id === sel)

  const dialog = <ConvertDialog open={convOpen} busy={busy} onFrom={exportAs} onTo={importAs} onClose={() => setConvOpen(false)} />

  if (!doc) return <Home busy={busy} path={path} navigate={navigate} onEdit={openFile} onFrom={exportAs} onTo={importAs} onTool={runTool} />

  return (
    <div className="app">
      <header className="bar">
        <button className="btn" onClick={() => { if (objs.length && !confirm('Your edits will be lost. Go back to Home?')) return; setDoc(null); setFile(null); setObjs([]); setPast([]); setFuture([]); setSel(null) }}>← Home</button>
        <button className="btn" onClick={undo} disabled={!past.length}>Undo</button>
        <button className="btn" onClick={redo} disabled={!future.length}>Redo</button>
        <span className="sep" />
        <button className="btn" onClick={addText}>Add text</button>
        <button className="btn" onClick={() => imgInput.current.click()}>Add image</button>
        <input ref={imgInput} type="file" accept="image/*" hidden onChange={e => { addImage(e.target.files[0]); e.target.value = '' }} />
        <button className={'btn' + (editMode ? ' on' : '')} onClick={() => setEditMode(m => !m)}>Edit existing text</button>
        <button className="btn danger" onClick={remove} disabled={!sel}>Delete</button>
        <span className="sep" />
        <button className="btn" onClick={() => setConvOpen(true)}>Convert</button>
        <span className="grow" />
        <label className="btn">New file<input type="file" accept="application/pdf" hidden onChange={e => openFile(e.target.files[0])} /></label>
        <button className="btn primary" onClick={download} disabled={busy}>{busy ? 'Please wait...' : 'Download PDF'}</button>
      </header>
      <div className="body">
        <main className="pages">
          {Array.from({ length: doc.numPages }, (_, i) => (
            <PageView key={i} doc={doc} index={i} scale={SCALE} objs={objs.filter(o => o.page === i)}
                      sel={sel} setSel={setSel} snap={snap} change={change} active={page === i} setActive={setPage} editMode={editMode} onPick={pickText} />
          ))}
        </main>
        <aside className="side">
          {cur?.type === 'text' || cur?.type === 'edit' ? (
            <>
              <label>Text<textarea rows={4} value={cur.text} onFocus={snap} onChange={e => change(cur.id, { text: e.target.value })} /></label>
              <label>Size<input type="number" min="6" max="120" value={cur.size} onFocus={snap} onChange={e => change(cur.id, { size: +e.target.value || 12 })} /></label>
              <label>Color<input type="color" value={cur.color} onFocus={snap} onChange={e => change(cur.id, { color: e.target.value })} /></label>
              {cur.type === 'edit' && (
                <>
                  <label>Background color<input type="color" value={cur.bg} onFocus={snap} onChange={e => change(cur.id, { bg: e.target.value })} /></label>
                  <button className="btn danger" onClick={remove}>Delete this text</button>
                  <button className="btn" onClick={() => drop(cur.id)}>Restore original</button>
                </>
              )}
            </>
          ) : (
            <p>{cur ? 'Drag the image to move it, drag the corner handle to resize it.' : `Page ${page + 1} is active. New text and images are added to it. To change existing text, turn on 'Edit existing text' and click on it.`}</p>
          )}
        </aside>
      </div>
      {dialog}
    </div>
  )
}
