import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useColaboradores } from '../hooks/useColaboradores'
import { getAreaById } from '../services/db'
import type { Area } from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'

export default function AreaDetalle() {
  const { areaId } = useParams<{ areaId: string }>()
  const navigate = useNavigate()
  const { colaboradores, loading } = useColaboradores(areaId ?? '')
  const [area, setArea] = useState<Area | null>(null)

  useEffect(() => {
    if (!areaId) return
    getAreaById(decodeURIComponent(areaId)).then((a) => setArea(a ?? null))
  }, [areaId])

  const activos = colaboradores.filter((c) => c.activo !== false)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title={area?.nombre ?? 'Área'} showBack showSync />

      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{area?.nombre ?? '...'}</h1>
            {area?.sede && <p className="text-sm text-gray-500">Sede: {area.sede}</p>}
          </div>
          <Badge variant="green">{activos.length} colaboradores</Badge>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate(`/area/${areaId}/registro`)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Registro
        </Button>

        <h2 className="font-semibold text-gray-700">Colaboradores del área</h2>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!loading && activos.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            No hay colaboradores en esta área. Sincroniza para actualizar.
          </div>
        )}

        <div className="grid gap-2">
          {activos.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                  {c.nombre.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{c.nombre}</p>
                </div>
                {c.externo && (
                  <Badge variant="blue">Externo</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
