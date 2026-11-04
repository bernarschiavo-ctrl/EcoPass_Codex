import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as db from '../data/db'
import type { AppData, ClockMode, Offer, Profile, Vehicle, VehicleType } from '../types'

interface AppContextValue {
  data: AppData | null
  loading: boolean
  now: number
  busy: boolean
  error: string
  notice: string
  dismissMessage: () => void
  refresh: () => Promise<void>
  perform: (action: () => Promise<unknown>, successMessage?: string) => Promise<boolean>
  updateProfile: (profile: Profile) => Promise<boolean>
  saveVehicle: (input: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<boolean>
  deleteVehicle: (id: string) => Promise<boolean>
  selectVehicle: (id: string) => Promise<boolean>
  changeBalance: (deltaCents: number, successMessage: string) => Promise<boolean>
  startParking: () => Promise<boolean>
  setClockMode: (mode: ClockMode) => Promise<boolean>
  advanceClock: (seconds: number) => Promise<boolean>
  finishParking: () => Promise<boolean>
  saveOffer: (offer: Offer) => Promise<boolean>
  deleteOffer: (id: string) => Promise<boolean>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const lock = useRef(false)

  const refresh = useCallback(async () => {
    const loaded = await db.loadAppData()
    setData(loaded)
  }, [])

  useEffect(() => {
    let mounted = true
    db.loadAppData()
      .then((loaded) => {
        if (mounted) setData(loaded)
      })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os dados locais.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const dismissMessage = useCallback(() => {
    setError('')
    setNotice('')
  }, [])

  const perform = useCallback(async (action: () => Promise<unknown>, successMessage?: string): Promise<boolean> => {
    if (lock.current) return false
    lock.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'A operação não foi concluída. Tente novamente.')
      lock.current = false
      setBusy(false)
      return false
    }
    try {
      await refresh()
    } catch (reason) {
      const details = reason instanceof Error ? reason.message : 'falha ao atualizar os dados locais'
      setError(`A operação foi salva, mas a tela não pôde ser atualizada (${details}). Recarregue a página antes de continuar.`)
      lock.current = false
      setBusy(false)
      return true
    }
    setNow(Date.now())
    if (successMessage) setNotice(successMessage)
    lock.current = false
    setBusy(false)
    return true
  }, [refresh])

  const value = useMemo<AppContextValue>(() => ({
    data,
    loading,
    now,
    busy,
    error,
    notice,
    dismissMessage,
    refresh,
    perform,
    updateProfile: (profile) => perform(() => db.saveProfile(profile), 'Perfil salvo.'),
    saveVehicle: (input, id) => {
      const timestamp = Date.now()
      const existing = data?.vehicles.find((vehicle) => vehicle.id === id)
      const vehicle: Vehicle = {
        ...input,
        id: id ?? crypto.randomUUID(),
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      }
      return perform(() => db.saveVehicle(vehicle), id ? 'Veículo atualizado.' : 'Veículo cadastrado.')
    },
    deleteVehicle: (id) => perform(() => db.deleteVehicle(id), 'Veículo removido.'),
    selectVehicle: (id) => perform(() => db.selectVehicle(id), 'Veículo selecionado.'),
    changeBalance: (delta, message) => perform(() => db.changeBalance(delta), message),
    startParking: () => {
      const token = data?.settings.entryQrToken
      return token
        ? perform(() => db.startParking(token), 'Entrada simulada. Estacionamento iniciado.')
        : perform(() => Promise.reject(new Error('O QR de entrada ainda não está disponível.')))
    },
    setClockMode: (mode) => perform(() => db.setClockMode(mode)),
    advanceClock: (seconds) => perform(() => db.advanceClock(seconds), 'Tempo de demonstração avançado.'),
    finishParking: async () => {
      const token = data?.activeSession?.exitQrToken
      return token
        ? perform(() => db.payAndFinish(token), 'Pagamento simulado aprovado. Estacionamento finalizado.')
        : perform(() => Promise.reject(new Error('Não há QR de saída ativo para esta sessão.')))
    },
    saveOffer: (offer) => perform(() => db.saveOffer(offer), 'Oferta salva e publicada na lista.'),
    deleteOffer: (id) => perform(() => db.deleteOffer(id), 'Oferta excluída.'),
  }), [data, loading, now, busy, error, notice, dismissMessage, refresh, perform])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp deve ser usado dentro de AppProvider.')
  return context
}

export function vehicleTypeLabel(type: VehicleType): string {
  return type === 'car' ? 'Carro' : 'Moto'
}
