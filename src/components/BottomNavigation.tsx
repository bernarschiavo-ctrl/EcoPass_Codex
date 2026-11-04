import { CarFront, Clock3, Gift, UserRound } from 'lucide-react'
import type { TabId } from '../types'

const tabs: { id: TabId; label: string; Icon: typeof CarFront }[] = [
  { id: 'parking', label: 'Estacionar', Icon: CarFront },
  { id: 'history', label: 'Histórico', Icon: Clock3 },
  { id: 'profile', label: 'Perfil', Icon: UserRound },
  { id: 'offers', label: 'Ofertas', Icon: Gift },
]

export function BottomNavigation({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`bottom-nav__item ${active === id ? 'is-active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={21} strokeWidth={active === id ? 2.4 : 1.8} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
