# Arquitectura Optimizada: División de Tablas de Formularios
**Documento técnico para la refactorización de FormularioRows**

---

## 📋 Índice
1. [Beneficios de la nueva arquutectura](#beneficios)
2. [Estructura de tablas](#estructura)
3. [Cambios necesarios en el backend](#backend)
4. [Cambios en la aplicación React](#frontend)
5. [Implementación de Dashboard con Recharts](#dashboard)
6. [Plan de migración](#migracion)

---

## 🎯 Beneficios de la nueva arquitectura {#beneficios}

### 1. **Mejor Normalización**
- Cada tabla contiene solo los campos relevantes para su tipo de formulario
- Reduce NULL values innecesarios
- Mejora la integridad de datos

### 2. **Queries Más Rápidas**
```sql
-- ANTES: Query lenta porque debe ignorar muchos NULLs
SELECT * FROM FormularioRows 
WHERE tallosReales IS NOT NULL 
AND rendimientoCorteReal IS NOT NULL;

-- DESPUÉS: Query rápida y clara
SELECT * FROM FormularioRowsCorte;
```

### 3. **Escalabilidad**
- Cada tabla crece independientemente
- Índices optimizados por tipo de dato
- Mantenimiento más simple

### 4. **Análisis de Datos Mejorado**
- Las queries para Recharts son más claras y específicas
- Reportes más precisos
- KPIs mejor definidos

### 5. **Cumplimiento de ACID**
- Transacciones más seguras
- Constraints específicos por tipo
- Integridad referencial clara

---

## 🏗️ Estructura de Tablas {#estructura}

### Diagrama de Relaciones
```
Formularios (1)
    ├─── FormularioRowsCorte (*)
    ├─── FormularioRowsLabores (*)
    │        └─── LaboresTotalPorFila (*)
    ├─── FormularioRowsAseguramiento (*)
    └─── FormularioRowMetadata (*)
```

### Campos Comunes (todas las tablas)
```typescript
interface RowBase {
  id: string                      // UUID único
  formularioId: string            // FK a Formularios
  numeroColaborador: number       // Referencia
  nombreColaborador: string       // Caché para queries rápidas
  colaboradorId?: string          // FK a Colaboradores
  bloqueId?: string              // FK a Bloques
  variedadId?: string            // FK a Variedades
  variedadNombre?: string        // Caché
  externo: boolean               // ¿Colaborador externo?
  fechaCreacion: Date
  fechaActualizacion?: Date
}
```

### FormularioRowsCorte - Campos Específicos
```typescript
{
  tiempoEstimadoMinutos: number
  tiempoEstimadoHoras: number      // auto-calculado
  tiempoRealMinutos: number
  tiempoRealHoras: number          // auto-calculado
  tallosEstimados: number
  tallosReales: number
  horaInicio: string              // HH:MM
  horaFinCorteEstimado: string
  horaFinCorteReal: string
  horaCama: number               // auto-calculado
  rendimientoCorteEstimado: number
  rendimientoCorteReal: number
}
```

### FormularioRowsLabores - Campos Específicos
```typescript
{
  cantidadLaboresRegistradas: number
  rendimientoPromedio: number      // auto-calculado
  tiempoTotalLaboresEstimado: number
  tiempoTotalLaboresReal: number
  camasTotalEstimadas: number
  camasTotalReales: number
}
```

### LaboresTotalPorFila (tabla detalle)
```typescript
{
  id: string
  filaLaboresId: string           // FK a FormularioRowsLabores
  laborId: string                 // FK a LaborCatalog
  laborNombre: string
  camasEstimadas: number
  tiempoCamaEstimado: number      // minutos
  rendimientoHorasEstimado: number // auto
  camasReales: number
  tiempoCamaReal: number
  rendimientoHorasReal: number    // auto
  rendimientoPorcentaje: number   // auto
}
```

### FormularioRowsAseguramiento - Campos Específicos
```typescript
{
  desglossePiPc: boolean
  procesoSeguridad: string       // NO | A | B | C | D | E
  calidad1-5: boolean[]          // 5 checkboxes
  cumplimientoCalidad: number    // auto = (checked/5)*100
  rendimientoPromedio: number    // referencia a labores
  rendimientoCorteReal: number   // referencia a corte
  observaciones: string
}
```

---

## 🔌 Cambios Necesarios en el Backend {#backend}

### 1. Crear Funciones Azure para cada tabla

#### Azure Function: `postFormularioCorte`
```javascript
module.exports = async function (context, req) {
  const { formularioId, numeroColaborador, data } = req.body;
  
  // Inserta en FormularioRowsCorte
  // También actualiza FormularioRowMetadata
  
  return {
    status: 201,
    body: { id: newId, ...data }
  };
};
```

#### Azure Function: `postFormularioLabores`
```javascript
module.exports = async function (context, req) {
  const { formularioId, numeroColaborador, labores } = req.body;
  
  // Inserta en FormularioRowsLabores
  // Para cada labor, inserta en LaboresTotalPorFila
  // Calcula y updatea: rendimientoPromedio, camasTotales
  
  return {
    status: 201,
    body: { id: newId, cantidasLabores: labores.length }
  };
};
```

#### Azure Function: `postFormularioAseguramiento`
```javascript
module.exports = async function (context, req) {
  const { formularioId, numeroColaborador, calidades, seguridad } = req.body;
  
  // Inserta en FormularioRowsAseguramiento
  // Calcula cumplimientoCalidad = (calidades.filter(x=>x).length / 5) * 100
  // Marca formulario como completado si todas las secciones están lisas
  
  return {
    status: 201,
    body: { cumplimiento: calculado }
  };
};
```

### 2. Modificar endpoint `/(nuevo)?registro` en `registro/index.js`

```javascript
// En lugar de insertar todo en FormularioRows:
// 1. Inserta en FormularioRowsCorte (si tipoRegistro = 'Corte')
// 2. Inserta en FormularioRowsLabores (si tipoRegistro = 'Labores')
// 3. Inserta en FormularioRowsAseguramiento (si tipoRegistro = 'Aseguramiento')
// 4. En cualquier caso, actualiza FormularioRowMetadata
```

### 3. Crear endpoints para lectura

```
GET /api/formularios/:formularioId/corte
GET /api/formularios/:formularioId/labores
GET /api/formularios/:formularioId/aseguramiento
GET /api/formularios/:formularioId/metadata
```

### 4. Queries Stored Procedure para Dashboard (opcional pero recomendado)

```sql
CREATE PROCEDURE sp_DashboardResumen
    @fechaInicio DATETIME2,
    @fechaFin DATETIME2
AS
BEGIN
    -- Retorna datos consolidados para los 10 ejemplos de queries
END
```

---

## 🎨 Cambios en la Aplicación React {#frontend}

### 1. Tipos TypeScript actualizados

```typescript
// src/types/index.ts

export interface FilaCorte {
  id: string
  formularioId: string
  numeroColaborador: number
  nombreColaborador: string
  externo: boolean
  bloqueId: string
  variedadId: string
  // ... campos específicos
}

export interface FilaLaboresTotal {
  id: string
  formularioId: string
  numeroColaborador: number
  // ... campos específicos
  laborDetalles: LaborDetalle[]  // FK a LaboresTotalPorFila
}

export interface FilaAseguramiento {
  id: string
  formularioId: string
  numeroColaborador: number
  // ... campos específicos
}
```

### 2. Actualizar hook `useFormulario`

```typescript
// src/hooks/useFormulario.ts
export function useFormulario(formularioId: string) {
  const [formulario, setFormulario] = useState<{
    corte?: FilaCorte[]
    labores?: FilaLaboresTotal[]
    aseguramiento?: FilaAseguramiento[]
  }>(null)

  // En lugar de un array único, carga datos específicos
  useEffect(() => {
    Promise.all([
      fetch(`/api/formularios/${formularioId}/corte`),
      fetch(`/api/formularios/${formularioId}/labores`),
      fetch(`/api/formularios/${formularioId}/aseguramiento`)
    ]).then(...)
  }, [formularioId])

  return formulario
}
```

### 3. Actualizar NuevoRegistro.tsx

```typescript
// En lugar de filas: FilaColaborador[]
// Usar:
const [filasCorte, setFilasCorte] = useState<FilaCorte[]>([])
const [filasLabores, setFilasLabores] = useState<FilaLaboresTotal[]>([])
const [filasAseguramiento, setFilasAseguramiento] = useState<FilaAseguramiento[]>([])

// Or más simple:
const [filas, setFilas] = useState<{
  [key in TipoRegistro]: Fila[]
}>({
  'Corte': [],
  'Labores': [],
  'Aseguramiento': []
})

// Acceso: filas[tipoRegistro]
```

### 4. Actualizar FilaColaboradorForm.tsx

```typescript
// Ya está separado - solo mostrar la sección correcta
// {tipoRegistro === 'Corte' && <SectionCorte />}
// {tipoRegistro === 'Labores' && <SectionLabores />}
// {tipoRegistro === 'Aseguramiento' && <SectionAseguramiento />}
```

### 5. API Service updates

```typescript
// src/services/api.ts

export async function saveFilaCorte(formularioId: string, fila: FilaCorte) {
  return fetch(`/api/formularios/${formularioId}/corte`, {
    method: 'POST',
    body: JSON.stringify(fila)
  })
}

export async function saveFilaLabores(formularioId: string, fila: FilaLaboresTotal) {
  // Inserta fila + cada labor en LaboresTotalPorFila
}

export async function saveFilaAseguramiento(...) { ... }
```

---

## 📊 Implementación de Dashboard con Recharts {#dashboard}

### 1. Componente de Cards KPI

```typescript
// src/components/dashboard/KpiCards.tsx
import { Card } from '../ui/Card'
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics'

export function KpiCards() {
  const metrics = useDashboardMetrics() // ejecuta query #10

  return (
    <>
      <Card title="Formularios Activos">
        {metrics.formularios_activos}
      </Card>
      <Card title="Rendimiento Corte">
        {metrics.rendimiento_corte_promedio.toFixed(2)}%
      </Card>
      <Card title="Cumplimiento Calidad">
        {metrics.cumplimiento_calidad_promedio.toFixed(2)}%
      </Card>
      <Card title="Tallos Cortados">
        {metrics.tallos_totales_cortados}
      </Card>
    </>
  )
}
```

### 2. Gráfica LineChart - Tendencia

```typescript
// src/components/dashboard/ChartTendencia.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useTrendDataForChart } from '../../hooks/useTrendDataForChart' // query #2

export function ChartTendencia() {
  const data = useTrendDataForChart()

  return (
    <LineChart width={800} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="semana" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="rendimientoCorte" stroke="#8884d8" />
      <Line type="monotone" dataKey="rendimientoLabores" stroke="#82ca9d" />
      <Line type="monotone" dataKey="aseguramiento" stroke="#ffc658" />
    </LineChart>
  )
}
```

### 3. Gráfica BarChart - Bloques

```typescript
// src/components/dashboard/ChartPorBloque.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { useBlockMetrics } from '../../hooks/useBlockMetrics' // query #3

export function ChartPorBloque() {
  const data = useBlockMetrics()

  return (
    <BarChart width={800} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="bloqueId" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="rendimientoCorte" fill="#8884d8" />
      <Bar dataKey="rendimientoLabores" fill="#82ca9d" />
      <Bar dataKey="tallosProm" fill="#ffc658" />
    </BarChart>
  )
}
```

### 4. Gráfica PieChart - Calidad

```typescript
// src/components/dashboard/ChartCalidad.tsx
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import { useCalidadDistribution } from '../../hooks/useCalidadDistribution' // query #4

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function ChartCalidad() {
  const data = useCalidadDistribution()

  return (
    <PieChart width={400} height={300}>
      <Pie
        data={data}
        dataKey="cantidad"
        nameKey="nivelCalidad"
        cx="50%"
        cy="50%"
        outerRadius={80}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  )
}
```

### 5. Gráfica ScatterChart - Correlación

```typescript
// src/components/dashboard/ChartCorrelacion.tsx
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useCorrelationData } from '../../hooks/useCorrelationData' // query #7

export function ChartCorrelacion() {
  const data = useCorrelationData()

  return (
    <ScatterChart width={600} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="x_RendimientoCorte" type="number" name="Rendimiento Corte" />
      <YAxis dataKey="y_Calidad" type="number" name="Cumplimiento Calidad" />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Scatter name="Correlación" data={data} fill="#8884d8" />
    </ScatterChart>
  )
}
```

### 6. Página principal del Dashboard

```typescript
// src/pages/admin/Dashboard.tsx
import { KpiCards } from '../../components/dashboard/KpiCards'
import { ChartTendencia } from '../../components/dashboard/ChartTendencia'
import { ChartPorBloque } from '../../components/dashboard/ChartPorBloque'
import { ChartCalidad } from '../../components/dashboard/ChartCalidad'
import { ChartCorrelacion } from '../../components/dashboard/ChartCorrelacion'

export function Dashboard() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Dashboard Labores</h1>
      
      <KpiCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Tendencia - Últimas 12 semanas</h2>
          <ChartTendencia />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Rendimiento por Bloque</h2>
          <ChartPorBloque />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Distribución de Calidad</h2>
          <ChartCalidad />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Correlación: Corte vs Calidad</h2>
          <ChartCorrelacion />
        </div>
      </div>
    </div>
  )
}
```

---

## 📋 Plan de Migración {#migracion}

### Fase 1: Preparación (1-2 días)
- [ ] Generar respaldo de base de datos actual
- [ ] Ejecutar script de creación de tablas
- [ ] Verificar índices y constraints

### Fase 2: Migración de datos (1 día)
- [ ] Ejecutar inserts de datos históricos desde FormularioRows_OLD
- [ ] Validar integridad de datos
- [ ] Verificar counts de filas

### Fase 3: Backend (2-3 días)
- [ ] Ajustar Azure Functions
- [ ] Crear nuevos endpoints
- [ ] Tests de inserción/actualización
- [ ] Verificar transacciones ACID

### Fase 4: Frontend (2-3 días)
- [ ] Actualizar tipos TypeScript
- [ ] Refactor hooks
- [ ] Actualizar componentes
- [ ] Tests en dev

### Fase 5: Dashboard (2-3 días)
- [ ] Implementar hooks para queries
- [ ] Crear componentes Recharts
- [ ] Integrar en Dashboard.tsx
- [ ] Ajustar estilos

### Fase 6: Testing y Despliegue (1-2 días)
- [ ] Testing integración
- [ ] QA completo
- [ ] Deploy a producción
- [ ] Monitoreo

### Total Estimado: 1-2 semanas (depende de equipo)

---

## 🔐 Consideraciones de Seguridad

### 1. Validación de datos
```typescript
// Siempre validar en backend antes de insertar
const schema = z.object({
  rendimientoCorteReal: z.number().min(0).max(100),
  tallosReales: z.number().min(0),
  // ... más validaciones
})
```

### 2. Integridad referencial
- Usa FOREIGN KEY constraints
- ON DELETE CASCADE cuando sea apropiado

### 3. Auditoría
- Mantener fechaCreacion y fechaActualizacion
- Considerar tabla de logs para cambios sensibles

---

## 📚 Referencias
- Recharts: https://recharts.org/
- SQL Server: https://docs.microsoft.com/sql/
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/

---

**Documento creado**: 2026-04-11
**Versión**: 1.0
