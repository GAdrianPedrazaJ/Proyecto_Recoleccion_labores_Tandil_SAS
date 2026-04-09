/**
 * Script de seed para poblar el Google Sheet con datos de prueba.
 * Uso: node seed.js <ruta-al-json-de-credenciales>
 * Ejemplo: node seed.js "C:\Users\Adrian Pedraza\Downloads\flowerhub-492716-7a459ce17f86.json"
 */

const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

const SPREADSHEET_ID = '1YwebZCx-sLdL824Tsm0LPln2026w3ao-CapGj-FySz4'

const credPath = process.argv[2]
if (!credPath) {
  console.error('Uso: node seed.js <ruta-al-json-de-credenciales>')
  process.exit(1)
}

const creds = JSON.parse(fs.readFileSync(path.resolve(credPath), 'utf8'))

const auth = new google.auth.JWT(
  creds.client_email,
  null,
  creds.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
)

const sheets = google.sheets({ version: 'v4', auth })

async function appendRows(sheetName, rows) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  })
  console.log(`  ✓ ${rows.length} fila(s) insertadas en "${sheetName}"`)
}

async function clearSheet(sheetName, fromRow = 2) {
  // Clear from row 2 downward to avoid deleting headers
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${fromRow}:Z1000`,
    })
    console.log(`  ~ "${sheetName}" limpiada (filas desde ${fromRow})`)
  } catch (e) {
    console.warn(`  ! No se pudo limpiar "${sheetName}": ${e.message}`)
  }
}

async function main() {
  console.log('\n=== SEED Google Sheet ===\n')

  // ─── SUPERVISORES ────────────────────────────────────────────────────────────
  // Columnas: Id_Supervisor | Nom_Supervisor | Id_area | Nom_Area
  console.log('Poblando Supervisors...')
  await clearSheet('Supervisors')
  await appendRows('Supervisors', [
    ['S1', 'Nancy Garzón',    'a1',  'Rosas 1'],
    ['S2', 'Carlos Méndez',   'a2',  'Rosas 2'],
    ['S3', 'Paola Ríos',      'a3',  'Rosas 3'],
    ['S4', 'Javier Torres',   'a4',  'Rosas 4'],
    ['S5', 'Laura Castillo',  'a5',  'Rosas 5'],
    ['S6', 'Miguel Herrera',  'a6',  'Rosas 6'],
    ['S7', 'Diana Mora',      'a7',  'Rosas 7'],
    ['S8', 'Andrés Vargas',   'a8',  'Rosas 8'],
    ['S9', 'Claudia Suárez',  'a9',  'Rosas 9'],
    ['S10','Felipe Romero',   'a10', 'Rosas 10'],
  ])

  // ─── AREAS ───────────────────────────────────────────────────────────────────
  // Columnas: Id_Area | Nom_Area | sede | id_supervisor
  console.log('Poblando Areas...')
  await clearSheet('Areas')
  await appendRows('Areas', [
    ['a1',  'Rosas 1',  'TN', 'S1'],
    ['a2',  'Rosas 2',  'TN', 'S2'],
    ['a3',  'Rosas 3',  'TN', 'S3'],
    ['a4',  'Rosas 4',  'TN', 'S4'],
    ['a5',  'Rosas 5',  'TN', 'S5'],
    ['a6',  'Rosas 6',  'TN', 'S6'],
    ['a7',  'Rosas 7',  'TN', 'S7'],
    ['a8',  'Rosas 8',  'TN', 'S8'],
    ['a9',  'Rosas 9',  'TN', 'S9'],
    ['a10', 'Rosas 10', 'TN', 'S10'],
  ])

  // ─── VARIEDADES ──────────────────────────────────────────────────────────────
  // Columnas: Id_Variedad | Nom_Variedad
  console.log('Poblando Variedades...')
  await clearSheet('Variedades')
  await appendRows('Variedades', [
    ['v1',  'Freedom'],
    ['v2',  'Explorer'],
    ['v3',  'Vendela'],
    ['v4',  'Blush'],
    ['v5',  'Mondial'],
    ['v6',  'High & Magic'],
    ['v7',  'Nena'],
    ['v8',  'Topaz'],
    ['v9',  'Iguana'],
    ['v10', 'Lemon Zest'],
  ])

  // ─── LABORES ─────────────────────────────────────────────────────────────────
  // Columnas: Id_Labor | Nom_Labor
  console.log('Poblando Labores...')
  await clearSheet('Labores')
  await appendRows('Labores', [
    ['L1',  'Descabece con pedúnculo'],
    ['L2',  'Selección de brotes'],
    ['L3',  'Agobio'],
    ['L4',  'Activación de tallos'],
    ['L5',  'Embolce'],
    ['L6',  'Pinch de basales'],
    ['L7',  'Guiada y desenrede'],
    ['L8',  'Desbotone'],
    ['L9',  'BZC'],
    ['L10', 'Deschupone'],
    ['L11', 'Deshierbe'],
    ['L12', 'Aseo Caminos'],
    ['L13', 'Palo Seco'],
  ])

  // ─── COLABORADORES ───────────────────────────────────────────────────────────
  // Columnas: Id_Colaborador | Nom_Colaborador | EsExterno | Area | Supervisor | Asignado
  console.log('Poblando Colaboradores...')
  await clearSheet('Colaboradores')
  await appendRows('Colaboradores', [
    ['c1',  'Ana Pérez',      'FALSE', 'a1',  'S1',  'TRUE'],
    ['c2',  'Luis González',  'FALSE', 'a1',  'S1',  'TRUE'],
    ['c3',  'María Rodríguez','FALSE', 'a2',  'S2',  'TRUE'],
    ['c4',  'Jorge Martínez', 'FALSE', 'a2',  'S2',  'TRUE'],
    ['c5',  'Sandra López',   'TRUE',  'a3',  'S3',  'TRUE'],
    ['c6',  'Pedro Jiménez',  'TRUE',  'a3',  'S3',  'TRUE'],
    ['c7',  'Carmen Silva',   'FALSE', 'a4',  'S4',  'TRUE'],
    ['c8',  'Ricardo Díaz',   'FALSE', 'a5',  'S5',  'TRUE'],
    ['c9',  'Gloria Mora',    'FALSE', 'a6',  'S6',  'TRUE'],
    ['c10', 'Héctor Cruz',    'TRUE',  'a7',  'S7',  'TRUE'],
  ])

  console.log('\n✅ Seed completado exitosamente.')
  console.log('\nVerifica en:')
  console.log('  GET /api/areas        -> 10 áreas')
  console.log('  GET /api/colaboradores -> 10 colaboradores')
  console.log('  GET /api/variedades   -> 10 variedades')
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message || err)
  process.exit(1)
})
