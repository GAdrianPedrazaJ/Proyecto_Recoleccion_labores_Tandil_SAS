import { useState } from 'react'
import type { Formulario } from '../types'
import { putFormulario } from '../services/db'
import { saveFormularioCompleto } from '../services/api'

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

      // Sincronizar a Supabase si está completo
      if (formulario.estado === 'completo') {
        try {
          await saveFormularioCompleto({
            id: formulario.id,
            fecha: formulario.fecha,
            areaId: formulario.areaId,
            supervisorId: formulario.supervisorId,
            tipo: formulario.tipo as 'Corte' | 'Labores' | 'Aseguramiento',
            estado: formulario.estado,
            filas: formulario.filas.map(f => ({
              colaboradorId: f.colaboradorId,
              nombre: f.nombre,
              externo: f.externo,
              bloqueId: f.bloqueId,
              variedadId: f.variedadId,
              // Corte fields
              tiempoEstimadoMinutos: f.tiempoEstimadoMinutos,
              tiempoRealMinutos: f.tiempoRealMinutos,
              tallosEstimados: f.tallosEstimados,
              tallosReales: f.tallosReales,
              horaInicio: f.horaInicio,
              horaFinEstimado: f.horaFinCorteEstimado,
              horaFinReal: f.horaFinCorteReal,
              horaCama: f.horaCama,
              rendimientoCorteEstimado: f.rendimientoCorteEstimado,
              rendimientoCorteReal: f.rendimientoCorteReal,
              // Labores fields
              labores: f.labores.map((l, idx) => ({
                id: `${formulario.id}-${f.colaboradorId}-labor-${idx}`,
                numero: idx + 1,
                laborId: l.laborId,
                laborNombre: l.laborNombre,
                camasEstimadas: l.camasEstimadas,
                tiempoCamaEstimado: l.tiempoCamaEstimado,
                camasReales: l.camasReales,
                tiempoCamaReal: l.tiempoCamaReal,
              })),
              // Aseguramiento fields
              desglose: f.desglossePiPc,
              procesoSeguridad: f.procesoSeguridad,
              calidad: [f.calidad1, f.calidad2, f.calidad3, f.calidad4, f.calidad5],
              rendimientoPromedio: f.rendimientoPromedio,
              observaciones: f.observaciones,
            })),
          })
          // Marcar como sincronizado en IDB
          await putFormulario({ ...formulario, sincronizado: true })
        } catch (apiErr) {
          console.error('Error sincronizando a Supabase:', apiErr)
          // No lanzar error - el queue lo reintentará
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
      // Guardar localmente en IndexedDB
      await putFormulario(formulario)

      // Actualizar en Supabase si está completo
      if (formulario.estado === 'completo') {
        try {
          await saveFormularioCompleto({
            id: formulario.id,
            fecha: formulario.fecha,
            areaId: formulario.areaId,
            supervisorId: formulario.supervisorId,
            tipo: formulario.tipo as 'Corte' | 'Labores' | 'Aseguramiento',
            estado: formulario.estado,
            filas: formulario.filas.map(f => ({
              colaboradorId: f.colaboradorId,
              nombre: f.nombre,
              externo: f.externo,
              bloqueId: f.bloqueId,
              variedadId: f.variedadId,
              // Corte fields
              tiempoEstimadoMinutos: f.tiempoEstimadoMinutos,
              tiempoRealMinutos: f.tiempoRealMinutos,
              tallosEstimados: f.tallosEstimados,
              tallosReales: f.tallosReales,
              horaInicio: f.horaInicio,
              horaFinEstimado: f.horaFinCorteEstimado,
              horaFinReal: f.horaFinCorteReal,
              horaCama: f.horaCama,
              rendimientoCorteEstimado: f.rendimientoCorteEstimado,
              rendimientoCorteReal: f.rendimientoCorteReal,
              // Labores fields
              labores: f.labores.map((l, idx) => ({
                id: `${formulario.id}-${f.colaboradorId}-labor-${idx}`,
                numero: idx + 1,
                laborId: l.laborId,
                laborNombre: l.laborNombre,
                camasEstimadas: l.camasEstimadas,
                tiempoCamaEstimado: l.tiempoCamaEstimado,
                camasReales: l.camasReales,
                tiempoCamaReal: l.tiempoCamaReal,
              })),
              // Aseguramiento fields
              desglose: f.desglossePiPc,
              procesoSeguridad: f.procesoSeguridad,
              calidad: [f.calidad1, f.calidad2, f.calidad3, f.calidad4, f.calidad5],
              rendimientoPromedio: f.rendimientoPromedio,
              observaciones: f.observaciones,
            })),
          })
          // Marcar como sincronizado en IDB
          await putFormulario({ ...formulario, sincronizado: true })
        } catch (apiErr) {
          console.error('Error sincronizando a Supabase:', apiErr)
          // No lanzar error - el queue lo reintentará
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


