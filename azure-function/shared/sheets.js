const { google } = require('googleapis')

let _sheets = null

/**
 * Returns an authenticated Google Sheets client.
 * Expects env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY  (the PEM key, with \n line breaks)
 *   SPREADSHEET_ID      (the ID from the Google Sheet URL)
 */
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

/**
 * Append rows to a sheet tab.
 * @param {string} sheetName - Tab name (e.g. "Registros")
 * @param {any[][]} rows - Array of row arrays
 */
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

/**
 * Read all rows from a sheet tab.
 * @param {string} sheetName
 * @returns {Promise<any[][]>}
 */
async function readAllRows(sheetName) {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
  })
  return res.data.values || []
}

/**
 * Update a specific row (1-indexed, row 1 = header).
 * @param {string} sheetName
 * @param {number} rowIndex - 1-based index
 * @param {any[]} rowData
 */
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
