import { describe, expect, it } from 'vitest'
import type { HistoryEntry, VehicleSnapshot } from '../../types'
import { summarizeVehicles } from './vehicleStats'

const car: VehicleSnapshot = { type: 'car', makeModel: 'Hatch', plate: 'ABC1', nickname: 'Verde' }
const motorcycle: VehicleSnapshot = { type: 'motorcycle', makeModel: 'Scooter', plate: 'XYZ2', nickname: 'Azul' }
const entry = (id: string, vehicleSnapshot: VehicleSnapshot, costCents: number, durationMilliseconds: number): HistoryEntry => ({
  id,
  sessionId: id,
  entryAt: 0,
  exitAt: durationMilliseconds,
  costCents,
  durationMilliseconds,
  vehicleSnapshot,
})

describe('summarizeVehicles', () => {
  it('aggregates spending, sessions, and duration by category and exact snapshot', () => {
    const result = summarizeVehicles([
      entry('car-1', car, 1000, 60_000),
      entry('car-2', car, 2000, 120_000),
      entry('moto-1', motorcycle, 700, 180_000),
    ])

    expect(result.categories.car).toMatchObject({ spentCents: 3000, sessionCount: 2, parkedMilliseconds: 180_000 })
    expect(result.categories.motorcycle).toMatchObject({ spentCents: 700, sessionCount: 1, parkedMilliseconds: 180_000 })
    expect(result.vehicles).toHaveLength(2)
    expect(result.vehicles.find((vehicle) => vehicle.type === 'car')).toMatchObject({ spentCents: 3000, sessionCount: 2, parkedMilliseconds: 180_000 })
  })

  it('keeps edited snapshots separate instead of guessing vehicle identity', () => {
    const editedCar = { ...car, plate: 'NEW1', nickname: 'Verde novo' }
    const result = summarizeVehicles([entry('before-edit', car, 1000, 60_000), entry('after-edit', editedCar, 2000, 120_000)])

    expect(result.vehicles).toHaveLength(2)
    expect(result.vehicles.map((vehicle) => vehicle.spentCents)).toEqual([2000, 1000])
    expect(result.categories.car).toMatchObject({ spentCents: 3000, sessionCount: 2, parkedMilliseconds: 180_000 })
  })

  it('returns zero-valued category totals for an empty period', () => {
    const result = summarizeVehicles([])
    expect(result.categories.car).toMatchObject({ spentCents: 0, sessionCount: 0, parkedMilliseconds: 0 })
    expect(result.categories.motorcycle).toMatchObject({ spentCents: 0, sessionCount: 0, parkedMilliseconds: 0 })
    expect(result.vehicles).toEqual([])
  })
})
