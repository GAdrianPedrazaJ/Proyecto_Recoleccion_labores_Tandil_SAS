import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirigir al login unificado
    navigate('/login', { replace: true })
  }, [navigate])

  return null
}
