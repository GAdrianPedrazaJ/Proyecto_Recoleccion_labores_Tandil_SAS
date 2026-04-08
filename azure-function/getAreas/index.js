const { readAllRows } = require('../shared/sheets')

const SHEET_AREAS = process.env.SHEET_AREAS || 'Areas'

// Excel columns: Id_Area | Nom_Area | sede | id_supervisor
module.exports = async function (context, req) {
  try {
    const rows = await readAllRows(SHEET_AREAS)
    // Skip header row (index 0)
    const areas = rows.slice(1)
      .filter((r) => r[0]) // skip empty rows
      .map((r) => ({
        id: r[0] || '',
        nombre: r[1] || '',
        sede: r[2] || '',
        supervisorId: r[3] || '',
      }))

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: areas,
    }
  } catch (err) {
    context.log.error('getAreas error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
