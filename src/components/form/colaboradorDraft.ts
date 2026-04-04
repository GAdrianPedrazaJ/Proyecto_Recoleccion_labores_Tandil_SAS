import type { Labor } from '../../types'
import { laborFromPartial } from '../../utils/helpers'

export type ColaboradorDraft = {
  tallosEstimados: number
  tallosReales: number
  horaInicio: string
  tiempoEstH: number
  tiempoRealH: number
  labores: Labor[]
  proceso: boolean
  seguridad: boolean
  calidad: boolean
  observaciones: string
}

export function defaultColaboradorDraft(): ColaboradorDraft {
  return {
    tallosEstimados: 0,
    tallosReales: 0,
    horaInicio: '07:00',
    tiempoEstH: 0,
    tiempoRealH: 0,
    labores: [laborFromPartial({ nombre: 'Programacion' })],
    proceso: true,
    seguridad: true,
    calidad: true,
    observaciones: '',
  }
}
