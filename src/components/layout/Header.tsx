import { Link, useNavigate } from 'react-router-dom'
import { SyncIndicator } from '../ui/SyncIndicator'

interface HeaderProps {
  title: string
  showBack?: boolean
  showSync?: boolean
}

export function Header({ title, showBack = false, showSync = false }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-green-600 px-4 py-3 text-white shadow-md">
      {showBack && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-1 hover:bg-green-700 active:bg-green-800"
          aria-label="Volver"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <Link to="/" className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-2xl" role="img" aria-label="Flor">🌷</span>
        <span className="truncate font-semibold text-lg">{title}</span>
      </Link>

      <SyncIndicator />
    </header>
  )
}
