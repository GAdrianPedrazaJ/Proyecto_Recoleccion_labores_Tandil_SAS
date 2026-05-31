# Seguridad de la aplicación y hardening

## Objetivo
Documentar los controles de seguridad necesarios para fortalecer la aplicación `labores-app`, con foco en:
- autenticación y autorización
- control de roles y permisos
- protección de datos sensibles
- refuerzo de la lógica en backend
- gestión segura de credenciales

## Alcance
Se cubre la aplicación web y los recursos de backend asociados:
- Frontend React / Vite
- Estado de sesión y auth en `src/store/useAuthStore.ts`
- Navegación y menú de admin/superadmin
- Funciones serverless / backend (Azure Functions / Supabase)
- Local persistence / IndexedDB / storage

## 1. Principios clave
1. Validación en capas
   - UI: ocultar funciones no autorizadas
   - Lógica cliente: verificar role antes de mostrar o habilitar acciones
   - Backend: validar cada petición y rechazar acceso no autorizado

2. Menor privilegio
   - `superadministrador` para gestión global y aprobaciones críticas
   - `administrador` para gestión operacional y creación de formularios pendientes
   - `supervisor` para visualización de datos de su área y envío de registros
   - `colaborador` / `usuario` solo para operar según su rol

3. No confiar en el cliente
   - Todo control de acceso debe existir también en backend
   - No usar sólo `usuario.rol` en frontend como filtro de seguridad

4. Protección de secretos
   - Variables sensibles deben quedar fuera de Git
   - Azure Functions y Supabase config deben usar secretos gestionados
   - No almacenar credenciales en `src/` ni en archivos versionados

## 2. Auditoría rápida de riesgo actual
- `src/store/useAuthStore.ts` persiste sesión con `persist` y token en `localStorage`/IndexedDB
- Muchas rutas y componentes usan `usuario?.rol` para mostrar UI, pero no hay verificación explícita de backend aquí
- Existe documento `docs/SEGURIDAD-CREDENCIALES.md` sobre filtración de credenciales, lo cual indica riesgo real en repositorio

## 3. Controles a aplicar en el frontend
### 3.1 Autenticación y sesión
- Verificar siempre `isAuthenticated` antes de permitir navegación interna
- Restaurar sesión con método seguro y rechazar token inválido
- No persistir campos extra sensibles en el store más allá de `usuario`, `token`, `isAuthenticated`

### 3.2 Control de roles
- Definir roles autorizados para cada pantalla/acción:
  - `superadministrador`: acceso total, rutas superadmin y admin
  - `administrador`: acceso a `admin-dashboard`, `admin-asignaciones`, `admin-...` salvo rutas superadmin-only
  - `supervisor`: acceso a registros y visualización de su área

- Consolidar roles en un helper compartido, por ejemplo:
  - `isSuperAdmin(usuario)`
  - `isAdmin(usuario)`
  - `isSupervisor(usuario)`

### 3.3 UI segura
- Eliminar botones/menús en caso de rol no autorizado
- Añadir mensajes claros de "Acceso denegado" si el usuario intenta forzar URL
- Evitar rutas públicas no autenticadas hacia módulos internos

## 4. Controles a aplicar en el backend
### 4.1 Validación de permisos en endpoints
- Cada endpoint o función debe verificar:
  - usuario autenticado
  - rol del usuario
  - estado del recurso (ej. formularios pendientes vs activos)
  - propiedad del recurso (ej. supervisor solo en su área)

- No permitir operaciones administrativas desde clientes no autorizados

### 4.2 Reglas de aprobación de formularios
- `superadmin` puede crear y activar formularios directamente
- `admin` puede crear formularios en estado `pending`
- `admin` no puede cambiar `status` a `active` sin aprobación de `superadmin`
- `supervisor` solo ve formularios con `status = active`

### 4.3 RLS y políticas en Supabase
- Uso recomendado de Row Level Security para proteger datos por rol y por usuario
- Políticas mínimas:
  - `SELECT` para supervisor sobre áreas/bloques asignados
  - `INSERT` solo para usuarios con permiso de captura
  - `UPDATE` solo con validación de rol y estado
  - `DELETE` restringido a superadmin

## 5. Protección de credenciales y configuración
- Confirmar que `azure-function/local.settings.json` y `/.env` estén en `.gitignore`
- Revisar que no haya credenciales hardcodeadas en `src/`
- Usar app settings en Azure y env vars seguras en Supabase
- Rotar secrets periódicamente

## 6. Recomendaciones de hardening adicionales
### 6.1 Manejo de tokens
- Validar expiración y revocación de tokens
- Si se usa JWT, verificar firma en backend
- Exigir refresh seguro si aplica

### 6.2 Sanitización de datos
- Sanitizar todas las entradas antes de persistir
- No asumir que el cliente valida correctamente

### 6.3 Registro y monitoreo
- Registrar intentos de acceso denegado
- Registrar cambios de rol y aprobaciones de formularios
- Monitorear errores de autorización en funciones servidor

### 6.4 CORS y políticas de seguridad
- En el backend, limitar orígenes permitidos a los dominios de la app
- Revisar encabezados HTTP de seguridad si aplica (Content Security Policy, X-Frame-Options, etc.)

## 7. Plan de implementación prioritario
1. Crear documento de roles y permisos en código
2. Refactorizar `AdminLayout` y navegación para usar helpers de autorización
3. Añadir guardias explícitos de acceso en los endpoints backend
4. Limpiar credenciales filtradas y confirmar `.gitignore`
5. Implementar RLS / Supabase policies para datos sensibles
6. Añadir pruebas manuales de acceso por rol

## 8. Checklist de acción inmediata
- [ ] Revisar y eliminar credenciales expuestas en repo
- [ ] Confirmar que `local.settings.json` está ignorado
- [ ] Añadir validación de rol en backend por cada operación crítica
- [ ] Evitar confiabilidad exclusiva en UI para seguridad
- [ ] Crear helpers de autorización centralizados
- [ ] Documentar el flujo de roles y aprobaciones de formularios

---
**Última actualización**: 16 Abril 2026
**Autor**: Plan de hardening solicitado por el proyecto
