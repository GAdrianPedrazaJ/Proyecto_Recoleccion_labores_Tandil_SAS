import type { InputHTMLAttributes } from 'react'

/** Input de texto con label; enlazar con react-hook-form vía `register` o `ref`. */
type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...rest }: Props) {
  const inputId = id ?? rest.name
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-ink" htmlFor={inputId}>
      <span className="font-medium">{label}</span>
      <input
        id={inputId}
        className={`rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-ink outline-none ring-primary focus:ring-2 ${className}`}
        {...rest}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
