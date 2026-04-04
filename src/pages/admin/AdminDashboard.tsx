import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  countNoSincronizados,
  countRegistrosHoy,
  getAllAreas,
  getAllColaboradores,
} from '../../services/db'
import { todayIsoDate } from '../../utils/helpers'

export function AdminDashboard() {
  const [stats, setStats] = useState({
    areas: 0,
    colaboradores: 0,
    hoy: 0,
    pendientes: 0,
  })

  useEffect(() => {
    void (async () => {
      const [areas, cols, pend, hoy] = await Promise.all([
        getAllAreas(),
        getAllColaboradores(),
        countNoSincronizados(),
        countRegistrosHoy(todayIsoDate()),
      ])
      setStats({
        areas: areas.length,
        colaboradores: cols.length,
        hoy,
        pendientes: pend,
      })
    })()
  }, [])

  const cards: {
    label: string
    value: number
    to?: string
  }[] = [
    { label: 'Total áreas', value: stats.areas, to: '/admin/areas' },
    { label: 'Total colaboradores', value: stats.colaboradores, to: '/admin/colaboradores' },
    { label: 'Registros hoy', value: stats.hoy },
    { label: 'Pendientes sync', value: stats.pendientes },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-gray-600">Resumen general</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const inner = (
            <>
              <p className="text-sm font-medium text-gray-600">{c.label}</p>
              <p className="mt-2 text-3xl font-bold text-primary">{c.value}</p>
            </>
          )
          return c.to ? (
            <Link
              key={c.label}
              to={c.to}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary/40"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={c.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              {inner}
            </div>
          )
        })}
      </div>
      <nav className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
        <p className="mb-2 font-semibold text-ink">Accesos</p>
        <ul className="space-y-2 text-primary">
          <li>
            <Link to="/admin/areas" className="underline">
              Gestión de áreas
            </Link>
          </li>
          <li>
            <Link to="/admin/colaboradores" className="underline">
              Gestión de colaboradores
            </Link>
          </li>
          <li>
            <Link to="/admin/usuarios" className="underline">
              Gestión de usuarios
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
