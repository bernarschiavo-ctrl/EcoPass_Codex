import type {
  AppData,
  AppSettings,
  ClockMode,
  HistoryEntry,
  Offer,
  ParkingSession,
  Profile,
  Vehicle,
} from '../types'
import {
  advanceParkingClockManually,
  calculateParkingCostCents,
  elapsedSessionMilliseconds,
  rebaseParkingClock,
} from '../features/parking/tariff'

const DB_NAME = 'ecopass-local'
const DB_VERSION = 2
type StoreName = 'profile' | 'wallet' | 'vehicles' | 'session' | 'history' | 'offers' | 'settings'
type WalletRecord = { id: 'wallet'; balanceCents: number }

let databasePromise: Promise<IDBDatabase> | undefined

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Falha ao acessar os dados locais.'))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha ao salvar os dados locais.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('A operação local foi cancelada.'))
  })
}

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise
  databasePromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('Este navegador não oferece suporte ao armazenamento local necessário (IndexedDB).'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = request.result
      const upgrade = request.transaction
      if (!upgrade) throw new Error('Não foi possível migrar os dados locais.')
      for (const storeName of ['profile', 'wallet', 'vehicles', 'session', 'history', 'offers', 'settings'] as const) {
        if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: 'id' })
      }
      if (event.oldVersion < 2) {
        const sessionCursor = upgrade.objectStore('session').openCursor()
        sessionCursor.onsuccess = () => {
          const cursor = sessionCursor.result
          if (!cursor) return
          const record = cursor.value as ParkingSession & { elapsedSeconds?: number }
          if (record.elapsedMilliseconds === undefined && record.elapsedSeconds !== undefined) {
            const migrated = { ...record, elapsedMilliseconds: record.elapsedSeconds * 1000 } as ParkingSession
            delete (migrated as ParkingSession & { elapsedSeconds?: number }).elapsedSeconds
            cursor.update(migrated)
          }
          cursor.continue()
        }
        const historyCursor = upgrade.objectStore('history').openCursor()
        historyCursor.onsuccess = () => {
          const cursor = historyCursor.result
          if (!cursor) return
          const record = cursor.value as HistoryEntry & { durationSeconds?: number }
          if (record.durationMilliseconds === undefined && record.durationSeconds !== undefined) {
            const migrated = { ...record, durationMilliseconds: record.durationSeconds * 1000 } as HistoryEntry
            delete (migrated as HistoryEntry & { durationSeconds?: number }).durationSeconds
            cursor.update(migrated)
          }
          cursor.continue()
        }
      }
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        databasePromise = undefined
      }
      resolve(db)
    }
    request.onerror = () => {
      databasePromise = undefined
      reject(request.error ?? new Error('Não foi possível abrir o armazenamento local.'))
    }
    request.onblocked = () => {
      databasePromise = undefined
      reject(new Error('O armazenamento está ocupado em outra aba. Feche-a e tente novamente.'))
    }
  })
  return databasePromise
}

export async function closeDatabase(): Promise<void> {
  const database = await databasePromise
  database?.close()
  databasePromise = undefined
}

async function readAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase()
  const tx = db.transaction(storeName, 'readonly')
  const done = transactionDone(tx)
  const values = await requestResult(tx.objectStore(storeName).getAll()) as T[]
  await done
  return values
}

async function put<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(storeName, 'readwrite')
  const done = transactionDone(tx)
  tx.objectStore(storeName).put(value)
  await done
}

async function ensureDefaults(): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(['profile', 'wallet', 'settings'], 'readwrite')
  const done = transactionDone(tx)
  const profileStore = tx.objectStore('profile')
  const walletStore = tx.objectStore('wallet')
  const settingsStore = tx.objectStore('settings')
  const [profile, wallet, settings] = await Promise.all([
    requestResult(profileStore.get('profile')),
    requestResult(walletStore.get('wallet')),
    requestResult(settingsStore.get('app')),
  ])
  if (!profile) profileStore.put({ id: 'profile', name: '', email: '', phone: '' } satisfies Profile)
  if (!wallet) walletStore.put({ id: 'wallet', balanceCents: 0 } satisfies WalletRecord)
  if (!settings) settingsStore.put({
    id: 'app',
    selectedVehicleId: null,
    entryQrToken: crypto.randomUUID(),
  } satisfies AppSettings)
  await done
}

