import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useRegistros } from '../hooks/useRegistros'
import { Button } from '../components/ui/Button'
import { ColaboradorCard } from '../components/form/ColaboradorCard'

const btnPrimary =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600'

/** Pantalla inicio: resumen del día y accesos rápidos. */
export function Home() {
  const { supervisor, sede, registrosHoy } = useAppStore()
  const { loading, reload } = useRegistros()

  return (
    <div className="space-y-4 px-4 py-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Hoy</h2>
        <p className="mt-1 text-sm text-gray-600">
          Supervisor: {supervisor || '—'} · Sede: {sede || '—'}
        </p>
        <p className="text-sm text-gray-600">
          Registros guardados hoy: {loading ? '…' : registrosHoy.length}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/nuevo" className={btnPrimary}>
            Nuevo registro
          </Link>
          <Button type="button" variant="secondary" onClick={() => void reload()}>
            Actualizar lista
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Colaboradores (hoy)</h3>
        {registrosHoy.length === 0 ? (
          <p className="text-sm text-gray-500">No hay formularios con fecha de hoy.</p>
        ) : (
          registrosHoy.flatMap((f) =>
            f.colaboradores.map((c) => <ColaboradorCard key={c.id} row={c} />),
          )
        )}
      </section>
    </div>
  )
}
