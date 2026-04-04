import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
    isActive ? 'text-primary' : 'text-gray-500'
  }`

/** Navegación inferior para las 4 rutas principales. */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" end className={linkClass}>
        <span aria-hidden>⌂</span>
        Inicio
      </NavLink>
      <NavLink to="/nuevo" className={linkClass}>
        <span aria-hidden>＋</span>
        Nuevo
      </NavLink>
      <NavLink to="/pendientes" className={linkClass}>
        <span aria-hidden>↻</span>
        Pendientes
      </NavLink>
      <NavLink to="/historial" className={linkClass}>
        <span aria-hidden>≡</span>
        Historial
      </NavLink>
    </nav>
  )
}
