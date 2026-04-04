import { NavLink } from 'react-router-dom'

const item =
  'block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-primary'

const active = 'bg-green-100 text-primary'

export function AdminNav() {
  return (
    <nav className="flex w-full flex-col gap-0.5 border-b border-gray-200 bg-white p-3 md:w-56 md:border-b-0 md:border-r">
      <NavLink to="/admin" end className={({ isActive }) => `${item} ${isActive ? active : ''}`}>
        Dashboard
      </NavLink>
      <NavLink
        to="/admin/areas"
        className={({ isActive }) => `${item} ${isActive ? active : ''}`}
      >
        Áreas
      </NavLink>
      <NavLink
        to="/admin/colaboradores"
        className={({ isActive }) => `${item} ${isActive ? active : ''}`}
      >
        Colaboradores
      </NavLink>
      <NavLink
        to="/admin/usuarios"
        className={({ isActive }) => `${item} ${isActive ? active : ''}`}
      >
        Usuarios
      </NavLink>
    </nav>
  )
}
