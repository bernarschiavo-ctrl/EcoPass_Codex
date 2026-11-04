import type { VehicleType } from '../../types'

export const FREE_DURATION_MILLISECONDS = 10 * 60 * 1000
export const HOUR_MILLISECONDS = 60 * 60 * 1000

export interface ParkingClockState {
  elapsedMilliseconds: number
  clockReferenceAt: number
  clockMode: 'realtime' | 10 | 60 | 300
}

export function calculateParkingCostCents(type: VehicleType, elapsedMilliseconds: number): number {
  const billableMilliseconds = Math.max(0, elapsedMilliseconds - FREE_DURATION_MILLISECONDS)
  const startedHours = Math.ceil(billableMilliseconds / HOUR_MILLISECONDS)
  return startedHours * (type === 'car' ? 1000 : 700)
}

export function elapsedSessionMilliseconds(session: ParkingClockState, now: number): number {
  const rate = session.clockMode === 'realtime' ? 1 : session.clockMode
  const elapsedWallMilliseconds = Math.max(0, now - session.clockReferenceAt)
  return session.elapsedMilliseconds + elapsedWallMilliseconds * rate
}

export function rebaseParkingClock(
  session: ParkingClockState,
  now: number,
  clockMode = session.clockMode,
): ParkingClockState {
  const clockReferenceAt = Math.max(now, session.clockReferenceAt)
  return {
    elapsedMilliseconds: elapsedSessionMilliseconds(session, clockReferenceAt),
    clockReferenceAt,
    clockMode,
  }
}

export function advanceParkingClockManually(session: ParkingClockState, seconds: number, now: number): ParkingClockState {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('O avanço manual deve ser um tempo positivo.')
  const rebased = rebaseParkingClock(session, now)
  return { ...rebased, elapsedMilliseconds: rebased.elapsedMilliseconds + seconds * 1000 }
}

export function nextChargeCents(type: VehicleType, elapsedMilliseconds: number): number {
  if (elapsedMilliseconds <= FREE_DURATION_MILLISECONDS) return 0
  return type === 'car' ? 1000 : 700
}

export function millisecondsUntilNextCharge(elapsedMilliseconds: number): number {
  if (elapsedMilliseconds <= FREE_DURATION_MILLISECONDS) return FREE_DURATION_MILLISECONDS - elapsedMilliseconds + 1
  const billableMilliseconds = elapsedMilliseconds - FREE_DURATION_MILLISECONDS - 1
  return HOUR_MILLISECONDS - (billableMilliseconds % HOUR_MILLISECONDS)
}

export function estimatedRemainingMilliseconds(
  type: VehicleType,
  balanceCents: number,
  elapsedMilliseconds = 0,
): number {
  const rateCents = type === 'car' ? 1000 : 700
  const affordableElapsed = FREE_DURATION_MILLISECONDS + Math.floor(Math.max(0, balanceCents) / rateCents) * HOUR_MILLISECONDS
  return Math.max(0, affordableElapsed - elapsedMilliseconds)
}
