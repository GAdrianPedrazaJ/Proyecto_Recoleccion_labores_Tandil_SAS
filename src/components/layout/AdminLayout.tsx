import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

// ─── sub-items de "Administrar" ───────────────────────────────────────────────
const ADMIN_ITEMS = [
  { to: '/admin/areas',         label: 'Áreas' },
  { to: '/admin/colaboradores', label: 'Colaboradores' },
  { to: '/admin/supervisores',  label: 'Supervisores' },
  { to: '/admin/bloques',       label: 'Bloques' },
  { to: '/admin/variedades',    label: 'Variedades' },
  { to: '/admin/labores',       label: 'Labores' },
]

const ADMIN_PATHS = ADMIN_ITEMS.map((i) => i.to)

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const usuario = useAuthStore((s) => s.usuario)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const path = location.pathname
  const isAdminSection = ADMIN_PATHS.includes(path)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navLink = (to: string, label: string) => {
    const active = path === to
    return (
      <Link
        key={to}
        to={to}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-white/20 text-white'
            : 'text-green-100 hover:bg-white/10 hover:text-white'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top Navbar ── */}
      <header className="bg-green-700 shadow-md sticky top-0 z-40">
        <div className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 h-14 flex items-center gap-2 sm:gap-4">
          {/* Brand */}
          <Link to="/admin" className="flex items-center gap-1 sm:gap-2 text-white font-bold text-sm sm:text-base whitespace-nowrap">
            🌿 <span className="hidden sm:inline">Labores Admin</span>
          </Link>

          {/* Nav principal - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navLink('/admin', 'Dashboard')}
            {navLink('/admin/estadisticas', 'Estadísticas')}
            {navLink('/admin/asignaciones', 'Asignaciones')}

            {/* Administrar dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isAdminSection
                    ? 'bg-white/20 text-white'
                    : 'text-green-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                Administrar
                <svg className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                  {ADMIN_ITEMS.map(({ to, label }) => {
                    const active = path === to
                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-green-50 text-green-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Usuario + Salir */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <span className="text-green-100 text-xs sm:text-sm hidden sm:block">{usuario?.nombre}</span>
            <button
              onClick={logout}
              className="text-xs sm:text-sm text-green-100 hover:text-white border border-green-500 hover:border-white rounded-lg px-2 sm:px-3 py-1.5 transition-colors whitespace-nowrap"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Sub-navbar cuando está en sección Administrar */}
        {isAdminSection && (
          <div className="bg-green-800 border-t border-green-600 overflow-x-auto">
            <div className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 h-10 flex items-center gap-1">
              {ADMIN_ITEMS.map(({ to, label }) => {
                const active = path === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`px-2 sm:px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-white text-green-800'
                        : 'text-green-200 hover:bg-green-700 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── Contenido ── */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  )
}
