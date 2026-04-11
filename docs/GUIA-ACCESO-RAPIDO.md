# 🚀 Guía de Acceso - Funciones Principales

## 🔐 Acceso a Cuenta

### Cuentas por Defecto

| Rol | Email | Contraseña | Acceso a |
|-----|-------|-----------|----------|
| **Supervisor** | `supervisor@tandil.com` | `supervisor123` | Áreas, Historial, Gestionar |
| **Admin** | `admin@tandil.com` | `admin123` | Todo + Dashboard Administrativo |

### Opción "Recordar mi email" ✨

En el login, tienes un **checkbox "Recordar mi email"**:
- ☑️ Marcar → Guarda tu email en el navegador
- ☐ Sin marcar → No guarda nada

Próxima vez que abras login, tu email estará completado automáticamente.

---

## 📊 Panel de Sincronización

### ¿Dónde está?

1. Logueate como **Admin**
2. Ve a: **Admin → Dashboard**
3. Si hay registros pendientes, verás botón **"Sincronizar X pendiente(s)"**

### ¿Cómo funciona?

**Click en botón "Sincronizar"** → Aparece modal con:

```
┌─────────────────────────────────┐
│ 📊 Sincronización en Progreso   │
├─────────────────────────────────┤
│ ████████████░░░░ 65%           │
│                                 │
│ 📈 Procesados:     156          │
│ ✅ Sincronizados:  100          │
│ ❌ Fallos:         56           │
│                                 │
│ 📋 Tabla Actual:   Formularios  │
│ ⏱️  Tiempo: 2m 34s              │
│                                 │
│ 📋 Errores encontrados:         │
│  • ID 001: Error de validación  │
│  • ID 045: Red desconectada     │
│  [... 3 errores más]            │
│                                 │
│              [Continuar]        │
└─────────────────────────────────┘
```

### ¿Qué muestra?

- **Barra de progreso** → Qué % está hecho
- **Estadísticas** → Procesados/Éxito/Fallos con colores
- **Tabla actual** → Cuál tabla está sincronizando
- **Error list** → Por qué fallaron los registros (con ID del registro)
- **Duración** → Tiempo total y ETA

### Cierre automático

Se cierra automáticamente cuando termina la sincronización.

---

## 🚪 Acceso a Backdoor (Admin Temporal)

### ¿Para qué sirve?

Crear un usuario admin **temporal** válido por **24 horas** sin tener que acceder a la BD.

### ¿Cómo acceder?

**URL directa:**
```
https://labores-tandil.web.app/admin-setup
```

⚠️ **No aparece en el menú - solo por URL directa**

### Pasos:

#### 1️⃣ Ir a la ruta
```
https://labores-tandil.web.app/admin-setup
```

#### 2️⃣ Ingresar contraseña
```
Contraseña: Tandil2026
```

#### 3️⃣ Crear usuario admin temporal
```
Email:  tu-email@ejemplo.com
Nombre: Tu Nombre
```

#### 4️⃣ Ver credencial temporal
Se muestra una pantalla con:
- Email del nuevo usuario
- Contraseña temporal (se borra en 10 segundos)
- Aviso: "Válido 24 horas"

**⚠️ IMPORTANTE: Copia la contraseña antes que desaparezca**

#### 5️⃣ Auto-login
La página redirige a login automáticamente.

Login con el email + contraseña temporal que copiaste.

### Características

| Aspecto | Detalle |
|---------|---------|
| **Duración** | 24 horas desde creación |
| **Rol** | Administrador (acceso completo) |
| **Visible en BD** | Sí (con flag `creado_por_backdoor=true`) |
| **Seguridad** | Se marca con `temporal_hasta` timestamp |

---

## 📱 Panel Supervisor (Gestionar)

### ¿Dónde está?

1. Logueate como **Supervisor**
2. En BottomNav verás: **Gestionar** (no Admin)
3. Click → Panel de estadísticas

### ¿Qué muestra?

**KPIs Globales:**
- Total colaboradores asignados
- Total registros hechos
- Registros pendientes (sin sync)
- Registros sincronizados ✅

**Por Colaborador:**
- Nombre + última actualización
- % completado (barra de progreso)
- Badges: "⏳ X pendientes" + "✓ X sync"
- Ordenados por más pendientes primero

---

## 🎯 Resumen Rápido

| Funcionalidad | Cómo Acceder | Usuario |
|---------------|-------------|---------|
| **Login con "Recordar"** | Ir a login y marcar checkbox | Todos |
| **Ver Sincronización** | Admin → Dashboard → Botón Sincronizar | Admin |
| **Crear Admin Temporal** | https://labores-tandil.web.app/admin-setup + Clave: Tandil2026 | Admin |
| **Panel Supervisor** | Login como Supervisor → Click Gestionar | Supervisor |
| **Admin Dashboard** | Login como Admin → Aparece en menú | Admin |

---

## 🔧 Credenciales Recordar

| Campo | Dónde se guarda |
|-------|----------------|
| **Email** | LocalStorage (`labores-email-recordado`) |
| **Contraseña** | ❌ NUNCA se guarda (por seguridad) |
| **Sesión** | Zustand Store + Session Storage |

---

## 📞 Soporte

**¿Tu email no se guarda?**
- Verifica que el navegador permita localStorage
- Limpia caché si hay problemas
- Intenta incógnita

**¿Backdoor no funciona?**
- Verifica URL exacta: `https://labores-tandil.web.app/admin-setup`
- Contraseña sensible a mayúsculas: `Tandil2026`
- Si lo intentas 3 veces mal, espera 30 segundos

**¿Modal de sincronización se cierra?**
- Espera a que termine
- O cierra el modal y revisa resultado en Dashboard

---

**Última actualización**: 10 Abril 2026
**Versión**: Commit be760e3
