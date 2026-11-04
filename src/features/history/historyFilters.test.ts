import { describe, expect, it } from 'vitest'
import { filterHistory } from './historyFilters'
import type { HistoryEntry } from '../../types'

const now = new Date(2026, 0, 15, 12).getTime()
const entries: HistoryEntry[] = [
  { id: 'today', sessionId: 'today', entryAt: now - 60_000, exitAt: now, durationMilliseconds: 60_000, costCents: 0, vehicleSnapshot: { type: 'car', makeModel: 'Compact', plate: 'ABC1', nickname: '' } },
  { id: 'week', sessionId: 'week', entryAt: now - 3 * 24 * 60 * 60 * 1000, exitAt: now, durationMilliseconds: 60_000, costCents: 0, vehicleSnapshot: { type: 'motorcycle', makeModel: 'Scooter', plate: 'XYZ2', nickname: 'Minha moto' } },
  { id: 'old', sessionId: 'old', entryAt: now - 40 * 24 * 60 * 60 * 1000, exitAt: now, durationMilliseconds: 60_000, costCents: 0, vehicleSnapshot: { type: 'car', makeModel: 'Compact', plate: 'OLD3', nickname: '' } },
]

describe('filterHistory', () => {
  it('combines period and vehicle search, and sorts by requested direction', () => {
    expect(filterHistory(entries, { period: '7days', query: 'scooter', order: 'newest', from: '', to: '', now }).map((entry) => entry.id)).toEqual(['week'])
    expect(filterHistory(entries, { period: 'all', query: '', order: 'oldest', from: '', to: '', now }).map((entry) => entry.id)).toEqual(['old', 'week', 'today'])
  })

  it('uses the local calendar day for the today filter', () => {
    expect(filterHistory(entries, { period: 'today', query: '', order: 'newest', from: '', to: '', now }).map((entry) => entry.id)).toEqual(['today'])
  })

  it('can filter environmental metrics by completion time without changing the default entry-time filter', () => {
    const crossedPeriod = { ...entries[0], id: 'crossed', entryAt: now - 8 * 24 * 60 * 60 * 1000, exitAt: now - 60_000 }
    const input = [crossedPeriod]
    const options = { period: '7days' as const, query: '', order: 'newest' as const, from: '', to: '', now }

    expect(filterHistory(input, options)).toHaveLength(0)
    expect(filterHistory(input, { ...options, dateField: 'exitAt' }).map((entry) => entry.id)).toEqual(['crossed'])
  })
})
