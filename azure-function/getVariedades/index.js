const { readAllRows } = require('../shared/sheets')
const { withCors } = require('../shared/cors')

const SHEET_VARIEDADES = process.env.SHEET_VARIEDADES || 'Variedades'

// Sheet columns: Id_Variedad | Nom_Variedad  (id_bloque ya no se usa aquí, ver VariedadesBloques)
module.exports = withCors(async function (context, req) {
  try {
    const rows = await readAllRows(SHEET_VARIEDADES)
    const variedades = rows.slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        nombre: r[1] || '',
      }))

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: variedades,
    }
  } catch (err) {
    context.log.error('getVariedades error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}))