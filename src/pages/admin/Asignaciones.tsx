import { useEffect, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { getAllAreas, getAllColaboradores, getAllBloques, putColaborador } from '../../services/db'
import type { Area, Bloque, Colaborador } from '../../types'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Spinner } from '../../components/ui/Spinner'

// ─── Tarjeta colaborador draggable ────────────────────────────────────────────

function ColabCard({ colab, isDragging = false }: { colab: Colaborador; isDragging?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-grab select-none transition-all ${
      isDragging
        ? 'opacity-40 border-gray-300 bg-white'
        : 'border-gray-200 bg-white hover:border-green-400 hover:shadow-sm'
    }`}>
      <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
        {colab.nombre.charAt(0)}
      </div>
      <span className="font-medium text-gray-800 truncate">{colab.nombre}</span>
      {colab.externo && <span className="ml-auto text-xs text-purple-600 bg-purple-50 rounded px-1">ext.</span>}
    </div>
  )
}

function DraggableColab({ colab }: { colab: Colaborador }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: colab.id, data: { colab } })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <ColabCard colab={colab} isDragging={isDragging} />
    </div>
  )
}

// ─── Zona de drop ─────────────────────────────────────────────────────────────

function DropZone({ id, label, colabs, color = 'gray' }: { id: string; label: string; colabs: Colaborador[]; color?: string }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  const colorMap: Record<string, string> = {
    gray:   'border-gray-200 bg-gray-50',
    green:  'border-green-300 bg-green-50',
    blue:   'border-blue-300 bg-blue-50',
    yellow: 'border-yellow-300 bg-yellow-50',
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 transition-all min-h-[100px] p-3 ${isOver ? 'border-green-500 bg-green-50 shadow-inner' : colorMap[color] ?? colorMap.gray}`}
    >
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="space-y-1.5">
        {colabs.map((c) => (
          <DraggableColab key={c.id} colab={c} />
        ))}
        {colabs.length === 0 && (
          <p className={`text-center text-xs py-3 ${isOver ? 'text-green-600' : 'text-gray-400'}`}>
            {isOver ? 'Soltar aquí' : 'Sin asignados'}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminAsignaciones() {
  const [areas, setAreas] = useState<Area[]>([])
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [activeColab, setActiveColab] = useState<Colaborador | null>(null)
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>('ALL')
  const [modoVista, setModoVista] = useState<'areas' | 'bloques'>('areas')

  const load = async () => {
    setLoading(true)
    const [a, b, c] = await Promise.all([getAllAreas(), getAllBloques(), getAllColaboradores()])
    setAreas(a); setBloques(b); setColaboradores(c)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const colab = colaboradores.find((c) => c.id === active.id)
    setActiveColab(colab ?? null)
  }

  const handleDragEnd = useCallback(async ({ active, over }: DragEndEvent) => {
    setActiveColab(null)
    if (!over || active.id === over.id) return

    const colabId = String(active.id)
    const destId = String(over.id)

    setColaboradores((prev) =>
      prev.map((c) => {
        if (c.id !== colabId) return c
        // Determinar si drop en área o bloque
        if (destId === 'sin-asignar') {
          return { ...c, areaId: '', asignado: false }
        }
        // Es un área: actualizar areaId
        const area = areas.find((a) => a.id === destId)
        if (area) return { ...c, areaId: area.id, asignado: true }
        // Es un bloque: mantener área del bloque pero no cambia el areaId directamente
        return c
      })
    )

    // Persistir en IDB
    const updated = colaboradores.find((c) => c.id === colabId)
    if (updated) {
      const area = areas.find((a) => a.id === destId)
      const updatedColab: Colaborador = area
        ? { ...updated, areaId: area.id, asignado: true }
        : destId === 'sin-asignar'
        ? { ...updated, areaId: '', asignado: false }
        : updated
      await putColaborador(updatedColab)
    }
  }, [colaboradores, areas])

  // Organizar por área/bloque
  const colabSinAsignar = colaboradores.filter((c) => !c.areaId || !c.asignado)
  const colabPorArea = (areaId: string) => colaboradores.filter((c) => c.areaId === areaId && c.asignado)

  const areasFiltradas = areaSeleccionada === 'ALL'
    ? areas
    : areas.filter((a) => a.id === areaSeleccionada)

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Arrastrá colaboradores para asignarlos a áreas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={areaSeleccionada}
            onChange={(e) => setAreaSeleccionada(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            <option value="ALL">Todas las áreas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <div className="flex gap-1 rounded-lg bg-gray-200 p-1">
            <button onClick={() => setModoVista('areas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${modoVista === 'areas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Por área</button>
            <button onClick={() => setModoVista('bloques')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${modoVista === 'bloques' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Por bloque</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 items-start">
            {/* Panel izquierdo: sin asignar */}
            <div className="w-72 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-20">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-700">Sin asignar</h2>
                  <span className="text-xs text-white bg-gray-400 rounded-full px-2 py-0.5">{colabSinAsignar.length}</span>
                </div>
                <DropZone id="sin-asignar" label="" colabs={colabSinAsignar} color="gray" />
              </div>
            </div>

            {/* Panel derecho: áreas / bloques */}
            <div className="flex-1 min-w-0">
              {modoVista === 'areas' && (
                <div className="grid grid-cols-2 gap-4">
                  {areasFiltradas.map((area) => {
                    const asignados = colabPorArea(area.id)
                    return (
                      <div key={area.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-sm font-bold text-gray-800">{area.nombre}</h2>
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${asignados.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {asignados.length} colaborador{asignados.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <DropZone id={area.id} label="" colabs={asignados} color="green" />
                      </div>
                    )
                  })}
                  {areasFiltradas.length === 0 && (
                    <p className="col-span-2 text-center text-gray-400 py-10 text-sm">Sin áreas disponibles</p>
                  )}
                </div>
              )}

              {modoVista === 'bloques' && (
                <div className="space-y-5">
                  {areasFiltradas.map((area) => {
                    const bloquesDe = bloques.filter((b) => b.areaId === area.id)
                    if (bloquesDe.length === 0) return null
                    return (
                      <div key={area.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <h2 className="text-base font-bold text-gray-800 mb-3">{area.nombre}</h2>
                        <div className="grid grid-cols-3 gap-3">
                          {bloquesDe.map((bloque) => (
                            <div key={bloque.id}>
                              <p className="text-xs font-semibold text-gray-500 mb-1.5">{bloque.nombre}</p>
                              <DropZone id={`bloque-${bloque.id}`} label="" colabs={[]} color="blue" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {areasFiltradas.every((a) => bloques.filter((b) => b.areaId === a.id).length === 0) && (
                    <p className="text-center text-gray-400 py-10 text-sm">No hay bloques configurados</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Overlay al arrastrar */}
          <DragOverlay>
            {activeColab && (
              <div className="rotate-2 scale-105 shadow-xl rounded-lg border-2 border-green-400 bg-white px-3 py-2 text-sm flex items-center gap-2 cursor-grabbing">
                <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  {activeColab.nombre.charAt(0)}
                </div>
                <span className="font-medium text-gray-800">{activeColab.nombre}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </AdminLayout>
  )
}
