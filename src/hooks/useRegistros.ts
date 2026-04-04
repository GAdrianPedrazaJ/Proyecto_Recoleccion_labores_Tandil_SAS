import { useCallback, useEffect, useState } from 'react'
import type { FormularioDia } from '../types'
import { getAllFormularios } from '../services/db'
import { todayIsoDate } from '../utils/helpers'
import { useAppStore } from '../store/useAppStore'

/**
 * Carga formularios desde IndexedDB y filtra los del día actual para el store.
 * Amplía aquí: suscripción a cambios, paginación, etc.
 */
export function useRegistros() {
  const [loading, setLoading] = useState(true)
  const setRegistrosHoy = useAppStore((s) => s.setRegistrosHoy)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const all: FormularioDia[] = await getAllFormularios()
      const hoy = todayIsoDate()
      const registrosHoy = all.filter((f) => f.fecha === hoy)
      setRegistrosHoy(registrosHoy)
    } finally {
      setLoading(false)
    }
  }, [setRegistrosHoy])

  useEffect(() => {
    void reload()
  }, [reload])

  return { loading, reload }
}
