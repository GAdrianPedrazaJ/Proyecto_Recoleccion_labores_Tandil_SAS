const { readAllRows } = require('../shared/sheets')

const SHEET_SEDES = process.env.SHEET_SEDES || 'Sedes'

// Excel columns: Id_Sede | Nom_Sede
module.exports = async function (context, req) {
  try {
    const rows = await readAllRows(SHEET_SEDES)
    const sedes = rows.slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        nombre: r[1] || '',
      }))

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: sedes,
    }
  } catch (err) {
    context.log.error('getSedes error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
