import type { HistoryEntry } from '../../types'

export type HistoryPeriod = 'all' | 'today' | '7days' | '30days' | 'custom'

export interface HistoryFilterOptions {
  period: HistoryPeriod
  query: string
  order: 'newest' | 'oldest'
  from: string
  to: string
  now?: number
  dateField?: 'entryAt' | 'exitAt'
}

export function filterHistory(entries: HistoryEntry[], options: HistoryFilterOptions): HistoryEntry[] {
  const now = options.now ?? Date.now()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const start = options.period === 'today'
    ? startOfToday.getTime()
    : options.period === '7days'
      ? now - 7 * 24 * 60 * 60 * 1000
      : options.period === '30days'
        ? now - 30 * 24 * 60 * 60 * 1000
        : options.period === 'custom' && options.from
          ? new Date(`${options.from}T00:00:00`).getTime()
          : Number.NEGATIVE_INFINITY
  const end = options.period === 'custom' && options.to
    ? new Date(`${options.to}T23:59:59.999`).getTime()
    : Number.POSITIVE_INFINITY
  const query = options.query.trim().toLocaleLowerCase('pt-BR')
  const dateField = options.dateField ?? 'entryAt'

  return entries
    .filter((entry) => entry[dateField] >= start && entry[dateField] <= end)
    .filter((entry) => {
      const vehicle = entry.vehicleSnapshot
      return !query || `${vehicle.makeModel} ${vehicle.plate} ${vehicle.nickname}`.toLocaleLowerCase('pt-BR').includes(query)
    })
    .sort((a, b) => options.order === 'newest' ? b.entryAt - a.entryAt : a.entryAt - b.entryAt)
}
