const { readAllRows } = require('../shared/sheets')

const SHEET_SUPERVISORES = process.env.SHEET_SUPERVISORES || 'Supervisors'

// Excel columns: Id_Supervisor | Nom_Supervisor | Id_Area | Sede
module.exports = async function (context, req) {
  try {
    const rows = await readAllRows(SHEET_SUPERVISORES)
    const supervisores = rows.slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        nombre: r[1] || '',
        areaId: r[2] || '',
        sedeId: r[3] || '',
        activo: true,
      }))

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: supervisores,
    }
  } catch (err) {
    context.log.error('getSupervisores error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
