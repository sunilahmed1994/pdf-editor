import { useState } from 'react'

const F = {
  merge: [],
  split: [
    { k: 'mode', label: 'Mode', def: 'every', opts: [['every', 'Every page as a separate file'], ['ranges', 'Page ranges (each range as a separate file)']] },
    { k: 'ranges', label: 'Ranges (e.g. 1-3, 5, 8-)', ph: '1-3, 5, 8-', when: o => o.mode === 'ranges' }
  ],
  remove: [{ k: 'ranges', label: 'Pages to delete (e.g. 1, 3-5)', ph: '1, 3-5' }],
  extract: [{ k: 'ranges', label: 'Pages to keep (e.g. 1-3, 7)', ph: '1-3, 7' }],
  rotate: [
    { k: 'angle', label: 'Rotation', def: 90, opts: [[90, '90° clockwise'], [180, '180°'], [270, '90° counter-clockwise']] },
    { k: 'ranges', label: 'Pages (leave empty for all)', ph: 'leave empty for all pages' }
  ],
  numbers: [
    { k: 'pos', label: 'Position', def: 'bc', opts: [['bc', 'Bottom center'], ['br', 'Bottom right'], ['bl', 'Bottom left'], ['tc', 'Top center']] },
    { k: 'start', label: 'Starting number', type: 'number', def: 1 }
  ],
  watermark: [
    { k: 'text', label: 'Watermark text', ph: 'CONFIDENTIAL', def: 'CONFIDENTIAL' },
    { k: 'size', label: 'Size', type: 'number', def: 60 },
    { k: 'opacity', label: 'Opacity', def: 0.3, opts: [[0.15, 'Very light'], [0.3, 'Light'], [0.5, 'Strong']] }
  ]
}

export default function ToolDialog({ tool, busy, onRun, onClose, inline }) {
  const fields = F[tool.id] || []
  const [files, setFiles] = useState([])
  const [o, setO] = useState(() => Object.fromEntries(fields.map(f => [f.k, f.def ?? ''])))
  const merge = tool.id === 'merge'
  const ok = merge ? files.length >= 2 : files.length >= 1
  const go = async () => { await onRun(tool.id, files, o); if (!inline) onClose() }
  const wrap = kids => inline
    ? <div className="card inline">{kids}</div>
    : <div className="modal" onClick={busy ? undefined : onClose}><div className="card" onClick={e => e.stopPropagation()}>{kids}</div></div>
  return wrap(
      <>
        {!inline && <><h2>{tool.title}</h2><p className="muted">{tool.desc}</p></>}
        <label className="btn">{merge ? 'Add PDF files' : files.length ? 'Choose again' : 'Choose PDF'}
          <input type="file" hidden accept="application/pdf" multiple={merge}
                 onChange={e => { const n = [...e.target.files]; e.target.value = ''; setFiles(merge ? [...files, ...n] : n) }} />
        </label>
        {!!files.length && <div className="files">{files.map((f, i) => `${i + 1}. ${f.name}`).join('  |  ')}</div>}
        {merge && <p className="muted">Files are merged in the order you added them.</p>}
        {fields.filter(f => !f.when || f.when(o)).map(f => (
          <label key={f.k} className="field">{f.label}
            {f.opts
              ? <select value={o[f.k]} onChange={e => setO({ ...o, [f.k]: typeof f.def === 'number' ? Number(e.target.value) : e.target.value })}>
                  {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              : <input type={f.type || 'text'} placeholder={f.ph} value={o[f.k]} onChange={e => setO({ ...o, [f.k]: e.target.value })} />}
          </label>
        ))}
        <div className="row">
          {!inline && <button className="btn" onClick={onClose} disabled={busy}>Close</button>}
          <button className="btn primary" onClick={go} disabled={!ok || busy}>{busy ? 'Please wait...' : 'Start'}</button>
        </div>
      </>
  )
}
