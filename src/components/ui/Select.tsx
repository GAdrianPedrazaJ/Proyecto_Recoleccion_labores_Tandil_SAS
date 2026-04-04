import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
}

/** Select con label; opciones pasadas como `children` (`<option>`). */
export function Select({ label, error, id, className = '', children, ...rest }: Props) {
  const selectId = id ?? rest.name
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-ink" htmlFor={selectId}>
      <span className="font-medium">{label}</span>
      <select
        id={selectId}
        className={`rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-ink outline-none ring-primary focus:ring-2 ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
