import { describe, expect, it } from 'vitest'
import {
  advanceParkingClockManually,
  calculateParkingCostCents,
  estimatedRemainingMilliseconds,
  elapsedSessionMilliseconds,
  FREE_DURATION_MILLISECONDS,
  nextChargeCents,
  millisecondsUntilNextCharge,
  rebaseParkingClock,
  type ParkingClockState,
} from './tariff'

const makeClock = (clockMode: ParkingClockState['clockMode'] = 'realtime'): ParkingClockState => ({
  elapsedMilliseconds: 0,
  clockReferenceAt: 10_000,
  clockMode,
})

describe('calculateParkingCostCents', () => {
  it.each([
    [0, 0, 0],
    [10 * 60_000, 0, 0],
    [11 * 60_000, 1000, 700],
    [60 * 60_000, 1000, 700],
    [70 * 60_000, 1000, 700],
    [71 * 60_000, 2000, 1400],
    [130 * 60_000, 2000, 1400],
    [131 * 60_000, 3000, 2100],
  ])('calculates simulated elapsed milliseconds %i correctly', (milliseconds, carExpected, motorcycleExpected) => {
    expect(calculateParkingCostCents('car', milliseconds)).toBe(carExpected)
    expect(calculateParkingCostCents('motorcycle', milliseconds)).toBe(motorcycleExpected)
  })

  it('charges a started hour exactly one millisecond after a boundary', () => {
    expect(calculateParkingCostCents('car', FREE_DURATION_MILLISECONDS)).toBe(0)
    expect(calculateParkingCostCents('car', FREE_DURATION_MILLISECONDS + 1)).toBe(1000)
    expect(calculateParkingCostCents('motorcycle', FREE_DURATION_MILLISECONDS + 60 * 60_000)).toBe(700)
    expect(calculateParkingCostCents('motorcycle', FREE_DURATION_MILLISECONDS + 60 * 60_000 + 1)).toBe(1400)
  })

  it('calculates the next tariff threshold from the same millisecond duration', () => {
    expect(nextChargeCents('car', FREE_DURATION_MILLISECONDS - 1)).toBe(0)
    expect(nextChargeCents('car', FREE_DURATION_MILLISECONDS)).toBe(0)
    expect(nextChargeCents('car', FREE_DURATION_MILLISECONDS + 1)).toBe(1000)
    expect(nextChargeCents('motorcycle', FREE_DURATION_MILLISECONDS + 1)).toBe(700)
  })

  it('estimates affordable time with the free period and existing session cost', () => {
    expect(estimatedRemainingMilliseconds('car', 0)).toBe(FREE_DURATION_MILLISECONDS)
    expect(estimatedRemainingMilliseconds('car', 1000)).toBe(70 * 60_000)
    expect(estimatedRemainingMilliseconds('motorcycle', 1400)).toBe(130 * 60_000)
    expect(estimatedRemainingMilliseconds('car', 1000, 70 * 60_000)).toBe(0)
    expect(estimatedRemainingMilliseconds('car', 2000, 70 * 60_000)).toBe(60 * 60_000)
  })

  it('calculates time to the next tariff threshold', () => {
    expect(millisecondsUntilNextCharge(0)).toBe(FREE_DURATION_MILLISECONDS + 1)
    expect(millisecondsUntilNextCharge(FREE_DURATION_MILLISECONDS)).toBe(1)
    expect(millisecondsUntilNextCharge(FREE_DURATION_MILLISECONDS + 55 * 60_000)).toBe(5 * 60_000 + 1)
  })
})

describe('simulated parking clock', () => {
  it('converts real elapsed milliseconds using the currently selected multiplier', () => {
    expect(elapsedSessionMilliseconds({ ...makeClock(10), elapsedMilliseconds: 120_000 }, 14_000)).toBe(160_000)
  })

  it('preserves elapsed time across repeated speed changes and only changes future progress', () => {
    const first = rebaseParkingClock(makeClock(), 11_000, 300)
    expect(first.elapsedMilliseconds).toBe(1_000)
    const second = rebaseParkingClock(first, 12_000, 10)
    expect(second.elapsedMilliseconds).toBe(301_000)
    const third = rebaseParkingClock(second, 12_000, 60)
    expect(third.elapsedMilliseconds).toBe(301_000)
    expect(elapsedSessionMilliseconds(third, 13_000)).toBe(361_000)
    const fourth = rebaseParkingClock(third, 14_000, 'realtime')
    expect(fourth.elapsedMilliseconds).toBe(421_000)
    expect(elapsedSessionMilliseconds(fourth, 15_000)).toBe(422_000)
  })

  it('does not move backwards when the UI clock is older than the persisted reference', () => {
    const clock = { ...makeClock(300), elapsedMilliseconds: 5_000, clockReferenceAt: 12_000 }
    expect(elapsedSessionMilliseconds(clock, 11_999)).toBe(5_000)
    expect(rebaseParkingClock(clock, 11_000, 10)).toEqual({
      elapsedMilliseconds: 5_000,
      clockReferenceAt: 12_000,
      clockMode: 10,
    })
  })

  it('keeps manual advances in seconds at the API and milliseconds in persisted state', () => {
    const first = advanceParkingClockManually(makeClock(10), 10 * 60, 11_000)
    expect(first.elapsedMilliseconds).toBe(610_000)
    const second = advanceParkingClockManually(first, 30 * 60, 11_000)
    expect(second.elapsedMilliseconds).toBe(2_410_000)
    const third = advanceParkingClockManually(second, 60 * 60, 11_000)
    expect(third.elapsedMilliseconds).toBe(6_010_000)
    expect(calculateParkingCostCents('car', third.elapsedMilliseconds)).toBe(2000)
  })
})
