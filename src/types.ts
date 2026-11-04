export type VehicleType = 'car' | 'motorcycle'
export type ClockMode = 'realtime' | 10 | 60 | 300
export type TabId = 'parking' | 'history' | 'profile' | 'offers'

export interface Profile {
  id: 'profile'
  name: string
  email: string
  phone: string
}

export interface Vehicle {
  id: string
  type: VehicleType
  makeModel: string
  plate: string
  nickname: string
  createdAt: number
  updatedAt: number
}

export interface VehicleSnapshot {
  type: VehicleType
  makeModel: string
  plate: string
  nickname: string
}

export interface ParkingSession {
  id: string
  vehicleSnapshot: VehicleSnapshot
  entryAt: number
  clockMode: ClockMode
  elapsedMilliseconds: number
  clockReferenceAt: number
  entryQrToken: string
  exitQrToken: string
}

export interface HistoryEntry {
  id: string
  sessionId: string
  entryAt: number
  exitAt: number
  durationMilliseconds: number
  costCents: number
  vehicleSnapshot: VehicleSnapshot
}

export interface Offer {
  id: string
  storeName: string
  category: string
  title: string
  description: string
  benefit: string
  couponCode: string
  validUntil: string
  conditions: string
  sponsored: boolean
  imageBlob?: Blob
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  id: 'app'
  selectedVehicleId: string | null
  entryQrToken: string
}

export interface AppData {
  profile: Profile
  balanceCents: number
  vehicles: Vehicle[]
  activeSession: ParkingSession | null
  history: HistoryEntry[]
  offers: Offer[]
  settings: AppSettings
}
