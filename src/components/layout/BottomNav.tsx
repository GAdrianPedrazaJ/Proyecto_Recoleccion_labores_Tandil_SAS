import { useAuthStore } from '../../store/useAuthStore'
import { useNavigation } from '../../hooks/useNavigation'
import { useNavigationStore } from '../../store/useNavigationStore'

interface NavItem {
  page: string
  label: string
  icon: React.ReactNode
}

export function BottomNav() {
  const { usuario } = useAuthStore()
  const navigate = useNavigation()
  const { currentPage } = useNavigationStore()

  // Items comunes para todos los roles
  const commonItems: NavItem[] = [
    {
      page: 'areas',
      label: 'Áreas',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      page: 'historial',
      label: 'Registros',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ]

  // Item condicional según rol
  const roleSpecificItem: NavItem | null =
    usuario?.rol === 'administrador'
      ? {
          page: 'admin-dashboard',
          label: 'Admin',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        }
      : usuario?.rol === 'supervisor'
        ? {
            page: 'supervisor-gestionar',
            label: 'Gestionar',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          }
        : null

  const items = roleSpecificItem ? [...commonItems, roleSpecificItem] : commonItems

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 flex border-t border-gray-200 bg-white safe-area-bottom">
      {items.map((item) => {
        const isActive = currentPage === item.page || (item.page === 'areas' && currentPage === 'area-detail') || (item.page === 'areas' && currentPage === 'nuevo-registro')
        return (
          <button
            key={item.page}
            onClick={() => navigate(item.page as any)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
              isActive ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
