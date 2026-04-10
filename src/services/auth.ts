import { supabase } from './supabase'
import * as bcrypt from 'bcryptjs'

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: 'supervisor' | 'administrador'
  activo: boolean
}

export interface AuthState {
  usuario: Usuario | null
  token: string | null
  isAuthenticated: boolean
}

/**
 * Login con email y contraseña
 * Verifica credenciales contra tabla usuarios
 */
export async function loginUsuario(email: string, contraseña: string): Promise<{ usuario: Usuario; token: string } | null> {
  try {
    // 1. Buscar usuario por email
    const { data: usuariosData, error: buscarError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, contraseña_hash, rol, activo')
      .eq('email', email.trim())
      .single()

    if (buscarError) {
      console.error('Error buscando usuario:', buscarError.message)
      return null
    }

    if (!usuariosData) {
      console.error('Usuario no encontrado:', email)
      return null
    }

    const userData = usuariosData as any
    if (!userData.activo) {
      console.error('Usuario inactivo:', email)
      return null
    }

    // 2. Verificar contraseña con bcrypt
    const passwordValid = await bcrypt.compare(contraseña, userData.contraseña_hash)

    if (!passwordValid) {
      console.error('Contraseña incorrecta')
      return null
    }

    // 3. Generar token
    const token = generateToken(userData.id, userData.email, userData.rol)

    return {
      usuario: {
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        rol: userData.rol,
        activo: userData.activo,
      },
      token,
    }
  } catch (error) {
    console.error('Error en login:', error)
    return null
  }
}

/**
 * Generar token JWT simple
 */
function generateToken(userId: string, email: string, rol: string): string {
  const payload = {
    userId,
    email,
    rol,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 días
  }

  // Token simple en base64 (NO SEGURO PARA PROD - usar JWT real en backend)
  return btoa(JSON.stringify(payload))
}

/**
 * Decodificar token
 */
export function decodeToken(token: string): any {
  try {
    return JSON.parse(atob(token))
  } catch {
    return null
  }
}

/**
 * Logout: limpiar sesión local
 */
export function logoutUsuario(): void {
  // Limpiar localStorage
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_usuario')
}

/**
 * Obtener usuario actual desde token almacenado
 */
export function getCurrentUsuario(): { usuario: Usuario; token: string } | null {
  try {
    const token = localStorage.getItem('auth_token')
    const usuarioStr = localStorage.getItem('auth_usuario')

    if (!token || !usuarioStr) return null

    const usuarioData = JSON.parse(usuarioStr)
    return {
      usuario: usuarioData,
      token,
    }
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return null
  }
}

/**
 * Guardar sesión en localStorage
 */
export function saveSession(usuario: Usuario, token: string): void {
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_usuario', JSON.stringify(usuario))
}

/**
 * Verificar si usuario tiene permisos para acceder a sección
 */
export function hasPermission(usuarioRol: string, requiredRol: 'supervisor' | 'administrador'): boolean {
  if (requiredRol === 'administrador') {
    return usuarioRol === 'administrador'
  }
  // supervisor puede acceder a supervisor
  return usuarioRol === 'supervisor' || usuarioRol === 'administrador'
}

