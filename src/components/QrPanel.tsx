import { QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface QrPanelProps {
  payload: string
  title: string
  subtitle: string
  testId: string
}

export function QrPanel({ payload, title, subtitle, testId }: QrPanelProps) {
  return (
    <section className="qr-card" aria-label={title} data-testid={testId}>
      <div className="qr-card__heading">
        <span className="qr-card__icon"><QrCode size={20} aria-hidden="true" /></span>
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </div>
      <div className="qr-card__code">
        <QRCodeSVG value={payload} size={190} level="M" title={title} />
      </div>
      <p className="qr-card__caption">Código demonstrativo · leitura simulada no aplicativo</p>
    </section>
  )
}
