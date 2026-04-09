import { useState } from 'react'
import type { Formulario } from '../types'
import { putFormulario } from '../services/db'
import { postRegistro } from '../services/api'

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

      await putFormulario(formulario)

      // Intentar sincronizar inmediatamente si hay conexión y está completo
      if (navigator.onLine && formulario.estado === 'completo') {
        try {
          await postRegistro(formulario)
          await putFormulario({ ...formulario, sincronizado: true })
        } catch {
          // Quedará pendiente para sync en background
        }
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
      await putFormulario(formulario)

      // Intentar sincronizar si está completo y hay conexión
      if (navigator.onLine && formulario.estado === 'completo') {
        try {
          await postRegistro(formulario)
          await putFormulario({ ...formulario, sincronizado: true })
        } catch {
          // Quedará pendiente para sync en background
        }
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

