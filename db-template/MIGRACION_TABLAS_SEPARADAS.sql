-- ============================================================================
-- MIGRACIÓN: División de FormularioRows en 3 tablas especializadas
-- ============================================================================
-- Fecha: 2026-04-11
-- Descripción: 
--   Separar FormularioRows en tablas especializadas por tipo de formulario
--   manteniendo relaciones entre ellas para análisis y estadísticas.
--
-- Tablas nuevas:
--   1. FormularioRowsCorte       (datos de corte)
--   2. FormularioRowsLabores     (datos de labores)
--   3. FormularioRowsAseguramiento (datos de aseguramiento/cierre)
--
-- Relación: Todas comparten formularioId + numeroColaborador como clave compuesta
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla "FormularioRowsCorte"
-- ============================================================================
CREATE TABLE FormularioRowsCorte (
    id NVARCHAR(50) PRIMARY KEY,                    -- UUID único para el registro
    formularioId NVARCHAR(50) NOT NULL,             -- FK a Formularios
    numeroColaborador INT NOT NULL,                 -- Referencia al colaborador
    nombreColaborador NVARCHAR(100) NOT NULL,       -- Caché del nombre
    colaboradorId NVARCHAR(50),                     -- FK a Colaboradores (opcional, para queries más rápidas)
    bloqueId NVARCHAR(50),                          -- FK a Bloques
    variedadId NVARCHAR(50),                        -- FK a Variedades
    variedadNombre NVARCHAR(100),                   -- Caché
    externo BIT NOT NULL DEFAULT 0,                 -- Es colaborador externo
    
    -- Campos específicos de CORTE
    tiempoEstimadoMinutos INT,                      -- Minutos estimados
    tiempoEstimadoHoras DECIMAL(10, 2),             -- Horas calculadas (auto)
    tiempoRealMinutos INT,                          -- Minutos reales (se completa en cierre)
    tiempoRealHoras DECIMAL(10, 2),                 -- Horas reales calculadas
    tallosEstimados INT,                            -- Tallos estimados
    tallosReales INT,                               -- Tallos cortados reales
    horaInicio TIME,                                -- Hora de inicio del corte
    horaFinCorteEstimado TIME,                      -- Hora fin estimada
    horaFinCorteReal TIME,                          -- Hora fin real (se completa en cierre)
    horaCama DECIMAL(10, 2),                        -- Hora/cama calculada
    rendimientoCorteEstimado DECIMAL(10, 2),        -- Rendimiento estimado
    rendimientoCorteReal DECIMAL(10, 2),            -- Rendimiento real
    
    -- Metadatos
    fechaCreacion DATETIME2 DEFAULT GETDATE(),
    fechaActualizacion DATETIME2,
    FOREIGN KEY (formularioId) REFERENCES Formularios(id),
    UNIQUE (formularioId, numeroColaborador)       -- Garantiza un registro por colaborador por formulario
);

-- Índices para queries comunes
CREATE INDEX idx_FormularioRowsCorte_formularioId ON FormularioRowsCorte(formularioId);
CREATE INDEX idx_FormularioRowsCorte_bloqueId ON FormularioRowsCorte(bloqueId);
CREATE INDEX idx_FormularioRowsCorte_variedadId ON FormularioRowsCorte(variedadId);

-- ============================================================================
-- PASO 2: Crear tabla "FormularioRowsLabores"
-- ============================================================================
CREATE TABLE FormularioRowsLabores (
    id NVARCHAR(50) PRIMARY KEY,                    -- UUID único
    formularioId NVARCHAR(50) NOT NULL,             -- FK a Formularios
    numeroColaborador INT NOT NULL,                 -- Referencia al colaborador
    nombreColaborador NVARCHAR(100) NOT NULL,       -- Caché
    colaboradorId NVARCHAR(50),                     -- FK a Colaboradores
    bloqueId NVARCHAR(50),                          -- FK a Bloques
    variedadId NVARCHAR(50),                        -- FK a Variedades
    variedadNombre NVARCHAR(100),                   -- Caché
    externo BIT NOT NULL DEFAULT 0,
    
    -- Campos específicos de LABORES (relación con tabla LaboresTotalPorFila)
    cantidadLaboresRegistradas INT DEFAULT 0,       -- Cantidad de labores agregadas
    rendimientoPromedio DECIMAL(10, 2),             -- Promedio de rendimiento
    tiempoTotalLaboresEstimado INT,                 -- Suma de tiempos estimados en labores
    tiempoTotalLaboresReal INT,                     -- Suma de tiempos reales
    camasTotalEstimadas INT,                        -- Total de camas estimadas
    camasTotalReales INT,                           -- Total de camas reales
    
    -- Metadatos
    fechaCreacion DATETIME2 DEFAULT GETDATE(),
    fechaActualizacion DATETIME2,
    FOREIGN KEY (formularioId) REFERENCES Formularios(id),
    UNIQUE (formularioId, numeroColaborador)
);

