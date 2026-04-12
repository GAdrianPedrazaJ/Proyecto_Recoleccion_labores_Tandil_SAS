# Registros del Día - Sistema de Persistencia

## ✅ Lo que implementé

### 1. **Captura de usuario autenticado**
Cuando creas un registro, se guarda automáticamente:
- `usuarioId` - ID del usuario autenticado
- `usuarioNombre` - Nombre del usuario

### 2. **Persistencia local en IndexedDB**
Todos los registros se guardan en IndexedDB (base de datos local del navegador):
- ✅ Se mantienen aunque cierres la app
- ✅ Se sincronizan cuando hay conexión
- ✅ Están disponibles totalmente offline

### 3. **Sección mejorada de Registros**
La página ahora muestra:

📅 **Filtro por fecha:**
- **Hoy** - Solo registros del día actual
- **Todos** - Todos los registro guardados

👤 **Agrupados por usuario:**
- Cada usuario tiene su sección
- Muestra cantidad de registros por usuario
- Fácil identificar quién hizo qué

📊 **Estados visuales:**
- 📤 **Pendiente** - Aún no sincronizado
- ✓ **Sincronizado** - Guardado en servidor
- 📘 **Borrador** - Incompleto (falta completar)
- ⚠️ **Error** - Problema en la sincronización

---

## 🔄 Flujo de datos

```
1. Usuario crea registro
   ↓
2. Se guarda usuarioId + usuarioNombre
   ↓
3. Se almacena en IndexedDB (local)
   ↓
4. Si está completo → se sincroniza a Supabase
   ↓
5. En Registros → se muestra agrupado por usuario
   ↓
6. Incluso si cierra app → persiste localmente
```

---

## 📱 Ejemplo de uso

**Día 1: Usuario Juan**
1. Juan abre la app
2. Crea registro de "Corte" en Rosas 1
3. El registro se guarda como:
   ```json
   {
     "id": "uuid-xxxx",
     "usuarioNombre": "Juan Pérez",
     "usuarioId": "u-juan-id",
     "fecha": "2024-04-12",
     "tipo": "Corte",
     "estado": "borrador",
     "areaNombre": "Rosas 1",
     // ... más campos
   }
   ```

4. Juan cierra la app
5. Juan reabre la app
6. El registro **sigue allí** sin conexión, esperando a ser completado

7. Juan va a **Registros → Hoy**
8. Ve su nombre "👤 Juan Pérez (1)"
9. Ve el registro "Rosas 1 - Corte - 5 colaboradores"
10. Toca "Completar" para terminar de llenar datos

---

## 🔄 Sincronización

### Estados de sincronización:

| Estado | Significa | Acción |
|--------|-----------|--------|
| 📤 **Pendiente** | No se envió al servidor | Se enva automáticamente cuando hay conexión |
| ✓ **Sincronizado** | Está en el servidor | Backup automático, puedes perder local y recuperar |
| ⚠️ **Error** | Falló la sincronización | Se reintenta automáticamente (máx 5 veces) |

### Botón "Sincronizar"
- Aparece cuando hay registros pendientes
- Intenta enviar todos los registros offline
- Actualiza la lista automáticamente

---

## 💾 Base de datos local

Los registros se guardan en **IndexedDB** (tecnología web moderna):

```javascript
// Automático - no necesitas hacer nada
// La app maneja todo detrás de escenas

// Pero tienes acceso vía DevTools:
// F12 → Application → IndexedDB → labores-db → formularios
```

---

## 🎯 Características principales

✅ **Multi-usuario en mismo dispositivo**
- Cada usuario ve sus registros
- Agrupados por nombre
- Filtrado automático

✅ **Offline-first**
- Funciona sin internet
- Se sincroniza cuando hay conexión
- Sin pérdida de datos

✅ **Persistencia garantizada**
- Cierra app → datos siguen
- Reinicia dispositivo → datos siguen (ej: APK de Android)
- Se sincroniza en background

✅ **Historial completo**
- "Todos" te muestra registros de cualquier fecha
- Búsqueda por tipo (Corte, Labores, Aseguramiento)
- Edición de borradores

---

## 🧹 Limpiar datos locales (si necesitas)

Si quieres resetear todo (borrar todos los registros locales):

**Opción 1: DevTools (F12)**
```
Application → IndexedDB → labores-db 
→ Right click → Delete Database
→ Recarga la app
```

**Opción 2: Sin perder base de datos**
- Solo borra registros específicos desde la app
- Toca "Eliminar" en cada registro

---

## 📊 Información para debugging

Si algo no funciona:

1. **Abre DevTools** (F12)
2. **Ve a Application → IndexedDB → labores-db → formularios**
3. Verifica que tus registros estén allí
4. Busca en Console si hay errores

---

## ✨ Resumen visual

```
Página Registros del Día
├── 📅 Filtro por fecha
│   ├── Hoy ← RECOMENDADO para ver lo del día
│   └── Todos
│
├── Filtro por tipo
│   ├── Todos
│   ├── Corte
│   ├── Labores
│   └── Aseguramiento
│
└── Registros agrupados por usuario
    └── 👤 Juan Pérez (2 registros)
        ├── Rosas 1 - Corte [Borrador]
        └── Rosas 2 - Labores [📤 Pendiente]
```

---

¡Los registros están completamente funcionales! 🚀
