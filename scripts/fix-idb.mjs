import { readFileSync, writeFileSync } from 'fs'

const file = 'c:/Users/Adrian Pedraza/OneDrive - uniminuto.edu/Escritorio/Uni/SEMESTRE 8/PRACTICAS/Empresa/Maria_Alejandra/Recoleccion_de_labores/labores-app/src/services/db.ts'

let c = readFileSync(file, 'utf8')

// Fix getPendientesSincronizacion - remove IDBKeyRange.only(false) usage
const oldGet = `export async function getPendientesSincronizacion(): Promise<
  RegistroColaborador[]
> {
  const db = await getDb()
  const tx = db.transaction('registros', 'readonly')
  const idx = tx.store.index('by-sincronizado')
  const unsynced = await idx.getAll(IDBKeyRange.only(false))
  await tx.done
  return unsynced.filter(
    (r) =>
      !r.errorSincronizacionPermanente &&
      r.intentosSincronizacion < MAX_SYNC_ATTEMPTS,
  )
}`

const newGet = `export async function getPendientesSincronizacion(): Promise<
  RegistroColaborador[]
> {
  const all = await getAllRegistros()
  return all.filter(
    (r) =>
      r.sincronizado === false &&
      !r.errorSincronizacionPermanente &&
      r.intentosSincronizacion < MAX_SYNC_ATTEMPTS,
  )
}`

// Fix countNoSincronizados
const oldCount = `export async function countNoSincronizados(): Promise<number> {
  const db = await getDb()
  const tx = db.transaction('registros', 'readonly')
  const idx = tx.store.index('by-sincronizado')
  const list = await idx.getAll(IDBKeyRange.only(false))
  await tx.done
  return list.length
}`

const newCount = `export async function countNoSincronizados(): Promise<number> {
  const all = await getAllRegistros()
  return all.filter((r) => r.sincronizado === false).length
}`

if (c.includes(oldGet)) {
  c = c.replace(oldGet, newGet)
  console.log('✓ Fixed getPendientesSincronizacion')
} else {
  console.log('✗ Could not find getPendientesSincronizacion block')
}

if (c.includes(oldCount)) {
  c = c.replace(oldCount, newCount)
  console.log('✓ Fixed countNoSincronizados')
} else {
  console.log('✗ Could not find countNoSincronizados block')
}

writeFileSync(file, c, 'utf8')
console.log('Has IDBKeyRange remaining:', c.includes('IDBKeyRange'))
