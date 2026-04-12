import { useEffect, useState } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import { getAllFormularios, deleteFormulario } from '../services/db'
import { syncPendientes } from '../services/sync'
import type { Formulario } from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

type TipoFiltro = 'Todos' | 'Corte' | 'Labores' | 'Aseguramiento'

export default function Registros() {
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('Todos')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const navigate = useNavigation()

  const load = async () => {
    setLoading(true)
    const data = await getAllFormularios()
    setFormularios(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    await syncPendientes()
    await load()
    setSyncing(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    await deleteFormulario(id)
    setFormularios((prev) => prev.filter((f) => f.id !== id))
  }

  // Filtrar formularios según el tipo seleccionado
  const formulariosFiltrados =
    filtroTipo === 'Todos' ? formularios : formularios.filter((f) => f.tipo === filtroTipo)

  const pendingCount = formularios.filter((f) => !f.sincronizado && !f.errorPermanente).length

  // Contar formularios por tipo
  const contadores = {
    Todos: formularios.length,
    Corte: formularios.filter((f) => f.tipo === 'Corte').length,
    Labores: formularios.filter((f) => f.tipo === 'Labores').length,
    Aseguramiento: formularios.filter((f) => f.tipo === 'Aseguramiento').length,
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Registros" showBack />

      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Mis registros</h1>
          {pendingCount > 0 && (
            <Button variant="secondary" size="sm" loading={syncing} onClick={handleSync}>
              Sincronizar ({pendingCount})
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!loading && (
          <>
            {/* Filtro de tipo */}
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <label className="text-xs font-medium text-gray-600 block mb-2">Filtrar por tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Todos', 'Corte', 'Labores', 'Aseguramiento'] as TipoFiltro[]).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtroTipo === tipo
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {tipo} ({contadores[tipo]})
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de registros */}
            {formulariosFiltrados.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                {formularios.length === 0
                  ? 'No hay registros guardados todavía.'
                  : `No hay registros de tipo "${filtroTipo}".`}
              </div>
            )}

            <div className="space-y-3">
              {formulariosFiltrados.map((f) => (
                <Card key={f.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{f.areaNombre}</p>
                      <p className="text-xs text-gray-500">
                        {f.fecha} • {f.tipo} • {f.filas.length} colaborador{f.filas.length !== 1 ? 'es' : ''}
                      </p>
                      {f.ultimoError && (
                        <p className="mt-1 text-xs text-red-500 truncate">⚠️ {f.ultimoError}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <EstadoBadge formulario={f} />
                      <SyncBadge formulario={f} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {f.estado === 'borrador' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate('registro', { formularioId: f.id })}
                      >
                        Completar
                      </Button>
                    )}
                    {f.estado !== 'borrador' && <span />}
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function EstadoBadge({ formulario }: { formulario: Formulario }) {
  if (!formulario.estado || formulario.estado === 'completo') return null
  return <Badge variant="yellow">Borrador</Badge>
}

function SyncBadge({ formulario }: { formulario: Formulario }) {
  if (formulario.sincronizado) return <Badge variant="green">Sincronizado</Badge>
  if (formulario.errorPermanente) return <Badge variant="red">Error</Badge>
  return <Badge variant="yellow">Pendiente</Badge>
}
