const { appendRows, readAllRows } = require('../shared/sheets')

// Sheet names match the Excel file tabs
const SHEET_FORMULARIOS = process.env.SHEET_FORMULARIOS || 'Formularios'
const SHEET_ROWS = process.env.SHEET_ROWS || 'FormularioRows'

module.exports = async function (context, req) {
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
          r.supervisor ?? '',
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
    // Columns: id | formularioId | numeroColaborador | nombreColaborador | externo |
    //          variedad | tallosEstimados | tallosReales | horaInicio |
    //          camasPlaneadas | rendimientoEstimadoPorCama | camasEjecutadas | rendimientoRealPorCama |
    //          proceso | seguridad | calidad | cumplimiento | compromiso | observaciones | tiempoEjecucion
    const labores = r.labores || []
    const lab = (i, field) => (labores[i] ? (labores[i][field] ?? '') : '')

    await appendRows(SHEET_ROWS, [[
      r.id,
      r.formularioId ?? '',
      r.no ?? '',
      r.colaborador ?? '',
      r.externo ?? '',
      r.variedad ?? '',
      r.tallosEstimados ?? 0,
      r.tallosReales ?? 0,
      r.horaInicio ?? '',
      lab(0, 'camasPlaneadas'),
      lab(0, 'rendimientoEstimadoPorCama'),
      lab(0, 'camasEjecutadas'),
      lab(0, 'rendimientoRealPorCama'),
      r.proceso ? 'TRUE' : 'FALSE',
      r.seguridad ? 'TRUE' : 'FALSE',
      r.calidad ? 'TRUE' : 'FALSE',
      lab(0, 'cumplimiento'),
      '',           // compromiso (no está en RegistroColaborador, se deja vacío)
      r.observaciones ?? '',
      r.tiempoRealH ?? 0,
    ]])

    context.res = { status: 200, body: { ok: true } }
  } catch (err) {
    context.log.error('registro error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
