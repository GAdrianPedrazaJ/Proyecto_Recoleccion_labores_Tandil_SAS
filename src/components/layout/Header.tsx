import { Link, useNavigate } from 'react-router-dom'
import { useSync } from '../../hooks/useSync'
import { Badge } from '../ui/Badge'

interface HeaderProps {
  title: string
  showBack?: boolean
  showSync?: boolean
}

export function Header({ title, showBack = false, showSync = false }: HeaderProps) {
  const navigate = useNavigate()
  const { pendingCount, syncing, sync } = useSync()

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

      {showSync && (
        <button
          type="button"
          onClick={sync}
          disabled={syncing}
          className="relative flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
          aria-label="Sincronizar"
        >
          <svg
            className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {pendingCount > 0 && (
            <Badge variant="yellow" className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] justify-center px-1">
              {pendingCount > 99 ? '99+' : pendingCount}
            </Badge>
          )}
        </button>
      )}
    </header>
  )
}
