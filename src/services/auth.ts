import { supabase } from './supabase'
import * as bcrypt from 'bcryptjs'

export type Rol = 'supervisor' | 'administrador' | 'superadministrador'

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: Rol
  activo: boolean
}

// Para listado de usuarios en panel de gestión (sin hash)
export interface UsuarioListItem {
  id: string
  email: string
  nombre: string
  rol: Rol
  activo: boolean
  temporal_hasta: string | null
  creado_por_backdoor: boolean
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
      throw new Error('CUENTA_DESACTIVADA')
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
    if (error instanceof Error && error.message === 'CUENTA_DESACTIVADA') throw error
    console.error('Error en login:', error)
    return null
  }
}

// ─── Gestión de usuarios (solo superadministrador) ───────────────────────────

export async function getUsuarios(): Promise<UsuarioListItem[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, email, nombre, rol, activo, temporal_hasta, creado_por_backdoor')
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as UsuarioListItem[]
}

export async function updateUsuarioAdmin(
  id: string,
  changes: Partial<Pick<UsuarioListItem, 'nombre' | 'rol' | 'activo'>>
): Promise<void> {
  const { error } = await supabase.from('usuarios').update(changes).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createUsuarioAdmin(data: {
  email: string
  nombre: string
  contraseña: string
  rol: Rol
}): Promise<void> {
  const contraseña_hash = await bcrypt.hash(data.contraseña, 10)
  const { error } = await supabase.from('usuarios').insert({
    email: data.email.trim().toLowerCase(),
    nombre: data.nombre.trim(),
    contraseña_hash,
    rol: data.rol,
    activo: true,
  })
  if (error) throw new Error(error.message)
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

