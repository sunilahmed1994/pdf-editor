// c = rang ki category (CSS me .cbtn.word, .excel, .ppt, .pic)
const FROM = [
  ['docx', 'PDF → Word', 'word'], ['xlsx', 'PDF → Excel', 'excel'],
  ['pptx', 'PDF → PowerPoint (editable text)', 'ppt'], ['pptx-img', 'PDF → PowerPoint (page images)', 'ppt'],
  ['png', 'PDF → PNG', 'pic'], ['jpg', 'PDF → JPG', 'pic']
]
const TO = [
  ['docx', 'Word → PDF', '.docx', false, 'word'], ['xlsx', 'Excel → PDF', '.xlsx,.xls,.csv', false, 'excel'],
  ['pptx', 'PowerPoint → PDF', '.pptx', false, 'ppt'], ['image', 'Picture → PDF', 'image/*', true, 'pic']
]

// Convert ke saare buttons. hasDoc=false (pehli screen): "PDF →" buttons PDF chunne ka dialog kholte hain.
export function ConvertPanel({ hasDoc, busy, onFrom, onTo }) {
  const pick = fn => e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) fn(f) }
  return (
    <>
      <h3>Convert from PDF</h3>
      <div className="grid">
        {FROM.map(([k, l, c]) => hasDoc
          ? <button key={k} className={'cbtn ' + c} disabled={busy} onClick={() => onFrom(k)}>{l}</button>
          : (
            <label key={k} className={'cbtn ' + c + (busy ? ' off' : '')}>{l}
              <input type="file" hidden accept="application/pdf" disabled={busy} onChange={pick(f => onFrom(k, f[0]))} />
            </label>
          ))}
      </div>
      <h3>Convert to PDF</h3>
      <div className="grid">
        {TO.map(([k, l, acc, multi, c]) => (
          <label key={k} className={'cbtn ' + c + (busy ? ' off' : '')}>{l}
            <input type="file" hidden accept={acc} multiple={multi} disabled={busy} onChange={pick(f => onTo(k, f))} />
          </label>
        ))}
      </div>
      <p className="muted">{busy ? 'Converting, please wait...' : 'Conversion is text-based, so layout and formatting may not be preserved exactly.'}</p>
    </>
  )
}

export default function ConvertDialog({ open, busy, onFrom, onTo, onClose }) {
  if (!open) return null
  return (
    <div className="modal" onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()}>
        <h2>Convert</h2>
        <ConvertPanel hasDoc busy={busy} onFrom={onFrom} onTo={onTo} />
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
