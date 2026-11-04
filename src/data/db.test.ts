import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { advanceClock, changeBalance, closeDatabase, loadAppData, openDatabase, payAndFinish, saveVehicle, selectVehicle, setClockMode, startParking } from './db'
import { calculateParkingCostCents } from '../features/parking/tariff'

const DB_NAME = 'ecopass-local'

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('A base de teste ficou bloqueada.'))
  })
}

function openLegacyDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      for (const name of ['profile', 'wallet', 'vehicles', 'session', 'history', 'offers', 'settings']) {
        db.createObjectStore(name, { keyPath: 'id' })
      }
      const timestamp = 1_700_000_000_000
      request.transaction?.objectStore('session').put({
        id: 'legacy-session',
        vehicleSnapshot: { type: 'car', makeModel: 'Modelo', plate: 'ABC123', nickname: '' },
        entryAt: timestamp,
        clockMode: 10,
        elapsedSeconds: 123.5,
        clockReferenceAt: timestamp + 1000,
        entryQrToken: 'entry',
        exitQrToken: 'exit',
      })
      request.transaction?.objectStore('history').put({
        id: 'legacy-history',
        sessionId: 'legacy-session',
        entryAt: timestamp,
        exitAt: timestamp + 1000,
        durationSeconds: 456.25,
        costCents: 1000,
        vehicleSnapshot: { type: 'car', makeModel: 'Modelo', plate: 'ABC123', nickname: '' },
      })
    }
    request.onsuccess = () => {
      request.result.close()
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

describe('IndexedDB parking operations', () => {
  beforeEach(async () => {
    await closeDatabase()
    await deleteDatabase()
  })

  afterEach(async () => {
    await closeDatabase()
  })

  it('allows withdrawals during an active session without touching the clock, and prevents a negative balance', async () => {
    let data = await loadAppData()
    const startAt = 1_700_000_000_000
    await saveVehicle({
      id: 'vehicle-1',
      type: 'car',
      makeModel: 'Compacto',
      plate: 'ABC123',
      nickname: 'Carro',
      createdAt: startAt,
      updatedAt: startAt,
    })
    await selectVehicle('vehicle-1')
    await changeBalance(5000)
    data = await loadAppData()
    await startParking(data.settings.entryQrToken, startAt)

    const beforeWithdrawal = (await loadAppData()).activeSession
    await changeBalance(-4000)
    const afterWithdrawal = await loadAppData()
    expect(afterWithdrawal.balanceCents).toBe(1000)
    expect(afterWithdrawal.activeSession).toEqual(beforeWithdrawal)
    await expect(changeBalance(-1001)).rejects.toThrow('não pode ser maior que o saldo')
    expect((await loadAppData()).balanceCents).toBe(1000)

    await advanceClock(71 * 60, startAt)
    await expect(payAndFinish(afterWithdrawal.activeSession!.exitQrToken, startAt)).rejects.toThrow('Saldo insuficiente')
    const unpaid = await loadAppData()
    expect(unpaid.balanceCents).toBe(1000)
    expect(unpaid.activeSession).not.toBeNull()
    expect(unpaid.history).toHaveLength(0)

    await changeBalance(1000)
    const paid = await payAndFinish(unpaid.activeSession!.exitQrToken, startAt)
    const completed = await loadAppData()
    expect(paid.durationMilliseconds).toBe(71 * 60_000)
    expect(paid.costCents).toBe(2000)
    expect(completed.balanceCents).toBe(0)
    expect(completed.activeSession).toBeNull()
    expect(completed.history).toHaveLength(1)
  })

  it('persists elapsed milliseconds across repeated speed changes, manual advancement, and reopening the database', async () => {
    let data = await loadAppData()
    const startAt = 1_700_000_100_000
    await saveVehicle({
      id: 'vehicle-2',
      type: 'car',
      makeModel: 'Compacto',
      plate: 'XYZ789',
      nickname: '',
      createdAt: startAt,
      updatedAt: startAt,
    })
    await selectVehicle('vehicle-2')
    await changeBalance(1000)
    data = await loadAppData()
    await startParking(data.settings.entryQrToken, startAt)

    await setClockMode(300, startAt + 1000)
    await setClockMode(10, startAt + 2000)
    await setClockMode(60, startAt + 2000)
    await advanceClock(10 * 60, startAt + 2000)

    await closeDatabase()
    data = await loadAppData()
    const session = data.activeSession!
    expect(session.clockMode).toBe(60)
    expect(session.elapsedMilliseconds).toBe(901_000)
    expect(data.balanceCents).toBe(1000)
    expect((await openDatabase()).name).toBe(DB_NAME)
    expect((await loadAppData()).activeSession).toEqual(session)
    expect(calculateParkingCostCents(session.vehicleSnapshot.type, session.elapsedMilliseconds)).toBe(1000)

    const completed = await payAndFinish(session.exitQrToken, session.clockReferenceAt + 1000)
    expect(completed.durationMilliseconds).toBe(961_000)
    expect(completed.costCents).toBe(calculateParkingCostCents(session.vehicleSnapshot.type, completed.durationMilliseconds))
    expect((await loadAppData()).history).toHaveLength(1)
  })

  it('migrates persisted seconds from the previous database schema without losing the session or history', async () => {
    await openLegacyDatabase()
    const data = await loadAppData()
    expect(data.activeSession?.elapsedMilliseconds).toBe(123_500)
    expect(data.history[0].durationMilliseconds).toBe(456_250)

    const migratedDb = await openDatabase()
    const tx = migratedDb.transaction(['session', 'history'], 'readonly')
    const session = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = tx.objectStore('session').get('legacy-session')
      request.onsuccess = () => resolve(request.result as Record<string, unknown>)
      request.onerror = () => reject(request.error)
    })
    expect(session).not.toHaveProperty('elapsedSeconds')
    expect(session.elapsedMilliseconds).toBe(123_500)
  })
})
