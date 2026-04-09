import { useEffect, useState } from 'react'
import type { Area } from '../types'
import { getAllAreas } from '../services/db'
import { syncFromRemote } from '../services/sync'

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Mostrar caché local inmediatamente
        const cached = await getAllAreas()
        if (!cancelled) setAreas(cached)

        // Intentar sincronizar con el backend
        await syncFromRemote()
        const fresh = await getAllAreas()
        if (!cancelled) setAreas(fresh)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error cargando áreas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { areas, loading, error }
}
