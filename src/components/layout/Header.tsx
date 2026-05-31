import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { SyncIndicator } from '../ui/SyncIndicator'

interface HeaderProps {
  title: string
  showBack?: boolean
  showUser?: boolean
}

export function Header({ title, showBack = false, showUser = true }: HeaderProps) {
  const navigate = useNavigate()
  const { usuario, logout } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  const isAdmin = usuario?.rol === 'administrador' || usuario?.rol === 'superadministrador'

  const handleLogout = () => {
    logout()
    setShowMenu(false)
    navigate('/login', { replace: true })
  }

  const handleHomeClick = () => {
    if (isAdmin) {
      navigate('/admin')
    } else {
      navigate('/areas')
    }
  }

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

      <button 
        onClick={handleHomeClick}
        className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 active:opacity-70 transition-opacity text-left"
      >
        <span className="text-2xl" role="img" aria-label="Flor">🌷</span>
        <span className="truncate font-semibold text-lg">{title}</span>
      </button>

      <SyncIndicator />

      {/* User menu */}
      {showUser && usuario && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-green-700 transition"
            title={`${usuario.nombre} (${usuario.rol})`}
          >
            <span className="hidden sm:inline text-sm">👤 {usuario.nombre}</span>
            <span className="inline sm:hidden text-sm">{isAdmin ? '👨‍💼' : '👤'}</span>
            <svg
              className={`h-4 w-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 rounded-lg bg-white text-gray-900 shadow-lg overflow-hidden min-w-[180px] z-40">
              <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                <p className="font-semibold text-sm truncate">{usuario.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{usuario.rol}</p>
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate('/admin')
                    setShowMenu(false)
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition border-b border-gray-100"
                >
                  📊 Panel Administrador
                </button>
              )}

              <button
                onClick={() => {
                  handleHomeClick()
                  setShowMenu(false)
                }}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition"
              >
                🏠 Inicio
              </button>

              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition font-medium"
              >
                🚪 Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
