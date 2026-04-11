import { useSyncQueue } from '../../hooks/useSyncQueue'
import { toggleSyncProgressModal } from '../../services/syncProgress'

export function SyncIndicator() {
  const { isOnline, isSyncing, pending, failed } = useSyncQueue()

  const handleClick = () => {
    toggleSyncProgressModal(true)
  }

  if (!isOnline) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition cursor-pointer active:scale-95"
        title="Click para ver detalles"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        <span className="text-xs font-medium text-red-700">Sin conexión</span>
      </button>
    )
  }

  if (isSyncing) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition cursor-pointer active:scale-95"
        title="Click para ver progreso"
      >
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-spin"></div>
        <span className="text-xs font-medium text-blue-700">Sincronizando...</span>
      </button>
    )
  }

  if (pending > 0) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 transition cursor-pointer active:scale-95"
        title="Click para ver detalles y sincronizar"
      >
        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
        <span className="text-xs font-medium text-yellow-700">{pending} pendientes</span>
      </button>
    )
  }

  if (failed > 0) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition cursor-pointer active:scale-95"
        title="Click para ver errores"
      >
        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
        <span className="text-xs font-medium text-orange-700">{failed} errores</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 transition cursor-pointer active:scale-95"
      title="Click para ver historial de sincronización"
    >
      <span className="w-2 h-2 rounded-full bg-green-500"></span>
      <span className="text-xs font-medium text-green-700">Todo sincronizado</span>
    </button>
  )
}
