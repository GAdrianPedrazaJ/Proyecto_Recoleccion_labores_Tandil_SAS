/** Estado de red/sync inyectado desde el layout (una sola suscripción useOffline). */
export type SyncIndicatorState = {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
}

const dotBase = 'h-3 w-3 rounded-full'

/**
 * Verde pulsante: online y sin pendientes de subir.
 * Amarillo: hay registros aún no sincronizados.
 * Rojo: sin conexión.
 */
export function SyncIndicator({ isOnline, isSyncing, pendingCount }: SyncIndicatorState) {
  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-700" title="Sin conexión">
        <span className={`${dotBase} bg-red-500`} />
        Offline
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-amber-800"
        title={`${pendingCount} pendiente(s) de sincronizar`}
      >
        <span className={`${dotBase} animate-pulse bg-amber-400`} />
        Pendientes
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 text-xs text-green-800"
      title={isSyncing ? 'Sincronizando…' : 'En línea y al día'}
    >
      <span
        className={`${dotBase} bg-primary animate-pulse`}
        style={{ animationDuration: isSyncing ? '0.8s' : '2s' }}
      />
      OK
    </div>
  )
}
