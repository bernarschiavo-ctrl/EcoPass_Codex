import type { HistoryEntry } from '../../types'

export const ESTIMATED_TICKET_PAPER_GRAMS = 0.314

export interface EnvironmentalImpact {
  avoidedTicketCount: number
  paperGrams: number
  paperKilograms: number
}

export function summarizeEnvironmentalImpact(entries: HistoryEntry[]): EnvironmentalImpact {
  const avoidedTicketCount = entries.length
  const paperGrams = avoidedTicketCount * ESTIMATED_TICKET_PAPER_GRAMS

  return {
    avoidedTicketCount,
    paperGrams,
    paperKilograms: paperGrams / 1000,
  }
}
