const { readAllRows } = require('../shared/sheets')
const { withCors } = require('../shared/cors')

const SHEET_BLOQUES = process.env.SHEET_BLOQUES || 'Bloques'

// Excel columns: id_Bloque | Nom_Bloque | Area
module.exports = withCors(async function (context, req) {
  try {
    const rows = await readAllRows(SHEET_BLOQUES)
    const bloques = rows.slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        nombre: r[1] || '',
        areaId: r[2] || '',
      }))

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: bloques,
    }
  } catch (err) {
    context.log.error('getBloques error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
