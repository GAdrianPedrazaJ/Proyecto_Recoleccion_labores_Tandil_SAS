import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export const PWAInstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()

  useEffect(() => {
    // Mostrar banner solo si es instalable y no está instalado
    if (isInstallable && !isInstalled) {
      // Esperar a que la UI cargue completamente
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled])

  const handleInstall = async () => {
    const success = await promptInstall()
    if (success) {
      setIsVisible(false)
    }
  }

  if (!isVisible || isInstalled) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 shadow-lg z-50 animate-slide-up">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Download className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Instalar Labores Tandil</p>
            <p className="text-xs opacity-90">Acceso rápido desde tu pantalla de inicio</p>
          </div>
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="bg-white text-green-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition"
          >
            Instalar
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-green-700 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
