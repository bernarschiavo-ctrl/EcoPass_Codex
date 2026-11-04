import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, History, Leaf, Search } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { useApp, vehicleTypeLabel } from '../../app/AppContext'
import { filterHistory, type HistoryPeriod } from './historyFilters'
import { summarizeVehicles } from './vehicleStats'
import { summarizeEnvironmentalImpact } from './environmentalImpact'
import { formatDate, formatDurationMilliseconds, formatMoney, formatTime } from '../../utils/format'

const formatEstimate = (value: number, maximumFractionDigits: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits }).format(value)

const periodLabel = (period: HistoryPeriod) => ({
  today: 'Hoje',
  '7days': 'Últimos 7 dias',
  '30days': 'Últimos 30 dias',
  custom: 'Personalizado',
  all: 'Todo o período',
})[period]

export function HistoryScreen() {
  const { data } = useApp()
  const [period, setPeriod] = useState<HistoryPeriod>('all')
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const entries = useMemo(
    () => filterHistory(data?.history ?? [], { period, query, order, from, to }),
    [data?.history, period, query, order, from, to],
  )
  const periodEntries = useMemo(
    () => filterHistory(data?.history ?? [], { period, query: '', order: 'newest', from, to }),
    [data?.history, period, from, to],
  )
  const stats = useMemo(() => summarizeVehicles(periodEntries), [periodEntries])
  const environmentalEntries = useMemo(
    () => filterHistory(data?.history ?? [], { period, query: '', order: 'newest', from, to, dateField: 'exitAt' }),
    [data?.history, period, from, to],
  )
  const periodImpact = useMemo(() => summarizeEnvironmentalImpact(environmentalEntries), [environmentalEntries])
  const totalImpact = useMemo(() => summarizeEnvironmentalImpact(data?.history ?? []), [data?.history])
  const maxCategorySpend = Math.max(stats.categories.car.spentCents, stats.categories.motorcycle.spentCents, 1)
  const maxVehicleSpend = Math.max(...stats.vehicles.map((vehicle) => vehicle.spentCents), 1)
  const hasHistory = Boolean(data?.history.length)

  return (
    <div className="screen-stack">
      <section className="screen-intro">
        <p className="eyebrow">SUAS SESSÕES</p>
        <h1>Histórico</h1>
        <p>Consulte os estacionamentos concluídos e pagos.</p>
      </section>
      <section className="card filters-card" aria-label="Filtros do histórico">
        <label className="input-with-icon">
          <Search size={17} aria-hidden="true" />
          <span className="visually-hidden">Buscar por veículo, modelo ou placa</span>
          <input className="text-input text-input--icon" placeholder="Buscar veículo ou placa" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="filter-row">
          <label className="filter-field"><span>Período</span>
            <select className="text-input" value={period} onChange={(event) => setPeriod(event.target.value as HistoryPeriod)}>
              <option value="all">Todo o período</option>
              <option value="today">Hoje</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>
          <label className="filter-field"><span>Ordem</span>
            <select className="text-input" value={order} onChange={(event) => setOrder(event.target.value as 'newest' | 'oldest')}>
              <option value="newest">Mais recente</option>
              <option value="oldest">Mais antigo</option>
            </select>
          </label>
        </div>
        {period === 'custom' && (
          <div className="filter-row">
            <label className="filter-field"><span>De</span><input className="text-input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
            <label className="filter-field"><span>Até</span><input className="text-input" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
          </div>
        )}
      </section>

      <section className="environment-impact" aria-labelledby="environment-impact-title">
          <div className="environment-impact__heading">
            <span className="environment-impact__icon"><Leaf size={18} aria-hidden="true" /></span>
            <div><p className="eyebrow">IMPACTO ESTIMADO</p><h2 id="environment-impact-title">Papel poupado com QR Codes</h2></div>
          </div>
          <div className="environment-impact__summaries">
            {[
              { title: `No período · ${periodLabel(period)}`, impact: periodImpact },
              { title: 'Acumulado geral', impact: totalImpact },
            ].map(({ title, impact }) => (
              <article className="impact-summary" key={title}>
                <h3>{title}</h3>
                <div className="impact-summary__tickets">
                  <strong>{impact.avoidedTicketCount}</strong>
                  <span>{impact.avoidedTicketCount === 1 ? 'tíquete potencialmente evitado' : 'tíquetes potencialmente evitados'}</span>
                </div>
                <div className="impact-summary__mass">
                  <div><strong>{formatEstimate(impact.paperGrams, 3)} g</strong><span>Papel estimado</span></div>
                  <div><strong>{formatEstimate(impact.paperKilograms, 6)} kg</strong><span>Equivalente em kg</span></div>
                </div>
              </article>
            ))}
          </div>
          <p className="environment-impact__assumption">Estimativas, não medições reais. Premissa: 1 sessão concluída = 1 tíquete potencialmente evitado; cada tíquete considerado mede 57 mm × 100 mm, em papel de 55 g/m² (0,314 g).</p>
      </section>

      {hasHistory && (
        <section className="vehicle-comparison" aria-labelledby="vehicle-comparison-title">
          <div className="vehicle-comparison__heading">
            <div><p className="eyebrow">RESUMO DO PERÍODO</p><h2 id="vehicle-comparison-title">Gastos e utilização</h2></div>
            <span className="vehicle-comparison__period">{periodLabel(period)}</span>
          </div>

          <div className="comparison-category-grid">
            {([stats.categories.car, stats.categories.motorcycle]).map((category) => (
              <article className="card comparison-card" key={category.key}>
                <div className="comparison-card__top"><h3>{category.label}</h3><span>{category.sessionCount} {category.sessionCount === 1 ? 'sessão' : 'sessões'}</span></div>
                <strong className="comparison-card__amount">{formatMoney(category.spentCents)}</strong>
                <div className="comparison-bar" role="img" aria-label={`Gasto com ${category.label.toLocaleLowerCase('pt-BR')}: ${formatMoney(category.spentCents)}`}>
                  <span style={{ width: `${category.spentCents / maxCategorySpend * 100}%` }} />
                </div>
                <p className="comparison-card__duration"><Clock3 size={14} /> {formatDurationMilliseconds(category.parkedMilliseconds)} estacionados</p>
              </article>
            ))}
          </div>

          <div className="comparison-vehicles">
            <h3>Por veículo</h3>
            {stats.vehicles.length ? stats.vehicles.map((vehicle) => (
              <article className="comparison-vehicle" key={vehicle.key}>
                <div className="comparison-vehicle__top">
                  <div><strong>{vehicle.label}</strong><span>{vehicle.detail || (vehicle.type === 'car' ? 'Carro' : 'Moto')} · {vehicle.type === 'car' ? 'Carro' : 'Moto'}</span></div>
                  <strong className="comparison-vehicle__amount">{formatMoney(vehicle.spentCents)}</strong>
                </div>
                <div className="comparison-bar comparison-bar--vehicle" role="img" aria-label={`Gasto de ${vehicle.label}: ${formatMoney(vehicle.spentCents)}`}>
                  <span style={{ width: `${vehicle.spentCents / maxVehicleSpend * 100}%` }} />
                </div>
                <p>{vehicle.sessionCount} {vehicle.sessionCount === 1 ? 'sessão' : 'sessões'} <span aria-hidden="true">·</span> {formatDurationMilliseconds(vehicle.parkedMilliseconds)} estacionados</p>
              </article>
            )) : <p className="comparison-empty">Nenhuma sessão neste período.</p>}
          </div>
          <p className="comparison-note">Veículos agrupados pelos dados registrados em cada sessão. Alterações no cadastro podem aparecer como registros separados.</p>
        </section>
      )}

      {!hasHistory ? (
        <EmptyState title="Seu histórico está vazio" icon={<History size={24} />}>
          As sessões pagas aparecerão aqui depois que você concluir um estacionamento.
        </EmptyState>
      ) : entries.length === 0 ? (
        <EmptyState title="Nenhum resultado encontrado" icon={<Search size={22} />}>
          Ajuste ou limpe os filtros para encontrar uma sessão.
        </EmptyState>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <article className="card history-card" key={entry.id}>
              <div className="history-card__top">
                <div><p className="history-card__date"><CalendarDays size={15} /> {formatDate(entry.entryAt)}</p><h2>{entry.vehicleSnapshot.nickname || entry.vehicleSnapshot.makeModel || 'Veículo'}</h2></div>
                <strong className="history-card__cost">{formatMoney(entry.costCents)}</strong>
              </div>
              <p className="history-card__vehicle">{entry.vehicleSnapshot.makeModel} · {entry.vehicleSnapshot.plate} · {vehicleTypeLabel(entry.vehicleSnapshot.type)}</p>
              <div className="history-card__details">
                <span><Clock3 size={14} /> {formatTime(entry.entryAt)} – {formatTime(entry.exitAt)}</span>
                <span>Duração {formatDurationMilliseconds(entry.durationMilliseconds)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
      {hasHistory && <p className="result-count">{entries.length} {entries.length === 1 ? 'sessão' : 'sessões'}</p>}
    </div>
  )
}
