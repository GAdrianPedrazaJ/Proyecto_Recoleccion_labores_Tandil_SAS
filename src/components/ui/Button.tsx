import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Botón primario (verde) o secundario; extender variantes según diseño. */
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: Props) {
  const base =
    'min-h-11 w-full rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50 sm:w-auto'
  const styles = {
    primary: 'bg-primary text-white shadow-sm hover:bg-green-600',
    secondary: 'border border-gray-300 bg-white text-ink hover:bg-gray-50',
    ghost: 'text-primary hover:bg-green-50',
  }[variant]
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  )
}
