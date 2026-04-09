const { readAllRows } = require('../shared/sheets')
const { withCors } = require('../shared/cors')

const SHEET_COLABORADORES = process.env.SHEET_COLABORADORES || 'Colaboradores'

// Excel columns: Id_Colaborador | Nom_Colaborador | EsExterno | Area | Supervisor | Asignado
module.exports = withCors(async function (context, req) {
  try {
    const rows = await readAllRows(SHEET_COLABORADORES)
    const colaboradores = rows.slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        nombre: r[1] || '',
        externo: (r[2] || '').toString().toUpperCase() === 'TRUE' || r[2] === '1',
        areaId: r[3] || '',
        supervisorId: r[4] || '',
        asignado: (r[5] || '').toString().toUpperCase() === 'TRUE' || r[5] === '1',
        activo: true,
      }))

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: colaboradores,
    }
  } catch (err) {
    context.log.error('getColaboradores error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
