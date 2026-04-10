import { useState } from 'react'
import type { Formulario } from '../types'
import { putFormulario } from '../services/db'
import { queueFormularioRow } from '../services/syncQueue'

export type FormularioInput = Omit<
  Formulario,
  'id' | 'sincronizado' | 'intentosSincronizacion' | 'errorPermanente' | 'fechaCreacion'
>

export function useFormulario() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (input: FormularioInput): Promise<string> => {
    setSaving(true)
    setError(null)
    try {
      const formulario: Formulario = {
        ...input,
        id: crypto.randomUUID(),
        sincronizado: false,
        intentosSincronizacion: 0,
        errorPermanente: false,
        fechaCreacion: new Date().toISOString(),
      }

      // Guardar localmente en IndexedDB
      await putFormulario(formulario)

      // Encolar para sincronización si está completo
      if (formulario.estado === 'completo') {
        await queueFormularioRow(formulario)
      }

      return formulario.id
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error guardando formulario'
      setError(msg)
      throw new Error(msg)
    } finally {
      setSaving(false)
    }
  }

  const update = async (formulario: Formulario): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      // Guardar localmente en IndexedDB
      await putFormulario(formulario)

      // Encolar para sincronización si está completo
      if (formulario.estado === 'completo') {
        await queueFormularioRow(formulario)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error actualizando formulario'
      setError(msg)
      throw new Error(msg)
    } finally {
      setSaving(false)
    }
  }

  return { save, update, saving, error }
}

