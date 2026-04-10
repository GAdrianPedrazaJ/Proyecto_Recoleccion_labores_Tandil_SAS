import { supabase } from './supabase'

export interface TableLock {
  id: string
  tableName: string
  deviceId: string
  lockedAt: string
  expiresAt: string
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
      .lt('expiresAt', now.toISOString())

    // Verificar si hay otro lock activo
    const { data: existingLock, error: checkError } = await supabase
      .from('table_locks')
      .select('*')
      .eq('tableName', tableName)
      .neq('deviceId', DEVICE_ID)
      .gte('expiresAt', now.toISOString())
      .single()

    if (checkError && checkError.code !== 'PGRST116') throw checkError
    if (existingLock) return false // Otra instancia tiene el lock

    // Insertar o actualizar nuestro lock
    const { error: upsertError } = await supabase
      .from('table_locks')
      .upsert(
        {
          tableName,
          deviceId: DEVICE_ID,
          lockedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
        { onConflict: 'tableName,deviceId' }
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
      .eq('tableName', tableName)
      .eq('deviceId', DEVICE_ID)
  } catch (error) {
    console.error('Error releasing lock:', error)
  }
}

export async function renewLock(tableName: string): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + LOCK_TTL_SECONDS * 1000)
    const { error } = await supabase
      .from('table_locks')
      .update({ expiresAt: expiresAt.toISOString() })
      .eq('tableName', tableName)
      .eq('deviceId', DEVICE_ID)
    return !error
  } catch (error) {
    console.error('Error renewing lock:', error)
    return false
  }
}

export function getDeviceId() {
  return DEVICE_ID
}
