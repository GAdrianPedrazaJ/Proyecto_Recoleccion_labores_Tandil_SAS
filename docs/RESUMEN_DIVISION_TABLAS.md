# 🎯 Resumen Ejecutivo: División de Tablas de Formularios

## Tu pregunta
> "necesito el sql para hacer la separación de la tabla de formulariorow porque para trabajar de mejor manera los formularios y modificar el dashboard de administrador y las estadísticas... dividirlo en 3 tablas cada una que llegue la información de un formulario pero que al mismo tiempo vayan relacionadas"

## ✅ Lo que hemos preparado

### 📁 Archivos Generados

| Archivo | Contenido | Ubicación |
|---------|-----------|-----------|
| **MIGRACION_TABLAS_SEPARADAS.sql** | Script SQL completo con DDL de 5 tablas nuevas | `db-template/` |
| **QUERIES_DASHBOARD_RECHARTS.sql** | 10 queries optimizadas para Recharts | `db-template/` |
| **ARQUITECTURA_TABLAS_SEPARADAS.md** | Documento técnico detallado (12 secciones) | `docs/` |
| **EJEMPLOS_FUNCIONES_ACTUALIZADAS.js** | Código de Azure Functions actualizado | `azure-function/` |

---

## 🏗️ Nueva Arquitectura

### Antes (Tabla única, problemas):
```
FormularioRows
├── tallosEstimados, tallosReales      (solo Corte)
├── laborId, laborNombre, camasEstimadas (solo Labores)
├── procesoSeguridad, calidad1-5       (solo Aseguramiento)
├── rendimientoCorte, rendimientoLabores (duplicados)
└── ❌ Muchos campos NULL por cada tipo
```

### Ahora (Tablas especializadas, optimizado):
```
Formularios (1)
  ├─ FormularioRowsCorte (*)
  │   └─ tallos, rendimientoCorte, horaInicio... (SOLO campos de corte)
  │
  ├─ FormularioRowsLabores (*)
  │   ├─ cantidadLabores, rendimientoPromedio...
  │   └─ LaboresTotalPorFila (*)  [detalle de cada labor]
  │
  ├─ FormularioRowsAseguramiento (*)
  │   └─ procesoSeguridad, calidad1-5, cumplimiento...
  │
  └─ FormularioRowMetadata (*)
      └─ Rastreo de qué secciones se completaron
```

#### ✨ Beneficios:
- ✅ **Sin NULL innecesarios** - cada tabla solo sus campos
- ✅ **Queries más rápidas** - índices optimizados
- ✅ **Escalable** - tablas crecen independientemente
- ✅ **Dashboard claro** - datos ya separados por tipo
- ✅ **ACID garantizado** - constraints específicos

---

## 📊 Estructura Detallada

### 1️⃣ FormularioRowsCorte
**Propósito**: Datos de la sección "CORTE" del formulario

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | NVARCHAR(50) | PK |
| `formularioId` | NVARCHAR(50) | FK → Formularios |
| `numeroColaborador` | INT | Ref |
| ... campos base (nombre, bloque, variedad, externo) | | |
| `tiempoEstimadoMinutos` | INT | ✓ Corte |
| `tiempoRealMinutos` | INT | ✓ Corte |
| `tallosEstimados` | INT | ✓ Corte |
| `tallosReales` | INT | ✓ Corte |
| `horaInicio, horaFinEstimado, horaFinReal` | TIME | ✓ Corte |
| `horaCama` | DECIMAL(10,2) | Auto-calculado |
| `rendimientoCorteEstimado` | DECIMAL(10,2) | ✓ Corte |
| `rendimientoCorteReal` | DECIMAL(10,2) | ✓ Corte |

**Índices**:
- PK: `id`
- UNIQUE: `(formularioId, numeroColaborador)`
- IX: `formularioId`, `bloqueId`, `variedadId`

---

### 2️⃣ FormularioRowsLabores + LaboresTotalPorFila
**Propósito**: Datos de la sección "LABORES"

#### FormularioRowsLabores (registros por colaborador)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | NVARCHAR(50) | PK |
| `formularioId` | NVARCHAR(50) | FK |
| ... campos base | | |
| `cantidadLaboresRegistradas` | INT | Count de labores |
| `rendimientoPromedio` | DECIMAL(10,2) | Auto = AVG(labores.pct) |
| `tiempoTotalLaboresEstimado` | INT | Sum |
| `tiempoTotalLaboresReal` | INT | Sum |
| `camasTotalEstimadas` | INT | Sum |
| `camasTotalReales` | INT | Sum |

