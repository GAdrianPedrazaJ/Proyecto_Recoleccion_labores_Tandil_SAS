import { useEffect, useState } from 'react'
import type { Area } from '../types'
import { getAllAreas } from '../services/db'

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFromIdb = async () => {
    const data = await getAllAreas()
    setAreas(data)
    setLoading(false)
  }

  useEffect(() => {
    loadFromIdb().catch((err) => {
      setError(err instanceof Error ? err.message : 'Error cargando áreas')
      setLoading(false)
    })

    // Recargar cuando useSync termina de sincronizar datos maestros
    window.addEventListener('sync:remote:done', loadFromIdb)
    return () => window.removeEventListener('sync:remote:done', loadFromIdb)
  }, [])

  return { areas, loading, error }
}
