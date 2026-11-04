import { useMemo, useState } from 'react'
import { BadgeAlert, CarFront, Clock3, Minus, Plus, ScanLine } from 'lucide-react'
import { useApp, vehicleTypeLabel } from '../../app/AppContext'
import { BalanceCard } from '../../components/BalanceCard'
import { EmptyState } from '../../components/EmptyState'
import { QrPanel } from '../../components/QrPanel'
import { TestPanel } from '../../components/TestPanel'
import { WarningBanner } from '../../components/WarningBanner'
import { calculateParkingCostCents, elapsedSessionMilliseconds, estimatedRemainingMilliseconds, FREE_DURATION_MILLISECONDS, millisecondsUntilNextCharge, nextChargeCents } from './tariff'
import { formatDurationMilliseconds, formatMoney, formatTime, parseMoneyToCents } from '../../utils/format'
import type { ClockMode } from '../../types'

const modeOptions: { mode: ClockMode; label: string }[] = [
  { mode: 'realtime', label: 'Tempo real 1×' },
  { mode: 10, label: 'Acelerado 10×' },
  { mode: 60, label: 'Acelerado 60×' },
  { mode: 300, label: 'Acelerado 300×' },
]

export function ParkingScreen() {
  const { data, now, busy, startParking, finishParking, setClockMode, advanceClock, changeBalance, selectVehicle, perform } = useApp()
  const [customAmount, setCustomAmount] = useState('')
  const active = data?.activeSession ?? null
  const elapsed = active ? elapsedSessionMilliseconds(active, now) : 0
  const cost = active ? calculateParkingCostCents(active.vehicleSnapshot.type, elapsed) : 0
  const nextCharge = active ? nextChargeCents(active.vehicleSnapshot.type, elapsed) : 0
  const selectedVehicle = useMemo(
    () => data?.vehicles.find((vehicle) => vehicle.id === data.settings.selectedVehicleId),
    [data?.vehicles, data?.settings.selectedVehicleId],
  )

  if (!data) return null

  const vehicleType = active?.vehicleSnapshot.type ?? selectedVehicle?.type
  const rateCents = vehicleType === 'car' ? 1000 : 700
  const affordableMilliseconds = vehicleType ? estimatedRemainingMilliseconds(vehicleType, data.balanceCents, elapsed) : null
  const clockRate = active?.clockMode === 'realtime' || !active ? 1 : active.clockMode
  const estimatedWallMilliseconds = affordableMilliseconds === null ? null : affordableMilliseconds / clockRate
  const insufficient = Boolean(active && data.balanceCents < cost + nextCharge)
  const lowBalance = !active && vehicleType !== undefined && data.balanceCents < rateCents
  const nearCharge = Boolean(active && !insufficient && elapsed >= FREE_DURATION_MILLISECONDS && millisecondsUntilNextCharge(elapsed) <= 5 * 60_000)

  const addCustom = async () => {
    const amount = parseMoneyToCents(customAmount)
    if (amount === null) {
      await perform(() => Promise.reject(new Error('Informe um valor positivo, como 15,00.')))
      return
    }
    const success = await changeBalance(amount, 'Saldo adicionado.')
    if (success) setCustomAmount('')
  }

  const withdrawCustom = async () => {
    const amount = parseMoneyToCents(customAmount)
    if (amount === null) {
      await perform(() => Promise.reject(new Error('Informe um valor positivo, como 15,00.')))
      return
    }
    const success = await changeBalance(-amount, 'Saldo retirado.')
    if (success) setCustomAmount('')
  }

  const renderBalanceControls = () => (
    <div className="balance-tools">
      <p className="field-label">Adicionar saldo virtual</p>
      <div className="quick-amounts">
        {[1000, 2000, 5000].map((amount) => (
          <button key={amount} className="button button--small button--outline" disabled={busy} onClick={() => void changeBalance(amount, `${formatMoney(amount)} adicionados ao saldo.`)}>
            + {formatMoney(amount)}
          </button>
        ))}
      </div>
      <label className="field-label" htmlFor="custom-balance">Valor personalizado (R$)</label>
      <div className="inline-form">
        <input id="custom-balance" className="text-input" inputMode="decimal" placeholder="Ex.: 15,00" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} />
        <button className="button button--primary button--small" disabled={busy} onClick={() => void addCustom()}><Plus size={16} /> Adicionar</button>
      </div>
      <div className="inline-form inline-form--withdraw"><button className="button button--outline button--small" disabled={busy} onClick={() => void withdrawCustom()}><Minus size={16} /> Retirar valor informado</button></div>
      {active && <p className="help-text">Retirar saldo não altera o tempo nem o custo da sessão. Se faltar saldo para a saída, adicione mais antes de pagar.</p>}
      <p className="help-text">Saldo e operações são apenas demonstrativos, sem pagamento real.</p>
    </div>
  )

  return (
    <div className="screen-stack">
      <BalanceCard cents={data.balanceCents} />
      {insufficient ? (
        <WarningBanner>Seu saldo não cobre o custo acumulado e a próxima cobrança. Adicione saldo para concluir o pagamento na saída.</WarningBanner>
      ) : nearCharge ? (
        <WarningBanner>A próxima cobrança de {formatMoney(nextCharge)} acontece em breve. Confira seu saldo antes de continuar.</WarningBanner>
      ) : lowBalance ? (
        <WarningBanner>Seu saldo está baixo para o veículo selecionado. Adicione saldo para ter pelo menos uma hora de estacionamento após os 10 minutos grátis.</WarningBanner>
      ) : null}

      {!active ? (
        <>
          <section className="card vehicle-picker">
            <div className="section-heading">
              <div><p className="eyebrow">ANTES DE ENTRAR</p><h2>Seu veículo</h2></div>
              <CarFront size={22} aria-hidden="true" />
            </div>
            {data.vehicles.length > 0 ? (
              <label htmlFor="parking-vehicle" className="field-label">Selecione um veículo</label>
            ) : (
              <EmptyState title="Nenhum veículo cadastrado">Cadastre um veículo em Perfil para iniciar um estacionamento.</EmptyState>
            )}
            {data.vehicles.length > 0 && (
              <select
                id="parking-vehicle"
                className="text-input"
                value={data.settings.selectedVehicleId ?? ''}
                disabled={busy}
                onChange={(event) => event.target.value && void selectVehicle(event.target.value)}
              >
                <option value="" disabled>Escolha um veículo</option>
                {data.vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.nickname || vehicle.makeModel || 'Veículo'} · {vehicle.plate || 'sem placa'} ({vehicleTypeLabel(vehicle.type)})
                  </option>
                ))}
              </select>
            )}
            {selectedVehicle && <p className="selection-note">Tarifa: {selectedVehicle.type === 'car' ? 'R$ 10,00' : 'R$ 7,00'} por hora iniciada após 10 min grátis.</p>}
            {selectedVehicle && estimatedWallMilliseconds !== null && <p className="selection-note">Com o saldo atual, você pode estacionar por aproximadamente {formatDurationMilliseconds(estimatedWallMilliseconds)} no total.</p>}
          </section>
          <QrPanel
            testId="entry-qr"
            title="QR Code de entrada"
            subtitle="Código local para simular o início do estacionamento."
            payload={JSON.stringify({ v: 1, type: 'entry', token: data.settings.entryQrToken })}
          />
          <TestPanel>
            <p className="test-panel__description">Simulações locais para demonstração. Nenhuma cancela ou serviço externo é acionado.</p>
            <button className="button button--primary button--full" disabled={busy || !selectedVehicle} onClick={() => void startParking()}>
              <ScanLine size={18} /> Simular leitura do QR de entrada
            </button>
            {!selectedVehicle && <p className="help-text help-text--center">Cadastre e selecione um veículo para habilitar a entrada.</p>}
            <div className="test-divider" />
            {renderBalanceControls()}
          </TestPanel>
        </>
      ) : (
        <>
          <QrPanel
            testId="exit-qr"
            title="QR Code de saída"
            subtitle="Apresente este código ao simular a saída."
            payload={JSON.stringify({ v: 1, type: 'exit', sessionId: active.id, token: active.exitQrToken })}
          />
          <section className="card session-card">
            <div className="session-card__top">
              <div><p className="eyebrow">ESTACIONAMENTO ATIVO</p><h2>{active.vehicleSnapshot.nickname || active.vehicleSnapshot.makeModel || 'Seu veículo'}</h2></div>
              <span className="status-pill"><span className="status-dot" /> Em andamento</span>
            </div>
            <div className="session-info">
              <div className="session-info__time">
                <Clock3 size={18} aria-hidden="true" />
                <span>{formatDurationMilliseconds(elapsed)}</span>
                <small>tempo decorrido</small>
              </div>
              <div className="session-info__cost">
                <span>Custo acumulado</span>
                <strong>{formatMoney(cost)}</strong>
                <small>não debitado ainda</small>
              </div>
            </div>
            <div className="session-meta">
              <span>{vehicleTypeLabel(active.vehicleSnapshot.type)} · {active.vehicleSnapshot.makeModel}</span>
              <span>Placa {active.vehicleSnapshot.plate}</span>
            </div>
            <p className="tariff-note">
              10 min grátis · depois, {active.vehicleSnapshot.type === 'car' ? 'R$ 10,00' : 'R$ 7,00'} por hora iniciada.
            </p>
            {estimatedWallMilliseconds !== null && <p className="selection-note">Saldo atual cobre aproximadamente mais {formatDurationMilliseconds(estimatedWallMilliseconds)} de permanência neste ritmo.</p>}
            <p className="entry-time">Entrada às {formatTime(active.entryAt)}</p>
          </section>
          <TestPanel>
            <p className="test-panel__description">Altere o relógio de demonstração sem afetar o tempo já acumulado.</p>
            <p className="field-label">Modo de tempo</p>
            <div className="mode-grid">
              {modeOptions.map(({ mode, label }) => (
                <button key={String(mode)} className={`mode-button ${active.clockMode === mode ? 'is-selected' : ''}`} disabled={busy} aria-pressed={active.clockMode === mode} onClick={() => void setClockMode(mode)}>
                  {label}
                </button>
              ))}
            </div>
            <p className="field-label manual-label">Avançar tempo manualmente</p>
            <div className="quick-amounts">
              {[{ label: '+10 min', seconds: 600 }, { label: '+30 min', seconds: 1800 }, { label: '+1 hora', seconds: 3600 }].map((item) => (
                <button key={item.seconds} className="button button--small button--outline" disabled={busy} onClick={() => void advanceClock(item.seconds)}>{item.label}</button>
              ))}
            </div>
            <button className="button button--primary button--full test-exit-button" disabled={busy} onClick={() => void finishParking()}>
              <ScanLine size={18} /> Simular leitura do QR de saída e pagar
            </button>
            {renderBalanceControls()}
          </TestPanel>
        </>
      )}
      <div className="disclaimer"><BadgeAlert size={16} aria-hidden="true" /><span>Projeto demonstrativo. QR Codes, saldo e tarifas não têm validade fora deste aplicativo.</span></div>
    </div>
  )
}
