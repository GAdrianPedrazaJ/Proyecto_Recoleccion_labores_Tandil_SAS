import { useEffect, useState } from 'react'
import type { Colaborador } from '../types'
import { getColaboradoresByArea } from '../services/db'

export function useColaboradores(areaId: string) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!areaId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await getColaboradoresByArea(areaId)
        if (!cancelled) setColaboradores(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error cargando colaboradores')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [areaId])

  return { colaboradores, loading, error }
}
