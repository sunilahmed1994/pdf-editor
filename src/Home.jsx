import { useEffect, useRef, useState } from 'react'
import { CATS, CATC, TOOLS } from './catalog.js'
import { PAGES, HOME, pageMeta } from './seo.js'
import ToolDialog from './ToolDialog.jsx'

const slugOf = id => PAGES.find(p => p.id === id)?.slug

export default function Home({ busy, path, navigate, onEdit, onFrom, onTo, onTool }) {
  const [cat, setCat] = useState('all')
  const input = useRef()
  const pending = useRef(null)
  const slug = path.replace(/^\/|\/$/g, '')
  const page = PAGES.find(p => p.slug === slug)
  const tool = page && TOOLS.find(t => t.id === page.id)
  const meta = page ? pageMeta(page) : HOME
  const shown = TOOLS.filter(t => cat === 'all' || t.cat === cat)

  useEffect(() => {
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
  }, [meta.title])

  const go = (e, p, after) => { e.preventDefault(); navigate(p); after?.() }
  const pickFile = t => {
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

  return (
    <div className="home" onDragOver={e => e.preventDefault()}
         onDrop={e => { e.preventDefault(); if (!page && e.dataTransfer.files[0]) onEdit(e.dataTransfer.files[0]) }}>
      <nav className="nav">
        <a className="logo" href="/" onClick={e => go(e, '/')}>PDF Editor</a>
        <a href="/merge-pdf" onClick={e => go(e, '/merge-pdf')}>Merge PDF</a>
        <a href="/split-pdf" onClick={e => go(e, '/split-pdf')}>Split PDF</a>
        <a href="/edit-pdf" onClick={e => go(e, '/edit-pdf')}>Edit PDF</a>
        <a href="/" onClick={e => go(e, '/', () => setCat('convert'))}>Convert PDF</a>
        <a href="/" onClick={e => go(e, '/', () => setCat('all'))}>All tools</a>
        <span className="grow" />
        <span className="free">100% free · no login required</span>
      </nav>

      {page ? (
        <main className="page-wrap">
          <h1>{meta.h1}</h1>
          <p className="lead">{meta.intro}</p>
          <div className="toolbox">
            {tool.kind === 'tool'
              ? <ToolDialog key={tool.id} inline tool={tool} busy={busy} onRun={onTool} onClose={() => navigate('/')} />
              : <button className="btn primary big" onClick={() => pickFile(tool)} disabled={busy}>{tool.multi ? 'Choose images' : tool.kind === 'to' ? 'Choose file' : 'Choose PDF file'}</button>}
          </div>
          <h2>How to use {page.name}</h2>
          <ol>{meta.steps.map(s => <li key={s}>{s}</li>)}</ol>
          <h2>Frequently asked questions</h2>
          {meta.faq.map(([q, a]) => <div key={q}><h3>{q}</h3><p>{a}</p></div>)}
        </main>
      ) : (
        <>
          <header className="hero">
            <h1>{HOME.h1}</h1>
            <p>{HOME.intro} You can also drag a PDF here to start editing right away.</p>
          </header>
          <div className="tabs">
            {CATS.map(([id, label]) => <button key={id} className={'tab' + (cat === id ? ' on' : '')} onClick={() => setCat(id)}>{label}</button>)}
          </div>
          <main className="tools">
            {shown.map(t => {
              const inner = (
                <>
                  <span className="ico" style={{ background: CATC[t.cat] }}>{t.icon}</span>
                  <strong>{t.title}</strong>
                  <span className="d">{t.desc}</span>
                  {!t.ready && <em className="badge soon">Coming soon</em>}
                </>
              )
              const s = slugOf(t.id)
              return t.ready && s
                ? <a key={t.id} className="tool" href={'/' + s} onClick={e => go(e, '/' + s)}>{inner}</a>
                : <div key={t.id} className="tool soon">{inner}</div>
            })}
          </main>
        </>
      )}

      <input ref={input} type="file" hidden onChange={picked} />
      {busy && <div className="toast">Working, please wait...</div>}
      <footer className="foot">
        <div className="flinks">{PAGES.map(p => <a key={p.slug} href={'/' + p.slug} onClick={e => go(e, '/' + p.slug)}>{p.name}</a>)}</div>
        All files are processed in your browser and are never uploaded to a server.
      </footer>
    </div>
  )
}
