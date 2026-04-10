import { useSyncQueue } from '../../hooks/useSyncQueue'

export function SyncIndicator() {
  const { isOnline, isSyncing, pending, failed } = useSyncQueue()

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        <span className="text-xs font-medium text-red-700">Sin conexión</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-spin"></div>
        <span className="text-xs font-medium text-blue-700">Sincronizando...</span>
      </div>
    )
  }

  if (pending > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200">
        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
        <span className="text-xs font-medium text-yellow-700">{pending} pendientes</span>
      </div>
    )
  }

  if (failed > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200">
        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
        <span className="text-xs font-medium text-orange-700">{failed} errores</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
      <span className="w-2 h-2 rounded-full bg-green-500"></span>
      <span className="text-xs font-medium text-green-700">Todo sincronizado</span>
    </div>
  )
}