#### LaboresTotalPorFila (detalle de cada labor)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | NVARCHAR(50) | PK |
| `filaLaboresId` | NVARCHAR(50) | FK → FormularioRowsLabores |
| `laborId` | NVARCHAR(50) | FK → LaborCatalog |
| `laborNombre` | NVARCHAR(100) | Cache |
| `camasEstimadas` | INT | |
| `tiempoCamaEstimado` | INT | minutos/cama |
| `rendimientoHorasEstimado` | DECIMAL(10,2) | Auto |
| `camasReales` | INT | |
| `tiempoCamaReal` | INT | |
| `rendimientoHorasReal` | DECIMAL(10,2) | Auto |
| `rendimientoPorcentaje` | DECIMAL(10,2) | Auto = (camasReales/Est)*100 |

**Relación**: 1 FormularioRowsLabores → * LaboresTotalPorFila
**Cascade**: ON DELETE CASCADE en FK

---

### 3️⃣ FormularioRowsAseguramiento
**Propósito**: Datos de la sección "ASEGURAMIENTO" (antes "CIERRE")

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | NVARCHAR(50) | PK |
| `formularioId` | NVARCHAR(50) | FK |
| ... campos base | | |
| `desglossePiPc` | BIT | Checkbox |
| `procesoSeguridad` | NVARCHAR(50) | NO, A, B, C, D, E |
| `calidad1-5` | BIT[5] | 5 checkboxes |
| `cumplimientoCalidad` | DECIMAL(10,2) | Auto = (checked/5)*100 |
| `rendimientoPromedio` | DECIMAL(10,2) | Ref a Labores |
| `rendimientoCorteReal` | DECIMAL(10,2) | Ref a Corte |
| `observaciones` | NVARCHAR(MAX) | Texto libre |

---

### 4️⃣ FormularioRowMetadata
**Propósito**: Rastrear qué secciones se completaron y sus relaciones

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | NVARCHAR(50) | PK |
| `formularioId` | NVARCHAR(50) | FK |
| `numeroColaborador` | INT | |
| `tipoRegistro` | NVARCHAR(50) | Corte, Labores, Aseguramiento |
| `seCompleto` | BIT | ¿Formulario completado? |
| `filaCorteId` | NVARCHAR(50) | FK → FormularioRowsCorte (if applicable) |
| `filaLaboresId` | NVARCHAR(50) | FK → FormularioRowsLabores (if applicable) |
| `filaAseguramientoId` | NVARCHAR(50) | FK → FormularioRowsAseguramiento (if applicable) |
| `fechaCreacion`, `fechaActualizacion` | DATETIME2 | |

**UNIQUE**: `(formularioId, numeroColaborador, tipoRegistro)`

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────┐
│     Entrada: Formulario del Colaborador             │
│  tipoRegistro = 'Corte' (o 'Labores'/Asgto)         │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Azure Function: registro/index.js (ACTUALIZADO)    │
│  - Recibe tipoRegistro en el body                   │
│  - Routing automático a tabla correcta              │
└────────┬────────────────────────────────────────────┘
         │
      ┌──┴──┬──────────────┬──────────────┐
      ▼     ▼              ▼              ▼
   Corte  Labores    + detalle       Aseguramiento
      │     │         en otra         │
      ▼     ▼         tabla           ▼
   FormularioRowsCorte  LaboresTotalPorFila  FormularioRowsAseguramiento
      │     │            │            │
      └─────┴──────┬─────┘            │
                   ▼                   │
            FormularioRowMetadata ◄────┘
                   │
                   ▼
            Dashboard (Recharts)
```

---

## 📈 Ejemplos de Queries Preparadas

### Para Recharts.LineChart (Tendencia)
```sql
SELECT 
    DATEPART(WEEK, fechaCreacion) as semana,
    AVG(rendimientoCorte) as rendimiento,
    AVG(cumplimientoCalidad) as calidad
GROUP BY DATEPART(WEEK, fechaCreacion)
```

### Para Recharts.BarChart (Bloques)
```sql
SELECT bloqueId, AVG(rendimientoCorte), COUNT(*)
FROM FormularioRowsCorte
GROUP BY bloqueId
```

### Para Recharts.PieChart (Calidad)
```sql
SELECT 
    CASE WHEN cumplimientoCalidad >= 80 THEN 'Excelente'
         WHEN cumplimientoCalidad >= 60 THEN 'Bueno'
         ...
    END as categoria,
    COUNT(*) as cantidad
FROM FormularioRowsAseguramiento
GROUP BY categoria
```

### Para Recharts.ScatterChart (Correlación)
```sql
SELECT 
    c.rendimientoCorteReal as x,
    a.cumplimientoCalidad as y,
    c.nombreColaborador
FROM FormularioRowsCorte c
INNER JOIN FormularioRowsAseguramiento a 
    ON c.formularioId = a.formularioId
