import { createContext } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void
} | null>(null)
