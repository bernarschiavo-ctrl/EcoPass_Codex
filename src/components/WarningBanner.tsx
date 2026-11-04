import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

export function WarningBanner({ children }: { children: ReactNode }) {
  return (
    <div className="warning-banner" role="alert">
      <AlertTriangle size={20} aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
