import { useRef, useState } from 'react'
import { CATS, CATC, TOOLS } from './catalog.js'
import ToolDialog from './ToolDialog.jsx'

export default function Home({ busy, onEdit, onFrom, onTo, onTool }) {
  const [cat, setCat] = useState('all')
  const [tool, setTool] = useState(null)
  const input = useRef()
  const pending = useRef(null)
  const shown = TOOLS.filter(t => cat === 'all' || t.cat === cat)

  const click = t => {
    if (!t.ready || busy) return
    if (t.kind === 'tool') return setTool(t)
    pending.current = t
    input.current.accept = t.accept
    input.current.multiple = !!t.multi
    input.current.click()
  }
  const picked = e => {
    const f = [...e.target.files]
    e.target.value = ''
    const t = pending.current
    if (!f.length || !t) return
    if (t.kind === 'edit') onEdit(f[0])
    else if (t.kind === 'from') onFrom(t.key, f[0])
    else onTo(t.key, f)
  }
  const go = id => click(TOOLS.find(t => t.id === id))

  return (
    <div className="home" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) onEdit(e.dataTransfer.files[0]) }}>
      <nav className="nav">
        <span className="logo">PDF Editor</span>
        <button onClick={() => go('merge')}>Merge PDF</button>
        <button onClick={() => go('split')}>Split PDF</button>
        <button onClick={() => go('edit')}>Edit PDF</button>
        <button onClick={() => setCat('convert')}>Convert PDF</button>
        <button onClick={() => setCat('all')}>All tools</button>
        <span className="grow" />
        <span className="free">100% free · no login required</span>
      </nav>
      <header className="hero">
        <h1>Every PDF tool, in one place</h1>
        <p>Merge, split, edit, convert and more. No login needed, and your files never leave your browser. You can also drag a PDF here to start editing right away.</p>
      </header>
      <div className="tabs">
        {CATS.map(([id, label]) => <button key={id} className={'tab' + (cat === id ? ' on' : '')} onClick={() => setCat(id)}>{label}</button>)}
      </div>
      <main className="tools">
        {shown.map(t => (
          <button key={t.id} className={'tool' + (t.ready ? '' : ' soon')} onClick={() => click(t)} disabled={busy && t.ready}>
            <span className="ico" style={{ background: CATC[t.cat] }}>{t.icon}</span>
            <strong>{t.title}</strong>
            <span className="d">{t.desc}</span>
            {!t.ready && <em className="badge soon">Coming soon</em>}
          </button>
        ))}
      </main>
      <input ref={input} type="file" hidden onChange={picked} />
      {busy && <div className="toast">Working, please wait...</div>}
      {tool && <ToolDialog key={tool.id} tool={tool} busy={busy} onRun={onTool} onClose={() => setTool(null)} />}
      <footer className="foot">All files are processed in your browser and are never uploaded to a server.</footer>
    </div>
  )
}