```

---

## 🔧 Cambios en Backend (Azure)

### Más simple y especializado
```javascript
// ANTES: 1 función compleja
registro/index.js → INSERT en FormularioRows (con todos los campos)

// DESPUÉS: función inteligente
registro/index.js → IF tipoRegistro = 'Corte' 
                      → INSERT FormularioRowsCorte
                   ELSE IF tipoRegistro = 'Labores'
                      → INSERT FormularioRowsLabores
                      → INSERT LaboresTotalPorFila (x caada labor)
                   ELSE
                      → INSERT FormularioRowsAseguramiento
                   → Then UPDATE FormularioRowMetadata
```

**Archivos de ejemplo incluidos en `azure-function/EJEMPLOS_FUNCIONES_ACTUALIZADAS.js`**

---

## 🎨 Cambios Frontend (React)

### src/types/index.ts
```typescript
// ANTES
interface FilaColaborador {
  tallosEstimados, tallosReales      // Corte
  laborId, laborNombre               // Labores
  procesoSeguridad, calidad1-5       // Aseguramiento
}

// DESPUÉS
interface FilaCorte { /* solo Corte */ }
interface FilaLaboresTotal { 
  laborDetalles: LaborDetalle[]  // Relaciones con LaboresTotalPorFila
}
interface FilaAseguramiento { /* solo Aseguramiento */ }
```

### src/pages/NuevoRegistro.tsx
```typescript
// ANTES
const [filas, setFilas] = useState<FilaColaborador[]>([])

// DESPUÉS
const [filas, setFilas] = useState<{
  'Corte': FilaCorte[]
  'Labores': FilaLaboresTotal[]
  'Aseguramiento': FilaAseguramiento[]
}>({ Corte: [], Labores: [], Aseguramiento: [] })

// O acceso por tipoRegistro
filas[tipoRegistro]
```

### src/services/api.ts
```typescript
// 3 funciones dedicadas
saveFilaCorte(formularioId, fila)
saveFilaLabores(formularioId, fila)  // con labores detalle
saveFilaAseguramiento(formularioId, fila)
```

---

## 📋 Plan de Implementación (3-4 semanas)

### Semana 1: Base de Datos
- [ ] Ejecutar `MIGRACION_TABLAS_SEPARADAS.sql`
- [ ] Validar tablas creadas
- [ ] Respaldo de datos antiguos
- [ ] Migración de datos (si existen)

### Semana 2: Backend (Azure)
- [ ] Actualizar `registro/index.js`
- [ ] Crear 3 funciones GET (getFormularioCorte, getLabores, getAseguramiento)
- [ ] Tests de inserción/lectura
- [ ] Validación de datos

### Semana 3: Frontend (React)
- [ ] Actualizar tipos TypeScript
- [ ] Refactor NuevoRegistro.tsx
- [ ] Actualizar api.ts
- [ ] Tests componentes

### Semana 4: Dashboard + Deploy
- [ ] Crear hooks para queries
- [ ] Implementar componentes Recharts
- [ ] Dashboard.tsx completo
- [ ] Testing integración
- [ ] Deploy a producción

---

## 🚀 Próximos Pasos

1. **Este mes**: 
   - [ ] Ejecutar SQL en base de datos
   - [ ] Validar estructuras

2. **Próxima semana**:
   - [ ] Implementar cambios backend
   - [ ] Tests

3. **Luego**:
   - [ ] Refactor frontend
   - [ ] Dashboard con Recharts

---

## 📞 Dudas / Preguntas

- ¿Tienes datos actuales en FormularioRows? → Incluimos script de migración
- ¿Qué base de datos usas? → SQL Server (asumido)
- ¿Tienes restricciones de performance? → Las queries están indexadas
- ¿Necesitas vistas de compatibilidad? → Las incluimos en el SQL

---

## 📚 Documentación Incluida

```
📁 db-template/
   └─ MIGRACION_TABLAS_SEPARADAS.sql ← Ejecutar primero
   └─ QUERIES_DASHBOARD_RECHARTS.sql 

📁 docs/
   └─ ARQUITECTURA_TABLAS_SEPARADAS.md ← Referencia técnica completa

📁 azure-function/
   └─ EJEMPLOS_FUNCIONES_ACTUALIZADAS.js ← Copiar/adaptar
```

---

## ✨ Resultado Esperado

Después de implementar:

✅ Dashboard claro y rápido con Recharts  
✅ Análisis de datos separado por tipo de formulario  
✅ Base de datos normalizada y escalable  
✅ Mejor rendimiento (sin NULLs innecesarios)  
✅ Queries optimizadas con índices  
✅ Fácil mantenimiento y auditoría  

---

**Documento creado**: 2026-04-11  
**Versión**: 1.0  
**Estado**: Listo para implementar
