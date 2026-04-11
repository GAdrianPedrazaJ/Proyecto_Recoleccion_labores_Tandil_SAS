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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandAdminMobile, setExpandAdminMobile] = useState(false)
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

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [path])

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

          {/* Hamburger menu button - visible on mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden ml-auto p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

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

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu */}
          <div className="absolute inset-y-0 right-0 w-64 bg-white shadow-lg overflow-y-auto">
            <div className="p-4 space-y-2">
              {/* Close button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Navigation Links */}
              <div className="space-y-1 mt-8">
                {/* Dashboard */}
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                    path === '/admin'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📊 Dashboard
                </Link>

                {/* Estadísticas */}
                <Link
                  to="/admin/estadisticas"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                    path === '/admin/estadisticas'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📈 Estadísticas
                </Link>

                {/* Asignaciones */}
                <Link
                  to="/admin/asignaciones"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                    path === '/admin/asignaciones'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📋 Asignaciones
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2" />

                {/* Administrar Section */}
                <button
                  onClick={() => setExpandAdminMobile(!expandAdminMobile)}
                  className="w-full text-left px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  ⚙️ Administrar
                  <svg
                    className={`w-4 h-4 transition-transform ${expandAdminMobile ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandAdminMobile && (
                  <div className="pl-4 space-y-1">
                    {ADMIN_ITEMS.map(({ to, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                          path === to
                            ? 'bg-green-50 text-green-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 my-2" />

                {/* User Info */}
                <div className="px-4 py-2 text-sm text-gray-700 font-medium">
                  👤 {usuario?.nombre}
                </div>

                {/* Logout */}
                <button
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  🚪 Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Contenido ── */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  )
}
