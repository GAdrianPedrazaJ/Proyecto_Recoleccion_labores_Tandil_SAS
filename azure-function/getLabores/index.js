const { readAllRows } = require('../shared/sheets')
const { withCors } = require('../shared/cors')

const SHEET_LABORES = process.env.SHEET_LABORES || 'Labores'

// Excel columns: Id_Labor | Nom_Labor
module.exports = withCors(async function (context, req) {
  try {
    const rows = await readAllRows(SHEET_LABORES)
    const labores = rows.slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        nombre: r[1] || '',
      }))

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: labores,
    }
  } catch (err) {
    context.log.error('getLabores error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
