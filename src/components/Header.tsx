import { Leaf } from 'lucide-react'

export function Header() {
  return (
    <header className="app-header">
      <div className="brand-mark"><Leaf size={23} strokeWidth={2.2} aria-hidden="true" /></div>
      <div>
        <p className="brand-name">EcoPass</p>
        <p className="brand-caption">Mobilidade mais simples</p>
      </div>
      <span className="demo-tag">DEMO</span>
    </header>
  )
}
