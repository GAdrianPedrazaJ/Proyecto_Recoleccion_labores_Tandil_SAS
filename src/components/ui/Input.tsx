import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, id, className = '', ...rest },
  ref,
) {
  const inputId = id ?? rest.name
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-ink" htmlFor={inputId}>
      <span className="font-medium">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={`min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-ink outline-none ring-primary focus:ring-2 sm:text-sm ${className}`}
        {...rest}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
})
