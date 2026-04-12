import { useEffect, useState } from 'react'
import { onSyncProgress, toggleSyncProgressModal, getLastCompletedSync, type SyncProgress } from '../../services/syncProgress'

export function SyncProgressModal() {
  const [progress, setProgress] = useState<SyncProgress>(() => {
    // Si no hay sincronización activa, mostrar el último estado completado
    const lastSync = getLastCompletedSync()
    return lastSync || {
      isActive: false,
      isManuallyOpen: false,
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      percentage: 0,
      errors: [],
    }
  })

  useEffect(() => {
    const unsubscribe = onSyncProgress((newProgress) => {
      setProgress(newProgress)
    })
    return unsubscribe
  }, [])

  const isOpen = progress.isActive || progress.isManuallyOpen

  const handleClose = () => {
    toggleSyncProgressModal(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && progress.isManuallyOpen && !progress.isActive) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Encabezado con cierre */}
        <div className="flex items-start justify-between">
          <div className="text-center space-y-1 flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {progress.isActive ? 'Sincronizando registros' : 'Historial de sincronización'}
            </h2>
            <p className="text-sm text-gray-500">{progress.currentTable || 'Último estado'}</p>
          </div>
          {progress.isManuallyOpen && !progress.isActive && (
            <button
              type="button"
              onClick={handleClose}
              className="ml-2 rounded-lg p-1 hover:bg-gray-100 active:bg-gray-200 transition"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Barra de progreso - solo si está activo */}
        {progress.isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progreso</span>
              <span className="text-sm font-bold text-green-600">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-blue-600 font-bold">{progress.processed}</p>
            <p className="text-blue-700 text-xs">Procesados</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-green-600 font-bold">{progress.succeeded}</p>
            <p className="text-green-700 text-xs">Exitosos</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <p className="text-red-600 font-bold">{progress.failed}</p>
            <p className="text-red-700 text-xs">Errores</p>
          </div>
        </div>

        {/* Errores */}
        {progress.errors.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Errores encontrados:</h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {progress.errors.slice(0, 5).map((err, idx) => (
                <div
                  key={`${err.recordId}-${idx}`}
                  className="bg-red-50 border border-red-200 rounded p-2 text-xs"
                >
                  <p className="font-mono text-red-700 text-xs truncate">ID: {err.recordId}</p>
                  <p className="text-red-600">{err.error}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(err.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {progress.errors.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  +{progress.errors.length - 5} errores más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-center text-xs text-gray-500">
          <p>{progress.isActive ? 'Sincronizando' : 'Último estado'}: {progress.processed} de {progress.total} registros</p>
          {progress.estimatedTime && (
            <p>Tiempo: {(progress.estimatedTime / 1000).toFixed(1)}s</p>
          )}
        </div>

        {/* Botón de cierre si está manualmente abierto y no hay sincronización activa */}
        {progress.isManuallyOpen && !progress.isActive && (
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  )
}
