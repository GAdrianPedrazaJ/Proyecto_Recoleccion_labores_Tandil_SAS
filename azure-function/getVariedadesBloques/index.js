const { readAllRows } = require('../shared/sheets')
const { withCors } = require('../shared/cors')

const SHEET = process.env.SHEET_VARIEDADES_BLOQUES || 'VariedadesBloques'

// Sheet columns: Id_Variedad | Id_Bloque
// One row per combination — allows many-to-many between variedades and bloques
module.exports = withCors(async function (context, req) {
  try {
    const rows = await readAllRows(SHEET)
    const data = rows.slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        variedadId: r[0] || '',
        bloqueId: r[1] || '',
      }))

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: data,
    }
  } catch (err) {
    context.log.error('getVariedadesBloques error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
