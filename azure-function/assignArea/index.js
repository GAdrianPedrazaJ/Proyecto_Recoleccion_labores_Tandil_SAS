const { readAllRows, updateRow, appendRows } = require('../shared/sheets')

const SHEET_AREAS = process.env.SHEET_AREAS || 'Areas'
const SHEET_AUDIT = process.env.SHEET_AUDIT || 'AssignmentsAudit'

module.exports = async function (context, req) {
  const areaId = context.bindingData.id
  const { supervisorId, changedBy } = req.body || {}

  try {
    const rows = await readAllRows(SHEET_AREAS)
    // Row 0 is header, data starts at row 1
    let foundIndex = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === areaId) {
        foundIndex = i
        break
      }
    }

    if (foundIndex === -1) {
      context.res = { status: 404, body: { error: 'Area not found' } }
      return
    }

    const existing = rows[foundIndex]
    const oldSupervisor = existing[3] || ''
    const updated = [...existing]
    updated[3] = supervisorId || ''

    // updateRow is 1-indexed in sheets (row 1 = header), so data row i = sheet row i+1
    await updateRow(SHEET_AREAS, foundIndex + 1, updated)

    // Append audit record
    await appendRows(SHEET_AUDIT, [[
      `audit-${Date.now()}`,
      areaId,
      oldSupervisor,
      supervisorId || '',
      new Date().toISOString(),
      changedBy || '',
    ]])

    context.res = { status: 200, body: { ok: true } }
  } catch (err) {
    context.log.error('assignArea error', err)
    context.res = { status: 500, body: { error: String(err) } }
  }
}
