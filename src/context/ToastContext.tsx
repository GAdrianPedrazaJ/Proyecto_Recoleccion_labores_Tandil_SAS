import { createContext, useCallback, useState, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void
} | null>(null)

type ToastItem = { id: number; message: string; type: ToastType }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, type }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-24 left-1/2 z-[100] flex max-w-md -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-8"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              t.type === 'success'
                ? 'bg-green-600 text-white'
                : t.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-ink text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
