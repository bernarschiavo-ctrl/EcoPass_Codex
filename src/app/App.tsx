import { useState } from 'react'
import { BottomNavigation } from '../components/BottomNavigation'
import { Feedback } from '../components/Feedback'
import { Header } from '../components/Header'
import { HistoryScreen } from '../features/history/HistoryScreen'
import { OffersScreen } from '../features/offers/OffersScreen'
import { ParkingScreen } from '../features/parking/ParkingScreen'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { useApp } from './AppContext'
import type { TabId } from '../types'

export function App() {
  const [tab, setTab] = useState<TabId>('parking')
  const { loading, data, error } = useApp()

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Feedback />
        {loading ? (
          <div className="loading-state" role="status"><span className="spinner" /> Carregando seus dados locais…</div>
        ) : error && !data ? (
          <section className="startup-error" role="alert"><h1>Não foi possível abrir o EcoPass</h1><p>{error}</p><p>Verifique se o navegador permite armazenamento local e recarregue a página.</p></section>
        ) : (
          <>
            {tab === 'parking' && <ParkingScreen />}
            {tab === 'history' && <HistoryScreen />}
            {tab === 'profile' && <ProfileScreen />}
            {tab === 'offers' && <OffersScreen />}
          </>
        )}
      </main>
      <BottomNavigation active={tab} onChange={setTab} />
    </div>
  )
}
