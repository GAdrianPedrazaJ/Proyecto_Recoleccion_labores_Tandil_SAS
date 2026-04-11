import { useEffect, useState } from 'react'
import type { Sede } from '../types'
import { getAllSedes } from '../services/db'

export function useSedes() {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFromIdb = async () => {
    const data = await getAllSedes()
    setSedes(data)
    setLoading(false)
  }

  useEffect(() => {
    loadFromIdb().catch((err) => {
      setError(err instanceof Error ? err.message : 'Error cargando sedes')
      setLoading(false)
    })

    // Recargar cuando useSync termina de sincronizar datos maestros
    window.addEventListener('sync:remote:done', loadFromIdb)
    return () => window.removeEventListener('sync:remote:done', loadFromIdb)
  }, [])

  return { sedes, loading, error }
}
