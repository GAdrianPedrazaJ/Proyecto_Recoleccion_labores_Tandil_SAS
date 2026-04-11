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

export default function Historial() {
  const [formularios, setFormularios] = useState<Formulario[]>([])
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
    if (!confirm('Â¿Eliminar este registro del historial local?')) return
    await deleteFormulario(id)
    setFormularios((prev) => prev.filter((f) => f.id !== id))
  }

  const pendingCount = formularios.filter((f) => !f.sincronizado && !f.errorPermanente).length

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Historial" showBack />

      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Historial de registros</h1>
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

        {!loading && formularios.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No hay registros guardados todavÃ­a.
          </div>
        )}

        <div className="space-y-3">
          {formularios.map((f) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{f.areaNombre}</p>
                  <p className="text-xs text-gray-500">
                    {f.fecha} Â· {f.tipo} Â· {f.filas.length} colaborador{f.filas.length !== 1 ? 'es' : ''}
                  </p>
                  {f.ultimoError && (
                    <p className="mt-1 text-xs text-red-500 truncate">{f.ultimoError}</p>
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
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </Card>
          ))}
        </div>
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