export async function loadAppData(): Promise<AppData> {
  await ensureDefaults()
  const [profiles, wallets, vehicles, sessions, history, offers, settings] = await Promise.all([
    readAll<Profile>('profile'),
    readAll<WalletRecord>('wallet'),
    readAll<Vehicle>('vehicles'),
    readAll<ParkingSession>('session'),
    readAll<HistoryEntry>('history'),
    readAll<Offer>('offers'),
    readAll<AppSettings>('settings'),
  ])
  return {
    profile: profiles.find((item) => item.id === 'profile') ?? { id: 'profile', name: '', email: '', phone: '' },
    balanceCents: wallets.find((item) => item.id === 'wallet')?.balanceCents ?? 0,
    vehicles: vehicles.sort((a, b) => a.createdAt - b.createdAt),
    activeSession: sessions[0] ?? null,
    history: history.sort((a, b) => b.entryAt - a.entryAt),
    offers: offers.sort((a, b) => b.createdAt - a.createdAt),
    settings: settings.find((item) => item.id === 'app') ?? { id: 'app', selectedVehicleId: null, entryQrToken: '' },
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await put('profile', profile)
}

export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(['vehicles', 'session'], 'readwrite')
  const done = transactionDone(tx)
  const sessions = tx.objectStore('session')
  const [active] = await Promise.all([
    requestResult(sessions.getAll()) as Promise<ParkingSession[]>,
  ])
  if (active.length) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('Não é possível alterar veículos enquanto houver um estacionamento ativo.')
  }
  tx.objectStore('vehicles').put(vehicle)
  await done
}

export async function deleteVehicle(id: string): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(['vehicles', 'session', 'settings'], 'readwrite')
  const done = transactionDone(tx)
  const [sessions, settings] = await Promise.all([
    requestResult(tx.objectStore('session').getAll()) as Promise<ParkingSession[]>,
    requestResult(tx.objectStore('settings').get('app')) as Promise<AppSettings | undefined>,
  ])
  if (sessions.length) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('Não é possível remover veículos durante uma sessão ativa.')
  }
  tx.objectStore('vehicles').delete(id)
  if (settings?.selectedVehicleId === id) {
    tx.objectStore('settings').put({ ...settings, selectedVehicleId: null })
  }
  await done
}

export async function selectVehicle(id: string): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(['vehicles', 'session', 'settings'], 'readwrite')
  const done = transactionDone(tx)
  const [vehicle, active, settings] = await Promise.all([
    requestResult(tx.objectStore('vehicles').get(id)) as Promise<Vehicle | undefined>,
    requestResult(tx.objectStore('session').getAll()) as Promise<ParkingSession[]>,
    requestResult(tx.objectStore('settings').get('app')) as Promise<AppSettings | undefined>,
  ])
  if (active.length) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('A seleção de veículos fica bloqueada durante um estacionamento ativo.')
  }
  if (!vehicle || !settings) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('O veículo selecionado não foi encontrado.')
  }
  tx.objectStore('settings').put({ ...settings, selectedVehicleId: id })
  await done
}

export async function changeBalance(deltaCents: number): Promise<void> {
  if (!Number.isSafeInteger(deltaCents) || deltaCents === 0) throw new Error('Informe um valor positivo válido.')
  const db = await openDatabase()
  const tx = db.transaction('wallet', 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore('wallet')
  const wallet = await requestResult(store.get('wallet')) as WalletRecord | undefined
  const balance = wallet?.balanceCents ?? 0
  if (balance + deltaCents < 0) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('O valor de retirada não pode ser maior que o saldo disponível.')
  }
  store.put({ id: 'wallet', balanceCents: balance + deltaCents })
  await done
}

