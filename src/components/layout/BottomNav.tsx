import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
    isActive ? 'text-primary' : 'text-gray-500'
  }`

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <NavLink to="/supervisor" end className={linkClass}>
        <span className="text-lg" aria-hidden>
          ⌂
        </span>
        Inicio
      </NavLink>
      <NavLink to="/supervisor/nuevo" className={linkClass}>
        <span className="text-lg" aria-hidden>
          ＋
        </span>
        Nuevo
      </NavLink>
      <NavLink to="/supervisor/pendientes" className={linkClass}>
        <span className="text-lg" aria-hidden>
          ↻
        </span>
        Pendientes
      </NavLink>
      <NavLink to="/supervisor/historial" className={linkClass}>
        <span className="text-lg" aria-hidden>
          ≡
        </span>
        Historial
      </NavLink>
    </nav>
  )
}
