import type { ReactNode } from 'react'

type Tone = 'default' | 'success' | 'warning' | 'danger'

/** Etiqueta compacta para estados (sync, tipo de día, etc.). */
export function Badge({
  children,
  tone = 'default',
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  const map: Record<Tone, string> = {
    default: 'bg-gray-100 text-ink',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
