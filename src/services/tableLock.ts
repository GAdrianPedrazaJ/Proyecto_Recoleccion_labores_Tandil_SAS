import { supabase } from './supabase'

export interface TableLock {
  id: string
  tablename: string
  deviceid: string
  lockedat: string
  expiresat: string
}

const LOCK_TTL_SECONDS = 30
const DEVICE_ID = localStorage.getItem('deviceId') || (() => {
  const id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  localStorage.setItem('deviceId', id)
  return id
})()

export async function acquireLock(tableName: string): Promise<boolean> {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + LOCK_TTL_SECONDS * 1000)

    // Primero, limpiar locks expirados
    await supabase
      .from('table_locks')
      .delete()
      .lt('expiresat', now.toISOString())

    // Verificar si hay otro lock activo
    const { data: existingLock, error: checkError } = await supabase
      .from('table_locks')
      .select('*')
      .eq('tablename', tableName)
      .neq('deviceid', DEVICE_ID)
      .gte('expiresat', now.toISOString())
      .single()

    if (checkError && checkError.code !== 'PGRST116') throw checkError
    if (existingLock) return false // Otra instancia tiene el lock

    // Insertar o actualizar nuestro lock
    const { error: upsertError } = await supabase
      .from('table_locks')
      .upsert(
        {
          tablename: tableName,
          deviceid: DEVICE_ID,
          lockedat: now.toISOString(),
          expiresat: expiresAt.toISOString(),
        },
        { onConflict: 'tablename,deviceid' }
      )

    return !upsertError
  } catch (error) {
    console.error('Error acquiring lock:', error)
    return false
  }
}

export async function releaseLock(tableName: string): Promise<void> {
  try {
    await supabase
      .from('table_locks')
      .delete()
      .eq('tablename', tableName)
      .eq('deviceid', DEVICE_ID)
  } catch (error) {
    console.error('Error releasing lock:', error)
  }
}

export async function renewLock(tableName: string): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + LOCK_TTL_SECONDS * 1000)
    const { error } = await supabase
      .from('table_locks')
      .update({ expiresat: expiresAt.toISOString() })
      .eq('tablename', tableName)
      .eq('deviceid', DEVICE_ID)
    return !error
  } catch (error) {
    console.error('Error renewing lock:', error)
    return false
  }
}

export function getDeviceId() {
  return DEVICE_ID
}
