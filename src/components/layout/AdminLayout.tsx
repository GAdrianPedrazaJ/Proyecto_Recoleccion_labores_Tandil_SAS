import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import {
  LayoutDashboard,
  Network,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  Building2,
  MapPin,
  Users2,
  Layers,
  Flower2,
  Briefcase
} from 'lucide-react'

// ─── sub-items de "Administrar" ───────────────────────────────────────────────
const ADMIN_ITEMS = [
  { path: '/admin/sedes',         label: 'Sedes',         icon: Building2, superAdminOnly: true },
  { path: '/admin/areas',         label: 'Áreas',         icon: MapPin },
  { path: '/admin/colaboradores', label: 'Colaboradores', icon: Users2 },
  { path: '/admin/supervisores',  label: 'Supervisores',  icon: ShieldCheck },
  { path: '/admin/bloques',       label: 'Bloques',       icon: Layers },
  { path: '/admin/variedades',    label: 'Variedades',    icon: Flower2 },
  { path: '/admin/labores',       label: 'Labores',       icon: Briefcase },
]

const ADMIN_PATHS = ADMIN_ITEMS.map((i) => i.path)

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const usuario = useAuthStore((s) => s.usuario)
  const isSuperAdmin = usuario?.rol === 'superadministrador'
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandAdminMobile, setExpandAdminMobile] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentPath = location.pathname
  const isAdminSection = ADMIN_PATHS.some(path => currentPath.startsWith(path))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [currentPath])

  const navButton = (path: string, label: string, Icon: any) => {
    const active = currentPath === path
    return (
      <Link
        key={path}
        to={path}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
          active
            ? 'bg-white text-green-800 shadow-sm'
            : 'text-green-100 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon className={`w-4 h-4 ${active ? 'text-green-600' : 'text-green-200 opacity-70'}`} />
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased">
      {/* ── Main Header ── */}
      <header className="bg-gradient-to-r from-green-800 to-green-700 shadow-lg sticky top-0 z-40 border-b border-green-900/20">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Brand & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link to="/admin" className="flex items-center gap-2.5 group">
              <div className="bg-white/10 p-2 rounded-xl group-hover:bg-white/20 transition-colors">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-black text-xl tracking-tighter uppercase hidden sm:inline-block">
                Labores<span className="text-green-300">Admin</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navButton('/admin', 'Dashboard', LayoutDashboard)}
              {navButton('/admin/asignaciones', 'Mapa', Network)}
              {isSuperAdmin && navButton('/admin/usuarios', 'Usuarios', ShieldCheck)}

              {/* Administrar Dropdown */}
              <div ref={dropdownRef} className="relative ml-1">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isAdminSection
                      ? 'bg-white text-green-800 shadow-sm'
                      : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Settings className={`w-4 h-4 ${isAdminSection ? 'text-green-600' : 'text-green-200 opacity-70'}`} />
                  Catálogos
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 mb-1 border-b border-gray-50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Maestros del Sistema</p>
                    </div>
                    {ADMIN_ITEMS.filter((i) => !i.superAdminOnly || isSuperAdmin).map(({ path, label, icon: Icon }) => {
                      const active = currentPath === path
                      return (
                        <Link
                          key={path}
                          to={path}
                          onClick={() => setMenuOpen(false)}
                          className={`w-[92%] mx-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            active
                              ? 'bg-green-50 text-green-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                          {label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-white text-sm font-black leading-tight">{usuario?.nombre}</span>
              <span className="text-green-200 text-[10px] font-bold uppercase tracking-widest opacity-80">{usuario?.rol}</span>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block mx-1" />

            <button
              onClick={logout}
              className="group flex items-center gap-2 bg-white/10 hover:bg-red-500/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 hover:border-red-500/30"
            >
              <LogOut className="w-4 h-4 text-green-200 group-hover:text-red-300" />
              <span className="hidden sm:inline">Salir</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Dynamic Sub-header for Admin Sections */}
        {isAdminSection && (
          <div className="bg-green-900/20 backdrop-blur-md border-t border-white/5 overflow-x-auto no-scrollbar hidden lg:block">
            <div className="w-full max-w-screen-xl mx-auto px-6 h-12 flex items-center gap-2">
              {ADMIN_ITEMS.filter((i) => !i.superAdminOnly || isSuperAdmin).map(({ path, label, icon: Icon }) => {
                const active = currentPath === path
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-white text-green-900 shadow-md'
                        : 'text-green-100/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 p-3 rounded-2xl shadow-lg shadow-green-100">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-gray-900 leading-tight">{usuario?.nombre}</p>
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">{usuario?.rol}</p>
                </div>
              </div>

              <nav className="space-y-1.5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2">Menú Principal</p>
                <MobileLink to="/admin" icon={LayoutDashboard} label="Dashboard" active={currentPath === '/admin'} />
                <MobileLink to="/admin/asignaciones" icon={Network} label="Mapa de Asignaciones" active={currentPath === '/admin/asignaciones'} />
                {isSuperAdmin && <MobileLink to="/admin/usuarios" icon={ShieldCheck} label="Gestión de Usuarios" active={currentPath === '/admin/usuarios'} />}

                <div className="pt-6">
                  <button
                    onClick={() => setExpandAdminMobile(!expandAdminMobile)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-gray-400" />
                      <span>Administrar</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandAdminMobile ? 'rotate-180' : ''}`} />
                  </button>

                  {expandAdminMobile && (
                    <div className="mt-2 space-y-1 pl-4">
                      {ADMIN_ITEMS.filter((i) => !i.superAdminOnly || isSuperAdmin).map(({ path, label, icon: Icon }) => (
                        <MobileLink key={path} to={path} icon={Icon} label={label} active={currentPath === path} sub />
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              <div className="pt-8 border-t border-gray-100">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-black text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  SALIR DEL SISTEMA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-screen-xl mx-auto px-6 py-8 border-t border-gray-200/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400">
          <p className="text-xs font-bold tracking-tight uppercase">© {new Date().getFullYear()} Tandil SAS · Gestión de Labores</p>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
            <span className="hover:text-green-600 cursor-pointer transition-colors">Soporte</span>
            <span className="hover:text-green-600 cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-green-600 cursor-pointer transition-colors">v1.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function MobileLink({ to, icon: Icon, label, active, sub = false }: any) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
        active
          ? 'bg-green-50 text-green-700 ring-1 ring-green-100'
          : 'text-gray-600 hover:bg-gray-50'
      } ${sub ? 'text-sm' : ''}`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-400'} ${sub ? 'w-4 h-4' : ''}`} />
      {label}
    </Link>
  )
}

function Sprout(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 20 3-3 3 3M10 10c0-2.21-1.79-4-4-4-2.21 0-4 1.79-4 4 0 2.21 1.79 4 4 4h4v4h4c2.21 0 4-1.79 4-4 0-2.21-1.79-4-4-4-2.21 0-4 1.79-4 4"/></svg>
  )
}
