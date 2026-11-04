import { WalletCards } from 'lucide-react'
import { formatMoney } from '../utils/format'

export function BalanceCard({ cents }: { cents: number }) {
  return (
    <section className="balance-card" aria-label="Saldo disponível">
      <div className="balance-card__top">
        <span className="balance-card__label">Saldo virtual disponível</span>
        <span className="balance-card__icon"><WalletCards size={19} aria-hidden="true" /></span>
      </div>
      <p className="balance-card__amount">{formatMoney(cents)}</p>
      <p className="balance-card__note">Uso demonstrativo · sem transações reais</p>
    </section>
  )
}
