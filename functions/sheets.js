const { google } = require('googleapis')

let _sheets = null

function getSheets() {
  if (_sheets) return _sheets
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  )
  _sheets = google.sheets({ version: 'v4', auth })
  return _sheets
}

function getSpreadsheetId() {
  return process.env.SPREADSHEET_ID
}

async function appendRows(sheetName, rows) {
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  })
}

async function readAllRows(sheetName) {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
  })
  return res.data.values || []
}

async function updateRow(sheetName, rowIndex, rowData) {
  const sheets = getSheets()
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowData] },
  })
}

module.exports = { appendRows, readAllRows, updateRow }
