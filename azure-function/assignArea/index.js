const { Client } = require('@microsoft/microsoft-graph-client')
require('isomorphic-fetch')
const { ClientSecretCredential } = require('@azure/identity')

const TENANT_ID = process.env.TENANT_ID
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const WORKBOOK_PATH = process.env.WORKBOOK_PATH
const TABLE_AREAS = process.env.TABLE_AREAS || 'Areas'
const TABLE_ASSIGNMENTS_AUDIT = process.env.TABLE_ASSIGNMENTS_AUDIT || 'AssignmentsAudit'

async function getClient() {
  const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET)
  const token = await credential.getToken('https://graph.microsoft.com/.default')
  return Client.init({ authProvider: (done) => done(null, token.token) })
}

module.exports = async function (context, req) {
  const areaId = context.bindingData.id
  const { supervisorId, changedBy } = req.body || {}
  const client = await getClient()
  try {
    // Read all rows from Areas table
    const rowsRes = await client
      .api(`${WORKBOOK_PATH}/workbook/tables('${TABLE_AREAS}')/rows`) 
      .get()
    const rows = rowsRes.value || []
    // Find the row index where first cell (Id_Area) matches
    let foundIndex = -1
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (r && r.values && r.values[0] && r.values[0][0] === areaId) {
        foundIndex = i
        break
      }
    }
    if (foundIndex === -1) {
      context.res = { status: 404, body: { error: 'Area not found' } }
      return
    }

    // prepare updated row values - we keep existing values and update supervisor column (assume 4th column is id_supervisor)
    const existing = rows[foundIndex].values[0]
    const oldSupervisor = existing[3]
    const newRow = [...existing]
    newRow[3] = supervisorId || ''

    // Update row by index (rows are 0-based)
    await client
      .api(`${WORKBOOK_PATH}/workbook/tables('${TABLE_AREAS}')/rows/${foundIndex}`)
      .patch({ values: [newRow] })

    // append audit row
    const auditRow = [
      `audit-${Date.now()}`,
      areaId,
      oldSupervisor ?? '',
      supervisorId ?? '',
      new Date().toISOString(),
      changedBy ?? '',
    ]
    await client
      .api(`${WORKBOOK_PATH}/workbook/tables('${TABLE_ASSIGNMENTS_AUDIT}')/rows/add`)
      .post({ values: [auditRow] })

    context.res = { status: 200, body: { ok: true } }
  } catch (err) {
    context.log.error('assignArea error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
