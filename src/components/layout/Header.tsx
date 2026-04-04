import { SyncIndicator, type SyncIndicatorState } from '../form/SyncIndicator'

/** Cabecera fija mobile-first con título y estado de red/sync. */
export function Header({
  title,
  sync,
}: {
  title: string
  sync: SyncIndicatorState
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <SyncIndicator
        isOnline={sync.isOnline}
        isSyncing={sync.isSyncing}
        pendingCount={sync.pendingCount}
      />
    </header>
  )
}