-- Tabla detalle: una fila por labor dentro de un FormularioRowsLabores
CREATE TABLE LaboresTotalPorFila (
    id NVARCHAR(50) PRIMARY KEY,                    -- UUID único
    filaLaboresId NVARCHAR(50) NOT NULL,            -- FK a FormularioRowsLabores
    laborId NVARCHAR(50),                           -- FK a LaborCatalog
    laborNombre NVARCHAR(100),                      -- Caché del nombre
    camasEstimadas INT,
    tiempoCamaEstimado INT,                         -- minutos
    rendimientoHorasEstimado DECIMAL(10, 2),        -- auto: (camasEstimadas * tiempoCamaEstimado) / 60
    camasReales INT,
    tiempoCamaReal INT,
    rendimientoHorasReal DECIMAL(10, 2),            -- auto
    rendimientoPorcentaje DECIMAL(10, 2),           -- auto: (camasReales / camasEstimadas) * 100
    
    fechaCreacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (filaLaboresId) REFERENCES FormularioRowsLabores(id) ON DELETE CASCADE
);

CREATE INDEX idx_LaboresTotalPorFila_filaLaboresId ON LaboresTotalPorFila(filaLaboresId);
CREATE INDEX idx_FormularioRowsLabores_formularioId ON FormularioRowsLabores(formularioId);

-- ============================================================================
-- PASO 3: Crear tabla "FormularioRowsAseguramiento"
-- ============================================================================
CREATE TABLE FormularioRowsAseguramiento (
    id NVARCHAR(50) PRIMARY KEY,                    -- UUID único
    formularioId NVARCHAR(50) NOT NULL,             -- FK a Formularios
    numeroColaborador INT NOT NULL,                 -- Referencia al colaborador
    nombreColaborador NVARCHAR(100) NOT NULL,       -- Caché
    colaboradorId NVARCHAR(50),                     -- FK a Colaboradores
    bloqueId NVARCHAR(50),                          -- FK a Bloques
    variedadId NVARCHAR(50),                        -- FK a Variedades
    variedadNombre NVARCHAR(100),                   -- Caché
    externo BIT NOT NULL DEFAULT 0,
    
    -- Campos específicos de ASEGURAMIENTO / CIERRE
    desglossePiPc BIT DEFAULT 0,                    -- ¿Desglose PI.PC hecho?
    procesoSeguridad NVARCHAR(50),                  -- NO, A, B, C, D, E
    calidad1 BIT DEFAULT 0,
    calidad2 BIT DEFAULT 0,
    calidad3 BIT DEFAULT 0,
    calidad4 BIT DEFAULT 0,
    calidad5 BIT DEFAULT 0,
    cumplimientoCalidad DECIMAL(10, 2),             -- Porcentaje automático: (checked/5)*100
    
    -- Métricas del rendimiento (referencias a datos de CORTE y LABORES)
    rendimientoPromedio DECIMAL(10, 2),             -- Promedio de rendimiento labores
    rendimientoCorteReal DECIMAL(10, 2),            -- Del registro CORTE
    
    observaciones NVARCHAR(MAX),                    -- Notas libres
    
    -- Metadatos
    fechaCreacion DATETIME2 DEFAULT GETDATE(),
    fechaActualizacion DATETIME2,
    FOREIGN KEY (formularioId) REFERENCES Formularios(id),
    UNIQUE (formularioId, numeroColaborador)
);

CREATE INDEX idx_FormularioRowsAseguramiento_formularioId ON FormularioRowsAseguramiento(formularioId);

-- ============================================================================
-- PASO 4: Crear tabla "FormularioMetadata" para rastrear tipo de formulario
-- ============================================================================
-- Esta tabla ayuda a saber qué secciones se han completado para cada fila
CREATE TABLE FormularioRowMetadata (
    id NVARCHAR(50) PRIMARY KEY,
    formularioId NVARCHAR(50) NOT NULL,
    numeroColaborador INT NOT NULL,
    tipoRegistro NVARCHAR(50) NOT NULL,             -- 'Corte', 'Labores', 'Aseguramiento'
    seCompleto BIT DEFAULT 0,                       -- ¿Se completó la sección?
    
    -- Referencias a las filas en tablas específicas
    filaCorteId NVARCHAR(50),                       -- FK a FormularioRowsCorte (si aplica)
    filaLaboresId NVARCHAR(50),                     -- FK a FormularioRowsLabores (si aplica)
    filaAseguramientoId NVARCHAR(50),               -- FK a FormularioRowsAseguramiento (si aplica)
    
    fechaCreacion DATETIME2 DEFAULT GETDATE(),
    fechaActualizacion DATETIME2,
    FOREIGN KEY (formularioId) REFERENCES Formularios(id),
    UNIQUE (formularioId, numeroColaborador, tipoRegistro)
);

