const { readAllRows, updateRow, appendRows } = require('../shared/sheets')
const { withCors } = require('../shared/cors')

// Sheet names match the Excel file tabs
const SHEET_AREAS = process.env.SHEET_AREAS || 'Areas'
const SHEET_AUDIT = process.env.SHEET_AUDIT || 'Asignaciones'

module.exports = withCors(async function (context, req) {
  const areaId = context.bindingData.id
  const { supervisorId, changedBy } = req.body || {}

  try {
    // Areas columns: Id_Area | Nom_Area | sede | id_supervisor
    const rows = await readAllRows(SHEET_AREAS)
    // Row index 0 = header row, data starts at 1
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

    // Sheet rows are 1-indexed; header = row 1, first data row = row 2
    await updateRow(SHEET_AREAS, foundIndex + 1, updated)

    // Asignaciones columns: id | areaId | oldSupervisorId | newSupervisorId | changedAt | changedBy
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
})