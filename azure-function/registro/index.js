const { appendRows, readAllRows } = require('../shared/sheets')
const { withCors } = require('../shared/cors')

// Sheet names match the Excel file tabs
const SHEET_FORMULARIOS = process.env.SHEET_FORMULARIOS || 'Formularios'
const SHEET_ROWS = process.env.SHEET_ROWS || 'FormularioRows'

module.exports = withCors(async function (context, req) {
  context.log('Registro function called')
  const r = req.body
  if (!r || !r.id) {
    context.res = { status: 400, body: { error: 'Invalid payload: missing id' } }
    return
  }

  try {
    // --- Formularios tab (one row per form/day, avoid duplicates) ---
    // Columns: id | fecha | areaId | supervisorId | tipo | fechaCreacion |
    //          sincronizado | intentosSincronizacion | errorSincronizacionPermanente | ultimoError
    if (r.formularioId) {
      const existing = await readAllRows(SHEET_FORMULARIOS)
      const alreadyExists = existing.some((row) => row[0] === r.formularioId)
      if (!alreadyExists) {
        await appendRows(SHEET_FORMULARIOS, [[
          r.formularioId,
          r.fecha ?? '',
          r.areaId ?? '',
          r.supervisorId ?? '',
          r.tipo ?? '',
          r.fechaCreacion ?? '',
          r.sincronizado ? 'TRUE' : 'FALSE',
          r.intentosSincronizacion ?? 0,
          r.errorSincronizacionPermanente ? 'TRUE' : 'FALSE',
          r.ultimoError ?? '',
        ]])
      }
    }

    // --- FormularioRows tab (one row per colaborador) ---
    // Columns match FormularioRows sheet exactly:
    // id | formularioId | numeroColaborador | nombreColaborador | externo |
    // id_Area | id_Supervisor | id_Bloque | id_Variedad |
    // Tiempo_Estimado_Horas | Tiempo_Estimado_minutos | Tiempo_Real_Horas | Tiempo_Real_Minutos |
    // Total_Tallos_Corte_Estimado | Total_Tallos_Corte_Real |
    // Hora_Inicio_Corte | Hora_Fin_Corte_Estimado | Hora_Rela_Fin_Corte |
    // Hora/Cama | Rendimiento_Corte_Estimado | Rendimiento_Corte_Real |
    // Labor_1 | labor_1_numero_camas_Estimado | labor_1_numero_camas_real |
    //   labor_1_Tiempo_Cama_estimado | labor_1_Tiempo_Cama_Real |
    //   Labor_1_Rendimiento_horas_estimado | Labor_1_Rendimiento_Horas_Real | Labor_1_Rendimiento% |
    // ... (same pattern for labores 2-5)
    const labores = r.labores || []
    const lab = (i, field) => (labores[i] ? (labores[i][field] ?? '') : '')

    await appendRows(SHEET_ROWS, [[
      r.id,
      r.formularioId ?? '',
      r.colaboradorId ?? r.no ?? '',
      r.colaborador ?? '',
      r.externo ? 'TRUE' : 'FALSE',
      r.areaId ?? '',
      r.supervisorId ?? '',
      r.bloqueId ?? '',
      r.variedadId ?? '',
      // Corte – tiempos estimados
      r.tiempoEstimadoHoras ?? '',
      r.tiempoEstimadoMinutos ?? '',
      // Corte – tiempos reales
      r.tiempoRealHoras ?? '',
      r.tiempoRealMinutos ?? '',
      // Tallos corte
      r.tallosEstimados ?? 0,
      r.tallosReales ?? 0,
      // Horas corte
      r.horaInicio ?? '',
      r.horaFinCorteEstimado ?? '',
      r.horaFinCorteReal ?? '',
      r.horaCama ?? '',
      r.rendimientoCorteEstimado ?? '',
      r.rendimientoCorteReal ?? '',
      // Labor 1
      lab(0, 'laborId'),
      lab(0, 'camasEstimadas'),
      lab(0, 'camasReales'),
      lab(0, 'tiempoCamaEstimado'),
      lab(0, 'tiempoCamaReal'),
      lab(0, 'rendimientoHorasEstimado'),
      lab(0, 'rendimientoHorasReal'),
      lab(0, 'rendimientoPorcentaje'),
      // Labor 2
      lab(1, 'laborId'),
      lab(1, 'camasEstimadas'),
      lab(1, 'camasReales'),
      lab(1, 'tiempoCamaEstimado'),
      lab(1, 'tiempoCamaReal'),
      lab(1, 'rendimientoHorasEstimado'),
      lab(1, 'rendimientoHorasReal'),
      lab(1, 'rendimientoPorcentaje'),
      // Labor 3
      lab(2, 'laborId'),
      lab(2, 'camasEstimadas'),
      lab(2, 'camasReales'),
      lab(2, 'tiempoCamaEstimado'),
      lab(2, 'tiempoCamaReal'),
      lab(2, 'rendimientoHorasEstimado'),
      lab(2, 'rendimientoHorasReal'),
      lab(2, 'rendimientoPorcentaje'),
      // Labor 4
      lab(3, 'laborId'),
      lab(3, 'camasEstimadas'),
      lab(3, 'camasReales'),
      lab(3, 'tiempoCamaEstimado'),
      lab(3, 'tiempoCamaReal'),
      lab(3, 'rendimientoHorasEstimado'),
      lab(3, 'rendimientoHorasReal'),
      lab(3, 'rendimientoPorcentaje'),
      // Labor 5
      lab(4, 'laborId'),
      lab(4, 'camasEstimadas'),
      lab(4, 'camasReales'),
      lab(4, 'tiempoCamaEstimado'),
      lab(4, 'tiempoCamaReal'),
      lab(4, 'rendimientoHorasEstimado'),
      lab(4, 'rendimientoHorasReal'),
      lab(4, 'rendimientoPorcentaje'),
      // Cierre
      r.desglossePiPc ? 'TRUE' : 'FALSE',
      r.procesoSeguridad ?? '',
      r.calidad1 ? 'TRUE' : 'FALSE',
      r.calidad2 ? 'TRUE' : 'FALSE',
      r.calidad3 ? 'TRUE' : 'FALSE',
      r.calidad4 ? 'TRUE' : 'FALSE',
      r.calidad5 ? 'TRUE' : 'FALSE',
      r.cumplimientoCalidad ?? '',
      r.rendimientoPromedio ?? '',
      r.observaciones ?? '',
    ]])

    context.res = { status: 200, body: { ok: true } }
  } catch (err) {
    context.log.error('registro error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}))