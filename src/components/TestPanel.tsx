import { useState } from 'react'
import { ChevronDown, ChevronUp, FlaskConical } from 'lucide-react'

export function TestPanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="test-panel">
      <button className="test-panel__toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="test-panel__title"><FlaskConical size={18} aria-hidden="true" /> Funções de teste</span>
        {open ? <ChevronUp size={19} aria-hidden="true" /> : <ChevronDown size={19} aria-hidden="true" />}
      </button>
      {open && <div className="test-panel__body">{children}</div>}
    </section>
  )
}
