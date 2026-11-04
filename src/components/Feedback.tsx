import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useApp } from '../app/AppContext'

export function Feedback() {
  const { error, notice, dismissMessage } = useApp()
  if (!error && !notice) return null
  const isError = Boolean(error)
  return (
    <div className={`feedback ${isError ? 'feedback--error' : 'feedback--success'}`} role={isError ? 'alert' : 'status'}>
      {isError ? <AlertCircle size={19} aria-hidden="true" /> : <CheckCircle2 size={19} aria-hidden="true" />}
      <span>{error || notice}</span>
      <button className="icon-button feedback__close" aria-label="Fechar mensagem" onClick={dismissMessage}>
        <X size={17} />
      </button>
    </div>
  )
}
