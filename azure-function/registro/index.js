const { Client } = require('@microsoft/microsoft-graph-client')
require('isomorphic-fetch')
const { ClientSecretCredential } = require('@azure/identity')

const TENANT_ID = process.env.TENANT_ID
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const WORKBOOK_PATH = process.env.WORKBOOK_PATH // e.g. /drive/root:/path/labores-db.xlsx:
const TABLE_FORMULARIOS = process.env.TABLE_FORMULARIOS || 'Formularios'
const TABLE_FORMULARIOROWS = process.env.TABLE_FORMULARIOROWS || 'FormularioRows'

async function getClient() {
  const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET)
  const token = await credential.getToken('https://graph.microsoft.com/.default')
  return Client.init({ authProvider: (done) => done(null, token.token) })
}

module.exports = async function (context, req) {
  context.log('Registro function called')
  const client = await getClient()
  const payload = req.body
  if (!payload || !payload.id) {
    context.res = { status: 400, body: { error: 'Invalid payload' } }
    return
  }

  try {
    // Add formulario row
    const formularioValues = [
      payload.id,
      payload.fecha,
      payload.areaId ?? '',
      payload.supervisor ?? '',
      payload.tipo ?? '',
      payload.fechaCreacion ?? '',
      payload.sincronizado ? 'TRUE' : 'FALSE',
      payload.intentosSincronizacion ?? 0,
      payload.errorSincronizacionPermanente ? 'TRUE' : 'FALSE',
      payload.ultimoError ?? '',
    ]

    await client
      .api(`${WORKBOOK_PATH}/workbook/tables('${TABLE_FORMULARIOS}')/rows/add`)
      .post({ values: [formularioValues] })

    // Add rows for each colaborador into FormularioRows
    const rows = (payload.colaboradores || []).map((c) => [
      c.id,
      payload.id,
      c.numeroColaborador,
      c.nombreColaborador,
      c.externo ? 'TRUE' : 'FALSE',
      c.variedad,
      c.tallosEstimados,
      c.tallosReales,
      c.horaInicio,
      // first labor (flattened example)
      c.labores && c.labores[0] ? c.labores[0].camasPlaneadas : '',
      c.labores && c.labores[0] ? c.labores[0].rendimientoEstimadoPorCama : '',
      c.labores && c.labores[0] ? c.labores[0].camasEjecutadas : '',
      c.labores && c.labores[0] ? c.labores[0].rendimientoRealPorCama : '',
      c.proceso ? 'TRUE' : 'FALSE',
      c.seguridad ? 'TRUE' : 'FALSE',
      c.calidad ? 'TRUE' : 'FALSE',
      c.cumplimiento ? 'TRUE' : 'FALSE',
      c.compromiso ? 'TRUE' : 'FALSE',
      c.observaciones || '',
      c.tiempoEjecucion || 0,
    ])

    if (rows.length) {
      // Graph allows adding multiple rows at once
      await client
        .api(`${WORKBOOK_PATH}/workbook/tables('${TABLE_FORMULARIOROWS}')/rows/add`)
        .post({ values: rows })
    }

    context.res = { status: 200, body: { ok: true } }
  } catch (err) {
    context.log.error('registro error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
