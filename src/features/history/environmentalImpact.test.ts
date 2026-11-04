import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '../../types'
import { ESTIMATED_TICKET_PAPER_GRAMS, summarizeEnvironmentalImpact } from './environmentalImpact'

const historyEntry = (id: string): HistoryEntry => ({
  id,
  sessionId: id,
  entryAt: 1,
  exitAt: 2,
  durationMilliseconds: 60_000,
  costCents: 1000,
  vehicleSnapshot: { type: 'car', makeModel: 'Compacto', plate: 'ABC1', nickname: '' },
})

describe('summarizeEnvironmentalImpact', () => {
  it('estimates one avoided ticket and its paper mass per completed session', () => {
    expect(summarizeEnvironmentalImpact([historyEntry('one'), historyEntry('two')])).toEqual({
      avoidedTicketCount: 2,
      paperGrams: ESTIMATED_TICKET_PAPER_GRAMS * 2,
      paperKilograms: ESTIMATED_TICKET_PAPER_GRAMS * 2 / 1000,
    })
  })

  it('returns zero totals when the selected period has no completed sessions', () => {
    expect(summarizeEnvironmentalImpact([])).toEqual({
      avoidedTicketCount: 0,
      paperGrams: 0,
      paperKilograms: 0,
    })
  })
})
