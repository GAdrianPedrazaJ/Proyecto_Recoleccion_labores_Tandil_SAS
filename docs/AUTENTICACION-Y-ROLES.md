# 🔐 Autenticación y Sistema de Roles - Guía de Despliegue

## Resumen de Cambios

### ✨ Nuevas Características
1. **Sistema de Autenticación con Roles**: Supervisor y Administrador
2. **Tabla de Usuarios**: Almacena userData con bcrypt hash encriptado
3. **Login Unificado**: Una sola página de login para todos los usuarios
4. **Control de Acceso Basado en Roles (RBAC)**:
   - Supervisores: acceso a `/areas`, `/historial`
   - Administradores: acceso completo a `/admin` + todas las rutas de supervisor
5. **Encriptación de Contraseñas**: Bcrypt con 10 rondas
6. **Encriptación de Base de Datos Local**: AES-256-GCM para datos sensibles en IndexedDB
7. **Menú de Usuario**: Diferenciación visual según rol

---

## 📋 Pasos de Despliegue

### PASO 1: Crear Tabla de Usuarios en Supabase

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar tu proyecto ("Recolección de Labores")
3. Ir a **SQL Editor** (o **Database** → **SQL Editor**)
4. Crear nueva query
5. Copiar/pegar el contenido de `scripts/create-usuarios-table.sql`
6. Ejecutar (presionar F5 o botón "Run")
7. Esperar confirmación: "Success. No rows returned"

**SQL Script**: [scripts/create-usuarios-table.sql](scripts/create-usuarios-table.sql)

### PASO 2: Generar Bcrypt Hashes

```bash
# Ejecutar en terminal desde la carpeta del proyecto
cd c:\Proyectos\Maria_Alejandra\Recoleccion_de_labores\labores-app
node scripts/generate-bcrypt-hashes.js
```

Esto generará:
```
✅ supervisor@tandil.com
   Password: supervisor123
   Hash: $2b$10$fxDTIgAvEremZVik0KXoveJ.MeitsFS2h.fRuhgQSuHD.VdsMALee

✅ admin@tandil.com
   Password: admin123
   Hash: $2b$10$pfaxWsdg4yVVE2V0mIhfbuKAv3YQv5.et4kONcSqp9Zeu76ydj9Me
```

Los hashes ya están incluidos en `create-usuarios-table.sql`.

### PASO 3: Compilar y Desplegar

```bash
# Compilar
npm run build

# Desplegar a Firebase Hosting
firebase deploy --only hosting

# Verificar en: https://labores-tandil.web.app
```

---

## 🔓 Credenciales de Prueba

### Supervisor
- **Email**: `supervisor@tandil.com`
- **Password**: `supervisor123`
- **Acceso**: `/areas`, `/historial`, formularios

### Administrador
- **Email**: `admin@tandil.com`
- **Password**: `admin123`
- **Acceso**: Todo (panel admin incluido)

⚠️ **Cambiar contraseñas antes de producción**

---

## 🏗️ Arquitectura de Autenticación

### Flujo de Login

```
Usuario entra a https://labores-tandil.web.app/
  ↓
Redirigido a /login (Login.tsx)
  ↓
Ingresa email + contraseña
  ↓
loginUsuario() (auth.ts)
  ├─ Query Supabase: buscar usuario por email
  ├─ bcrypt.compare(password, hash)
  ├─ Generar token (base64)
  └─ Guardar en localStorage + Zustand
  ↓
Redirigir según rol:
  ├─ administrador → /admin (AdminRoute)
  └─ supervisor → /areas (SupervisorRoute)
```

### Estructura de Protección de Rutas

```tsx
<SupervisorRoute>     // Supervisor + Admin
<AdminRoute>          // Solo Admin (redirige a /areas si es supervisor)
```

### Session Storage

```javascript
// localStorage
{
  "auth_storage": {
    "usuario": { id, email, nombre, rol, activo },
    "token": "base64-encoded-json",
    "isAuthenticated": true
  }
}
```

---

## 🔒 Encriptación

### Contraseñas
- **Método**: Bcrypt (10 rounds)
- **Ubicación**: Base de datos (columna `contraseña_hash`)
- **Verificación**: Cliente-side con bcryptjs

### Base de Datos Local (IndexedDB)
- **Método**: AES-256-GCM (Web Crypto API)
- **Claves**: Auto-generadas y almacenadas en IndexedDB
- **Datos**: Formularios off-line, sincronización pendiente
- **Servicio**: `services/encryption.ts`

