import { useEffect, useState, type FormEvent } from 'react'
import { CarFront, Edit3, Plus, Trash2, UserRound, X } from 'lucide-react'
import { useApp, vehicleTypeLabel } from '../../app/AppContext'
import { EmptyState } from '../../components/EmptyState'
import type { Profile as ProfileData, Vehicle, VehicleType } from '../../types'

const emptyVehicle = { type: 'car' as VehicleType, makeModel: '', plate: '', nickname: '' }

export function ProfileScreen() {
  const { data, busy, updateProfile, saveVehicle, deleteVehicle, selectVehicle } = useApp()
  const [profile, setProfile] = useState<ProfileData>({ id: 'profile', name: '', email: '', phone: '' })
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const isActive = Boolean(data?.activeSession)

  useEffect(() => {
    if (data) setProfile(data.profile)
  }, [data?.profile])

  if (!data) return null

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault()
    await updateProfile(profile)
  }

  const openNewVehicle = () => {
    setEditingVehicle(null)
    setVehicleForm(emptyVehicle)
    setFormOpen(true)
  }

  const editVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle.id)
    setVehicleForm({ type: vehicle.type, makeModel: vehicle.makeModel, plate: vehicle.plate, nickname: vehicle.nickname })
    setFormOpen(true)
  }

  const submitVehicle = async (event: FormEvent) => {
    event.preventDefault()
    const success = await saveVehicle(vehicleForm, editingVehicle ?? undefined)
    if (success) {
      setFormOpen(false)
      setEditingVehicle(null)
      setVehicleForm(emptyVehicle)
    }
  }

  const removeVehicle = async (vehicle: Vehicle) => {
    const label = vehicle.nickname || vehicle.makeModel || vehicle.plate || 'este veículo'
    if (window.confirm(`Deseja excluir ${label}? Esta ação não pode ser desfeita.`)) {
      await deleteVehicle(vehicle.id)
    }
  }

  return (
    <div className="screen-stack">
      <section className="screen-intro">
        <p className="eyebrow">SEUS DADOS</p>
        <h1>Perfil</h1>
        <p>Gerencie suas informações e os veículos cadastrados.</p>
      </section>
      <section className="card profile-card">
        <div className="section-heading"><div><span className="heading-icon"><UserRound size={19} /></span><h2>Informações pessoais</h2></div></div>
        <form className="form-stack" onSubmit={(event) => void submitProfile(event)}>
          <label className="form-field"><span>Nome</span><input className="text-input" autoComplete="name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label className="form-field"><span>E-mail</span><input className="text-input" type="text" inputMode="email" autoComplete="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
          <label className="form-field"><span>Telefone</span><input className="text-input" type="tel" autoComplete="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <button className="button button--primary" type="submit" disabled={busy}>Salvar perfil</button>
        </form>
      </section>
      <section className="card vehicles-section">
        <div className="section-heading">
          <div><span className="heading-icon"><CarFront size={20} /></span><h2>Meus veículos</h2></div>
          <span className="count-badge">{data.vehicles.length}</span>
        </div>
        {isActive && <p className="lock-notice">Veículos ficam bloqueados para alterações e seleção enquanto o estacionamento estiver ativo.</p>}
        {data.vehicles.length === 0 ? (
          <EmptyState title="Nenhum veículo por aqui" icon={<CarFront size={23} />}>Adicione um veículo para poder iniciar uma sessão de estacionamento.</EmptyState>
        ) : (
          <div className="vehicle-list">
            {data.vehicles.map((vehicle) => {
              const selected = vehicle.id === data.settings.selectedVehicleId
              return (
                <article className={`vehicle-item ${selected ? 'vehicle-item--selected' : ''}`} key={vehicle.id}>
                  <div className="vehicle-item__main">
                    <span className="vehicle-icon"><CarFront size={19} /></span>
                    <div><h3>{vehicle.nickname || vehicle.makeModel || 'Veículo'}</h3><p>{vehicle.makeModel} · {vehicle.plate}</p><span className="vehicle-type">{vehicleTypeLabel(vehicle.type)}</span></div>
                  </div>
                  <div className="vehicle-item__actions">
                    <button className={`button button--small ${selected ? 'button--selected' : 'button--outline'}`} disabled={busy || isActive || selected} onClick={() => void selectVehicle(vehicle.id)}>{selected ? 'Selecionado' : 'Selecionar'}</button>
                    <button className="icon-button" aria-label={`Editar ${vehicle.nickname || vehicle.makeModel}`} disabled={busy || isActive} onClick={() => editVehicle(vehicle)}><Edit3 size={17} /></button>
                    <button className="icon-button icon-button--danger" aria-label={`Excluir ${vehicle.nickname || vehicle.makeModel}`} disabled={busy || isActive} onClick={() => void removeVehicle(vehicle)}><Trash2 size={17} /></button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {formOpen ? (
          <form className="vehicle-form" onSubmit={(event) => void submitVehicle(event)}>
            <div className="section-heading"><h3>{editingVehicle ? 'Editar veículo' : 'Adicionar veículo'}</h3><button type="button" className="icon-button" aria-label="Fechar formulário" onClick={() => setFormOpen(false)}><X size={18} /></button></div>
            <label className="form-field"><span>Tipo de veículo *</span>
              <select className="text-input" required value={vehicleForm.type} onChange={(event) => setVehicleForm({ ...vehicleForm, type: event.target.value as VehicleType })}>
                <option value="car">Carro</option><option value="motorcycle">Moto</option>
              </select>
            </label>
            <label className="form-field"><span>Marca e modelo</span><input className="text-input" value={vehicleForm.makeModel} onChange={(event) => setVehicleForm({ ...vehicleForm, makeModel: event.target.value })} placeholder="Ex.: modelo do veículo" /></label>
            <label className="form-field"><span>Placa</span><input className="text-input" value={vehicleForm.plate} onChange={(event) => setVehicleForm({ ...vehicleForm, plate: event.target.value })} /></label>
            <label className="form-field"><span>Apelido (opcional)</span><input className="text-input" value={vehicleForm.nickname} onChange={(event) => setVehicleForm({ ...vehicleForm, nickname: event.target.value })} /></label>
            <div className="form-actions"><button type="button" className="button button--outline" onClick={() => setFormOpen(false)}>Cancelar</button><button type="submit" className="button button--primary" disabled={busy}>Salvar veículo</button></div>
          </form>
        ) : (
          <button className="button button--outline button--full add-vehicle-button" disabled={busy || isActive} onClick={openNewVehicle}><Plus size={17} /> Adicionar veículo</button>
        )}
      </section>
      <p className="privacy-note">Os dados ficam armazenados apenas neste navegador.</p>
    </div>
  )
}
