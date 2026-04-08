const { appendRows } = require('../shared/sheets')

const SHEET_REGISTROS = process.env.SHEET_REGISTROS || 'Registros'

module.exports = async function (context, req) {
  context.log('Registro function called')
  const r = req.body
  if (!r || !r.id) {
    context.res = { status: 400, body: { error: 'Invalid payload: missing id' } }
    return
  }

  try {
    // Flatten labores
    const labores = r.labores || []
    const lab = (i, field) => {
      const l = labores[i]
      return l ? (l[field] ?? '') : ''
    }

    const row = [
      r.id,
      r.formularioId ?? '',
      r.areaId ?? '',
      r.fecha ?? '',
      r.dia ?? '',
      r.tipo ?? '',
      r.supervisor ?? '',
      r.sede ?? '',
      r.semana ?? '',
      r.no ?? '',
      r.colaborador ?? '',
      r.externo ?? '',
      r.variedad ?? '',
      r.horaInicio ?? '',
      r.tallosEstimados ?? 0,
      r.tallosReales ?? 0,
      r.tiempoEstH ?? 0,
      r.tiempoRealH ?? 0,
      r.rendCorte ?? 0,
      // Labor 1
      lab(0, 'nombre'), lab(0, 'camasPlaneadas'), lab(0, 'camasEjecutadas'),
      lab(0, 'rendimientoEstimadoPorCama'), lab(0, 'rendimientoRealPorCama'),
      lab(0, 'tiempoEstimado'), lab(0, 'tiempoReal'), lab(0, 'cumplimiento'),
      // Labor 2
      lab(1, 'nombre'), lab(1, 'camasPlaneadas'), lab(1, 'camasEjecutadas'),
      lab(1, 'rendimientoEstimadoPorCama'), lab(1, 'rendimientoRealPorCama'),
      lab(1, 'tiempoEstimado'), lab(1, 'tiempoReal'), lab(1, 'cumplimiento'),
      // Labor 3
      lab(2, 'nombre'), lab(2, 'camasPlaneadas'), lab(2, 'camasEjecutadas'),
      lab(2, 'rendimientoEstimadoPorCama'), lab(2, 'rendimientoRealPorCama'),
      lab(2, 'tiempoEstimado'), lab(2, 'tiempoReal'), lab(2, 'cumplimiento'),
      // Checks
      r.proceso ? 'SI' : 'NO',
      r.seguridad ? 'SI' : 'NO',
      r.calidad ? 'SI' : 'NO',
      r.observaciones ?? '',
      r.fechaCreacion ?? '',
    ]

    await appendRows(SHEET_REGISTROS, [row])

    context.res = { status: 200, body: { ok: true } }
  } catch (err) {
    context.log.error('registro error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