### Datos en Tránsito
- **HTTPS**: Firebase Hosting (SSL automático)
- **CORS**: Supabase configurado

---

## 📱 Menú de Usuario en Header

Header ahora muestra:

```
🌷 Labores Tandil    👤 Nombre Usuario ▼
                     ├─ Panel Administrador (si es admin)
                     ├─ Inicio
                     └─ Cerrar sesión
```

---

## 🔧 Cambios en Código

### Archivos Creados
- `src/services/auth.ts` - Servicio de autenticación
- `src/services/encryption.ts` - Encriptación de datos locales
- `src/pages/Login.tsx` - Página de login unificada
- `src/store/useAuthStore.ts` - Store Zustand con roles
- `scripts/create-usuarios-table.sql` - SQL para crear tabla
- `scripts/generate-bcrypt-hashes.js` - Generar hashes bcrypt

### Archivos Modificados
- `src/App.tsx` - Agregadas rutas protegidas (SupervisorRoute, AdminRoute)
- `src/components/layout/Header.tsx` - Agregado menú de usuario + logout
- `src/components/layout/AdminLayout.tsx` - Actualizado para usar auth store
- `src/pages/admin/Dashboard.tsx` - Actualizado para usar nuevo auth
- `src/pages/admin/Login.tsx` - Redirige a /login
- `package.json` - Agregada dependencia bcryptjs

---

## 📊 Tabla de Base de Datos

### `usuarios`
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  contraseña_hash TEXT NOT NULL (bcrypt),
  rol TEXT CHECK (rol IN ('supervisor', 'administrador')),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP WITH TIME ZONE,
  actualizado_en TIMESTAMP WITH TIME ZONE
)
```

### RLS Policies
- **Lectura anónima**: Permitida (para login)
- **Lectura autenticada**: Permitida
- **Escritura autenticada**: Permitida (solo admins en práctica)

---

## 🚀 Mejoras Futuras

1. **Recuperación de contraseña**: Email con token
2. **Gestión de usuarios**: Admin puede crear/editar usuarios
3. **JWT vreal**: Reemplazar token base64 con JWT firmado
4. **2FA**: Autenticación de dos factores
5. **Sesiones**: Sistema de sesiones con expiración
6. **Auditoría**: Tabla `usuarios_audit` para rastrear cambios
7. **Sincronización encriptada**: Encriptar datos pendientes antes de sincronizar

---

## 🧪 Testing

### Test Login Supervisor
1. Ir a https://labores-tandil.web.app/
2. Email: `supervisor@tandil.com`
3. Password: `supervisor123`
4. ✅ Debería redirigir a `/areas`
5. ✅ Header debe mostrar "👤 Supervisor Demo"

### Test Login Admin
1. Ir a https://labores-tandil.web.app/
2. Email: `admin@tandil.com`
3. Password: `admin123`
4. ✅ Debería redirigir a `/admin`
5. ✅ Header debe mostrar "👨‍💼 Administrador"
6. ✅ Puede acceder a todas las rutas admin

### Test Control de Acceso
1. Login como supervisor
2. Intentar acceder a `/admin/areas` → **Redirige a `/areas`** ✅
3. Logout
4. Intentar acceder a `/areas` sin login → **Redirige a `/login`** ✅

---

## 🐛 Troubleshooting

### Error: "contraseña incorrecta" para usuarios válidos
- Verificar que el hash bcrypt está correcto en la BD
- Ejecutar `generate-bcrypt-hashes.js` de nuevo

### Error: "Usuario no encontrado"
- Verificar que la tabla `usuarios` existe
- Verificar que el usuario está creado en la BD
- Verificar que es `activo = true`

### Error: localStorage vacío después del login
- Verificar que el token se está generando
- Revisar console en DevTools → Application → localStorage

### Encriptación de IndexedDB no funciona
- Verificar que el navegador soporta Web Crypto API (Chrome 37+, Firefox 25+)
- Ver console para errores

---

## 📞 Soporte

Para preguntas sobre:
- **Autenticación**: Ver `src/services/auth.ts`
- **Encriptación**: Ver `src/services/encryption.ts`
- **Rutas protegidas**: Ver `src/App.tsx`
- **Base de datos**: Ver `scripts/create-usuarios-table.sql`