export async function startParking(entryToken: string, now = Date.now()): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(['session', 'settings', 'vehicles'], 'readwrite')
  const done = transactionDone(tx)
  const sessionStore = tx.objectStore('session')
  const [sessions, settings] = await Promise.all([
    requestResult(sessionStore.getAll()) as Promise<ParkingSession[]>,
    requestResult(tx.objectStore('settings').get('app')) as Promise<AppSettings | undefined>,
  ])
  if (sessions.length || !settings || settings.entryQrToken !== entryToken) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('Este QR de entrada já foi usado ou não está mais válido.')
  }
  const vehicle = settings.selectedVehicleId
    ? await requestResult(tx.objectStore('vehicles').get(settings.selectedVehicleId)) as Vehicle | undefined
    : undefined
  if (!vehicle) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('Cadastre e selecione um veículo na aba Perfil antes de iniciar.')
  }
  sessionStore.put({
    id: crypto.randomUUID(),
    vehicleSnapshot: {
      type: vehicle.type,
      makeModel: vehicle.makeModel,
      plate: vehicle.plate,
      nickname: vehicle.nickname,
    },
    entryAt: now,
    clockMode: 'realtime',
    elapsedMilliseconds: 0,
    clockReferenceAt: now,
    entryQrToken: entryToken,
    exitQrToken: crypto.randomUUID(),
  } satisfies ParkingSession)
  tx.objectStore('settings').put({ ...settings, entryQrToken: crypto.randomUUID() })
  await done
}

function checkpointSession(session: ParkingSession, now: number): ParkingSession {
  return { ...session, ...rebaseParkingClock(session, now) }
}

export async function setClockMode(mode: ClockMode, now = Date.now()): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction('session', 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore('session')
  const session = await requestResult(store.getAll()).then((items) => (items as ParkingSession[])[0])
  if (!session) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('Não há estacionamento ativo para alterar o cronômetro.')
  }
  store.put({ ...checkpointSession(session, now), clockMode: mode })
  await done
}

export async function advanceClock(seconds: number, now = Date.now()): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction('session', 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore('session')
  const session = await requestResult(store.getAll()).then((items) => (items as ParkingSession[])[0])
  if (!session || seconds <= 0) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('Não foi possível avançar o cronômetro sem uma sessão ativa.')
  }
  store.put({ ...session, ...advanceParkingClockManually(session, seconds, now) })
  await done
}

export async function payAndFinish(exitToken: string, now = Date.now()): Promise<HistoryEntry> {
  const db = await openDatabase()
  const tx = db.transaction(['session', 'wallet', 'history'], 'readwrite')
  const done = transactionDone(tx)
  const sessionStore = tx.objectStore('session')
  const [sessions, wallet] = await Promise.all([
    requestResult(sessionStore.getAll()) as Promise<ParkingSession[]>,
    requestResult(tx.objectStore('wallet').get('wallet')) as Promise<WalletRecord | undefined>,
  ])
  const session = sessions[0]
  if (!session || session.exitQrToken !== exitToken) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error('Este QR de saída não corresponde à sessão ativa. Atualize a tela e tente novamente.')
  }
  const durationMilliseconds = elapsedSessionMilliseconds(session, now)
  const costCents = calculateParkingCostCents(session.vehicleSnapshot.type, durationMilliseconds)
  const balanceCents = wallet?.balanceCents ?? 0
  if (balanceCents < costCents) {
    tx.abort()
    await done.catch(() => undefined)
    throw new Error(`Saldo insuficiente. Adicione ${formatCurrencyShort(costCents - balanceCents)} para concluir o pagamento.`)
  }
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    entryAt: session.entryAt,
    exitAt: now,
    durationMilliseconds,
    costCents,
    vehicleSnapshot: session.vehicleSnapshot,
  }
  tx.objectStore('wallet').put({ id: 'wallet', balanceCents: balanceCents - costCents } satisfies WalletRecord)
  sessionStore.delete(session.id)
  tx.objectStore('history').add(entry)
  await done
  return entry
}

export async function saveOffer(offer: Offer): Promise<void> {
  await put('offers', offer)
}

export async function deleteOffer(id: string): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction('offers', 'readwrite')
  const done = transactionDone(tx)
  tx.objectStore('offers').delete(id)
  await done
}

function formatCurrencyShort(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}