CREATE INDEX idx_FormularioRowMetadata_formularioId ON FormularioRowMetadata(formularioId);

-- ============================================================================
-- PASO 5: Crear vistas para compatibilidad (opcional)
-- ============================================================================
-- Si tienes código heredado que consulta FormularioRows, estas vistas
-- pueden ayudar a mantener compatibilidad mientras migras

CREATE VIEW FormularioRows_Corte AS
SELECT 
    id, formularioId, numeroColaborador, nombreColaborador, colaboradorId,
    bloqueId, variedadId, variedadNombre, externo,
    tiempoEstimadoMinutos, tiempoEstimadoHoras, tiempoRealMinutos, tiempoRealHoras,
    tallosEstimados, tallosReales, horaInicio, horaFinCorteEstimado, horaFinCorteReal,
    horaCama, rendimientoCorteEstimado, rendimientoCorteReal,
    fechaCreacion, fechaActualizacion
FROM FormularioRowsCorte;

CREATE VIEW FormularioRows_Labores AS
SELECT 
    id, formularioId, numeroColaborador, nombreColaborador, colaboradorId,
    bloqueId, variedadId, variedadNombre, externo,
    cantidadLaboresRegistradas, rendimientoPromedio,
    tiempoTotalLaboresEstimado, tiempoTotalLaboresReal,
    camasTotalEstimadas, camasTotalReales,
    fechaCreacion, fechaActualizacion
FROM FormularioRowsLabores;

CREATE VIEW FormularioRows_Aseguramiento AS
SELECT 
    id, formularioId, numeroColaborador, nombreColaborador, colaboradorId,
    bloqueId, variedadId, variedadNombre, externo,
    desglossePiPc, procesoSeguridad,
    calidad1, calidad2, calidad3, calidad4, calidad5,
    cumplimientoCalidad, rendimientoPromedio, rendimientoCorteReal,
    observaciones,
    fechaCreacion, fechaActualizacion
FROM FormularioRowsAseguramiento;

-- ============================================================================
-- PASO 6: Script de migración de datos (si ya tienes datos en FormularioRows)
-- ============================================================================
-- DESCOMENTAR Y EJECUTAR SOLO SI TIENES DATOS EN LA TABLA ANTIGUA

/*
-- Antes de ejecutar esto, RESPALDA tu base de datos

-- Migración de datos a FormularioRowsCorte
INSERT INTO FormularioRowsCorte (
    id, formularioId, numeroColaborador, nombreColaborador, colaboradorId,
    bloqueId, variedadId, variedadNombre, externo,
    tiempoEstimadoMinutos, tiempoEstimadoHoras, tiempoRealMinutos, tiempoRealHoras,
    tallosEstimados, tallosReales, horaInicio, horaFinCorteEstimado, horaFinCorteReal,
    horaCama, rendimientoCorteEstimado, rendimientoCorteReal
)
SELECT
    NEWID() as id,
    formularioId, numeroColaborador, nombreColaborador, NULL,
    NULL, NULL, NULL, externo,
    0, 0, 0, 0, tallosEstimados, tallosReales, horaInicio, NULL, NULL,
    0, 0, 0
FROM FormularioRows_OLD;

-- Migración de datos a FormularioRowsAseguramiento
INSERT INTO FormularioRowsAseguramiento (
    id, formularioId, numeroColaborador, nombreColaborador, colaboradorId,
    bloqueId, variedadId, variedadNombre, externo,
    desglossePiPc, procesoSeguridad, calidad1, calidad2, calidad3, calidad4, calidad5,
    cumplimientoCalidad, rendimientoPromedio, rendimientoCorteReal
)
SELECT
    NEWID() as id,
    formularioId, numeroColaborador, nombreColaborador, NULL,
    NULL, NULL, NULL, externo,
    0, 'NO', 0, 0, 0, 0, 0,
    cumplimiento * 100, 0, 0
FROM FormularioRows_OLD;
*/

-- ============================================================================
-- PASO 7: Modificar tabla Formularios (opcional)
-- ============================================================================
-- Si quieres rastrear qué tipos de formulario está usando cada registro
-- (no es obligatorio, solo para mejor manejo)

-- ALTER TABLE Formularios ADD columna_nueva_si_es_necesaria ...

print 'Migración completada exitosamente!';
print 'Tablas creadas:';
print '  - FormularioRowsCorte';
print '  - FormularioRowsLabores';
print '  - LaboresTotalPorFila';
print '  - FormularioRowsAseguramiento';
print '  - FormularioRowMetadata';
