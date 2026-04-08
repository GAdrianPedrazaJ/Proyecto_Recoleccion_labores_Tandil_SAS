import { useEffect, useState } from 'react'
import { getAllAreas, getAllSupervisors, putArea } from '../services/db'
import { assignArea } from '../services/api'
import { useAppStore } from '../store/useAppStore'

export function AdminAreas() {
  const [loading, setLoading] = useState(true)
  const [areas, setAreasLocal] = useState<any[]>([])
  const [supervisors, setSupervisors] = useState<any[]>([])
  const setAreas = useAppStore((s) => s.setAreas)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [a, s] = await Promise.all([getAllAreas(), getAllSupervisors()])
      if (!mounted) return
      setAreasLocal(a)
      setSupervisors(s)
      setAreas(a)
      setLoading(false)
    }
    void load()
    return () => {
      mounted = false
    }
  }, [setAreas])

  async function handleAssign(areaId: string, supervisorId?: string) {
    try {
      // update remote
      await assignArea(areaId, supervisorId ?? '')
    } catch (err) {
      console.error('assignArea failed', err)
    }
    // update local DB/state
    const area = areas.find((x) => x.id === areaId)
    const updated = { ...area, supervisorId }
    await putArea(updated)
    const next = areas.map((x) => (x.id === areaId ? updated : x))
    setAreasLocal(next)
    setAreas(next)
  }

  if (loading) return <div className="p-4">Cargando áreas...</div>

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4">Administrar Áreas</h1>
      <div className="space-y-3">
        {areas.map((area) => (
          <div
            key={area.id}
            className="flex items-center justify-between gap-3 rounded border p-3"
          >
            <div>
              <div className="font-medium">{area.nombre}</div>
              <div className="text-sm text-gray-500">{area.sede}</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={area.supervisorId ?? ''}
                onChange={(e) => void handleAssign(area.id, e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">-- Sin supervisor --</option>
                {supervisors.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminAreas
