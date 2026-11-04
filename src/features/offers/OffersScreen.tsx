import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Copy, Gift, ImagePlus, Pencil, Plus, Store, Trash2, X } from 'lucide-react'
import { useApp } from '../../app/AppContext'
import { EmptyState } from '../../components/EmptyState'
import type { Offer } from '../../types'

const emptyDraft = {
  storeName: '',
  category: '',
  title: '',
  description: '',
  benefit: '',
  couponCode: '',
  validUntil: '',
  conditions: '',
  sponsored: false,
  imageBlob: undefined as Blob | undefined,
}

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function OfferImage({ image }: { image?: Blob }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!image) {
      setUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(image)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  return url
    ? <img className="offer-image" src={url} alt="" />
    : <div className="offer-image offer-image--placeholder" aria-label="Sem imagem"><Gift size={29} aria-hidden="true" /><span>Oferta</span></div>
}

export function OffersScreen() {
  const { data, busy, saveOffer, deleteOffer, perform } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)

  const categories = useMemo(() => Array.from(new Set(data?.offers.map((offer) => offer.category.trim()).filter(Boolean) ?? [])).sort(), [data?.offers])
  const offers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    return (data?.offers ?? []).filter((offer) => {
      const matchesQuery = !normalizedQuery || `${offer.storeName} ${offer.title} ${offer.description}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
      return matchesQuery && (category === 'all' || offer.category === category)
    })
  }, [data?.offers, query, category])

  if (!data) return null

  const startNewOffer = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setFormOpen(true)
  }

  const startEdit = (offer: Offer) => {
    setEditingId(offer.id)
    setDraft({
      storeName: offer.storeName,
      category: offer.category,
      title: offer.title,
      description: offer.description,
      benefit: offer.benefit,
      couponCode: offer.couponCode,
      validUntil: offer.validUntil,
      conditions: offer.conditions,
      sponsored: offer.sponsored,
      imageBlob: offer.imageBlob,
    })
    setFormOpen(true)
  }

  const submitOffer = async (event: FormEvent) => {
    event.preventDefault()
    const existing = data.offers.find((offer) => offer.id === editingId)
    const timestamp = Date.now()
    const offer: Offer = {
      ...draft,
      id: editingId ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }
    const success = await saveOffer(offer)
    if (success) {
      setFormOpen(false)
      setEditingId(null)
      setDraft(emptyDraft)
    }
  }

  const removeOffer = async (offer: Offer) => {
    if (window.confirm(`Excluir a oferta "${offer.title}"? Esta ação não pode ser desfeita.`)) {
      await deleteOffer(offer.id)
    }
  }

  const copyCoupon = async (code: string) => {
    if (!navigator.clipboard?.writeText) {
      await perform(() => Promise.reject(new Error('Este navegador não permite copiar automaticamente. Selecione e copie o código manualmente.')))
      return
    }
    await perform(() => navigator.clipboard.writeText(code), 'Código do cupom copiado.')
  }

  return (
    <div className="screen-stack">
      <section className="screen-intro">
        <p className="eyebrow">VANTAGENS LOCAIS</p>
        <h1>Ofertas</h1>
        <p>Conheça os benefícios cadastrados para esta demonstração.</p>
      </section>
      <div className="offers-disclaimer"><Gift size={17} aria-hidden="true" /><p>Ofertas demonstrativas. Cupons não são validados e podem não ser resgatáveis em lojas.</p></div>

      {(data.offers.length > 0 || formOpen) && (
        <section className="card filters-card offers-filters">
          <label className="form-field"><span>Buscar por loja ou oferta</span><input className="text-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite para buscar" /></label>
          <label className="form-field"><span>Categoria</span>
            <select className="text-input" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">Todas as categorias</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </section>
      )}

      {offers.length > 0 ? (
        <div className="offers-list">
          {offers.map((offer) => (
            <article className="card offer-card" key={offer.id}>
              <OfferImage image={offer.imageBlob} />
              <div className="offer-card__content">
                <div className="offer-card__meta"><span className="category-tag">{offer.category}</span>{offer.sponsored && <span className="sponsored-tag">Patrocinada</span>}</div>
                <p className="offer-card__store"><Store size={14} /> {offer.storeName}</p>
                <h2>{offer.title}</h2>
                {offer.description && <p className="offer-card__description">{offer.description}</p>}
                {offer.benefit && <p className="offer-benefit">{offer.benefit}</p>}
                {offer.couponCode && <div className="coupon-row"><code>{offer.couponCode}</code><button className="button button--small button--outline" onClick={() => void copyCoupon(offer.couponCode)}><Copy size={15} /> Copiar</button></div>}
                {offer.validUntil && <p className="offer-terms">Válida até {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${offer.validUntil}T12:00:00Z`))}</p>}
                {offer.conditions && <p className="offer-terms">{offer.conditions}</p>}
                <div className="offer-admin-actions">
                  <button className="button button--small button--outline" disabled={busy} onClick={() => startEdit(offer)}><Pencil size={14} /> Editar</button>
                  <button className="button button--small button--danger-outline" disabled={busy} onClick={() => void removeOffer(offer)}><Trash2 size={14} /> Excluir</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : data.offers.length > 0 ? (
        <EmptyState title="Nenhuma oferta encontrada" icon={<Gift size={23} />}>Altere a busca ou selecione outra categoria.</EmptyState>
      ) : (
        <EmptyState title="Nenhuma oferta cadastrada" icon={<Gift size={24} />}>As ofertas adicionadas para demonstração aparecerão aqui.</EmptyState>
      )}

      {formOpen ? (
        <form className="card offer-form" onSubmit={(event) => void submitOffer(event)}>
          <div className="section-heading"><h2>{editingId ? 'Editar oferta' : 'Nova oferta'}</h2><button type="button" className="icon-button" aria-label="Fechar formulário" onClick={() => setFormOpen(false)}><X size={18} /></button></div>
          <label className="form-field"><span>Nome da loja *</span><input className="text-input" required value={draft.storeName} onChange={(event) => setDraft({ ...draft, storeName: event.target.value })} /></label>
          <label className="form-field"><span>Categoria *</span><input className="text-input" required list="offer-categories" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Ex.: Alimentação" /><datalist id="offer-categories">{['Alimentação', 'Moda', 'Tecnologia', 'Lazer'].map((item) => <option key={item} value={item} />)}</datalist></label>
          <label className="form-field"><span>Título da promoção *</span><input className="text-input" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="form-field"><span>Descrição (opcional)</span><textarea className="text-input text-area" rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
          <label className="form-field"><span>Desconto ou benefício (opcional)</span><input className="text-input" value={draft.benefit} onChange={(event) => setDraft({ ...draft, benefit: event.target.value })} /></label>
          <label className="form-field"><span>Código do cupom (opcional)</span><input className="text-input" value={draft.couponCode} onChange={(event) => setDraft({ ...draft, couponCode: event.target.value })} /></label>
          <label className="form-field"><span>Validade (opcional)</span><input className="text-input" type="date" value={draft.validUntil} onChange={(event) => setDraft({ ...draft, validUntil: event.target.value })} /></label>
          <label className="form-field"><span>Condições (opcional)</span><textarea className="text-input text-area" rows={2} value={draft.conditions} onChange={(event) => setDraft({ ...draft, conditions: event.target.value })} /></label>
          <label className="form-field"><span>Imagem (opcional)</span><input className="text-input file-input" type="file" accept={acceptedImageTypes.join(',')} onChange={(event) => {
            const file = event.target.files?.[0]
            if (file && !acceptedImageTypes.includes(file.type)) {
              event.currentTarget.value = ''
              void perform(() => Promise.reject(new Error('Formato de imagem não aceito. Use JPEG, PNG, WebP ou GIF.')))
              return
            }
            setDraft({ ...draft, imageBlob: file ?? draft.imageBlob })
          }} /></label>
          {draft.imageBlob && <label className="checkbox-field"><input type="checkbox" onChange={(event) => event.target.checked && setDraft({ ...draft, imageBlob: undefined })} /><span>Remover imagem atual</span></label>}
          <label className="checkbox-field"><input type="checkbox" checked={draft.sponsored} onChange={(event) => setDraft({ ...draft, sponsored: event.target.checked })} /><span>Indicar como patrocinada</span></label>
          <div className="form-actions"><button type="button" className="button button--outline" onClick={() => setFormOpen(false)}>Cancelar</button><button type="submit" className="button button--primary" disabled={busy}><ImagePlus size={16} /> Salvar oferta</button></div>
        </form>
      ) : (
        <button className="button button--primary button--full" disabled={busy} onClick={startNewOffer}><Plus size={18} /> Adicionar oferta</button>
      )}
    </div>
  )
}
