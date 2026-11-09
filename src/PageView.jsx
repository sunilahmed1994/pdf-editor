// Ek PDF page dikhata hai (canvas) aur uske upar text/image objects (overlay).
import { useEffect, useRef, useState } from 'react'

export default function PageView({ doc, index, scale, objs, sel, setSel, snap, change, active, setActive, editMode, onPick }) {
  const canvas = useRef()
  const drag = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [items, setItems] = useState([]) // existing PDF text (boxes)

  useEffect(() => {
    let task, dead = false
    doc.getPage(index + 1).then(p => {
      if (dead) return
      const r = window.devicePixelRatio || 1
      const vp = p.getViewport({ scale })
      const c = canvas.current
      c.width = vp.width * r
      c.height = vp.height * r
      setSize({ w: vp.width, h: vp.height })
      task = p.render({ canvasContext: c.getContext('2d'), viewport: p.getViewport({ scale: scale * r }) })
      task.promise.catch(() => {})
    })
    return () => { dead = true; task?.cancel() }
  }, [doc, index, scale])

  // Edit mode me page ka asli text dhoondta hai
  useEffect(() => {
    if (!editMode || items.length) return
    let dead = false
    doc.getPage(index + 1).then(async p => {
      const vp = p.getViewport({ scale: 1 })
      const t = await p.getTextContent()
      if (dead) return
      setItems(t.items.filter(s => s.str.trim() && Math.abs(s.transform[1]) < 0.01).map(s => {
        const [x, y] = vp.convertToViewportPoint(s.transform[4], s.transform[5])
        const size = Math.hypot(s.transform[0], s.transform[1])
        return { key: `${index}:${Math.round(x)}:${Math.round(y)}:${s.str}`, str: s.str, size, x: x - 1, y: y - size * 0.9, w: s.width + 2, h: size * 1.15 }
      }))
    })
    return () => { dead = true }
  }, [editMode, doc, index])

  const down = (e, o, mode) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSel(o.id)
    setActive(index)
    drag.current = { id: o.id, mode, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y, ow: o.w, oh: o.h, snapped: false }
  }
  const move = e => {
    const d = drag.current
    if (!d) return
    if (!d.snapped) { snap(); d.snapped = true } // save a history snapshot on the first move so it can be undone
    const dx = (e.clientX - d.sx) / scale
    const dy = (e.clientY - d.sy) / scale
    change(d.id, d.mode === 'move'
      ? { x: d.ox + dx, y: d.oy + dy }
      : { w: Math.max(20, d.ow + dx), h: Math.max(20, d.oh + dy) })
  }
  const up = () => { drag.current = null }

  return (
    <div className={'page' + (active ? ' active' : '')} style={{ width: size.w, height: size.h }}
         onPointerDown={() => { setSel(null); setActive(index) }}>
      <canvas ref={canvas} style={{ width: size.w, height: size.h }} />
      {editMode && items.filter(it => !objs.some(o => o.key === it.key)).map(it => (
        <div key={it.key} className="hit"
             style={{ left: it.x * scale, top: it.y * scale, width: it.w * scale, height: it.h * scale }}
             onPointerDown={e => { e.stopPropagation(); onPick(index, it) }} />
      ))}
      {objs.map(o => {
        const on = sel === o.id
        const pos = { left: o.x * scale, top: o.y * scale }
        const handlers = { onPointerMove: move, onPointerUp: up }
        if (o.type === 'edit') {
          return (
            <div key={o.id} className={'obj edit' + (on ? ' sel' : '')}
                 style={{ left: o.x * scale, top: o.y * scale, width: o.w * scale, height: o.h * scale,
                          fontSize: o.size * scale, lineHeight: `${o.h * scale}px`, color: o.color, background: o.bg }}
                 onPointerDown={e => { e.stopPropagation(); setSel(o.id); setActive(index) }}>{o.text}</div>
          )
        }
        if (o.type === 'text') {
          return (
            <div key={o.id} className={'obj text' + (on ? ' sel' : '')}
                 style={{ ...pos, fontSize: o.size * scale, color: o.color }}
                 onPointerDown={e => down(e, o, 'move')} {...handlers}>{o.text}</div>
          )
        }
        return (
          <div key={o.id} className={'obj img' + (on ? ' sel' : '')}
               style={{ ...pos, width: o.w * scale, height: o.h * scale }}
               onPointerDown={e => down(e, o, 'move')} {...handlers}>
            <img src={o.src} alt="" draggable={false} />
            {on && <span className="handle" onPointerDown={e => down(e, o, 'resize')} {...handlers} />}
          </div>
        )
      })}
    </div>
  )
}
