import type { HistoryEntry, VehicleType } from '../../types'

export type VehicleCategoryStats = Record<VehicleType, VehicleStats>

export interface VehicleStats {
  key: string
  type: VehicleType
  label: string
  detail: string
  spentCents: number
  sessionCount: number
  parkedMilliseconds: number
}

export function summarizeVehicles(entries: HistoryEntry[]): {
  categories: VehicleCategoryStats
  vehicles: VehicleStats[]
} {
  const emptyCategory = (type: VehicleType): VehicleStats => ({
    key: type,
    type,
    label: type === 'car' ? 'Carros' : 'Motos',
    detail: '',
    spentCents: 0,
    sessionCount: 0,
    parkedMilliseconds: 0,
  })
  const categories: VehicleCategoryStats = {
    car: emptyCategory('car'),
    motorcycle: emptyCategory('motorcycle'),
  }
  const vehicles = new Map<string, VehicleStats>()

  for (const entry of entries) {
    const snapshot = entry.vehicleSnapshot
    const category = categories[snapshot.type]
    category.spentCents += entry.costCents
    category.sessionCount += 1
    category.parkedMilliseconds += entry.durationMilliseconds

    // The history only stores a snapshot, not a stable vehicle ID. Group exact snapshots
    // so edits to a vehicle's plate, model, or nickname cannot merge distinct records.
    const key = JSON.stringify([snapshot.type, snapshot.plate, snapshot.makeModel, snapshot.nickname])
    const label = snapshot.nickname.trim() || snapshot.makeModel.trim() || 'Veículo'
    const detail = [snapshot.makeModel, snapshot.plate].filter(Boolean).join(' · ')
    const stats = vehicles.get(key) ?? {
      key,
      type: snapshot.type,
      label,
      detail,
      spentCents: 0,
      sessionCount: 0,
      parkedMilliseconds: 0,
    }
    stats.spentCents += entry.costCents
    stats.sessionCount += 1
    stats.parkedMilliseconds += entry.durationMilliseconds
    vehicles.set(key, stats)
  }

  return {
    categories,
    vehicles: [...vehicles.values()].sort((a, b) => b.spentCents - a.spentCents || a.label.localeCompare(b.label, 'pt-BR')),
  }
}
