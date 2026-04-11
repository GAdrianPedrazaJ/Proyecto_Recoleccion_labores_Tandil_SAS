// ============================================================================
// EJEMPLOS: Azure Functions actualizadas para tablas separadas
// ============================================================================
// Estos son ejemplos conceptuales de cómo adaptar las functions
// Usar como referencia para tus funciones reales
// ============================================================================

// ============================================================================
// 1. registro/index.js - ACTUALIZADO para insertar en tablas separadas
// ============================================================================

const { getExcelColumns, updateExcelRow } = require('../shared/sheets');
const sql = require('mssql');

module.exports = async function (context, req) {
  const { formularioId, tipoRegistro, filas } = req.body;

  try {
    // Conectar a base de datos
    const pool = new sql.ConnectionPool({
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      authentication: {
        type: 'default',
        options: { userName: process.env.DB_USER, password: process.env.DB_PASS }
      },
      options: { encrypt: true, trustServerCertificate: false }
    });

    await pool.connect();

    // Para cada fila de colaborador
    for (const fila of filas) {
      const filaId = generateUUID();

      if (tipoRegistro === 'Corte') {
        // Insertar en FormularioRowsCorte
        await insertarFilaCorte(pool, formularioId, filaId, fila);
      } else if (tipoRegistro === 'Labores') {
        // Insertar en FormularioRowsLabores
        // Y en LaboresTotalPorFila para cada labor
        await insertarFilaLabores(pool, formularioId, filaId, fila);
      } else if (tipoRegistro === 'Aseguramiento') {
        // Insertar en FormularioRowsAseguramiento
        await insertarFilaAseguramiento(pool, formularioId, filaId, fila);
      }

      // Actualizar metadata
      await actualizarMetadata(pool, formularioId, fila.numeroColaborador, tipoRegistro, filaId);
    }

    await pool.close();

    context.res = {
      status: 200,
      body: { success: true, registrosGuardados: filas.length }
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: error.message }
    };
  }
};

// ============================================================================
// 2. Función auxiliar: insertarFilaCorte
// ============================================================================
async function insertarFilaCorte(pool, formularioId, filaId, fila) {
  const request = pool.request();

  const query = `
    INSERT INTO FormularioRowsCorte (
      id, formularioId, numeroColaborador, nombreColaborador, colaboradorId,
      bloqueId, variedadId, variedadNombre, externo,
      tiempoEstimadoMinutos, tiempoEstimadoHoras,
      tiempoRealMinutos, tiempoRealHoras,
      tallosEstimados, tallosReales,
      horaInicio, horaFinCorteEstimado, horaFinCorteReal,
      horaCama,
      rendimientoCorteEstimado, rendimientoCorteReal,
      fechaCreacion
    )
    VALUES (
      @id, @formularioId, @numeroColaborador, @nombreColaborador, @colaboradorId,
      @bloqueId, @variedadId, @variedadNombre, @externo,
      @tiempoEstimadoMinutos, @tiempoEstimadoHoras,
      @tiempoRealMinutos, @tiempoRealHoras,
      @tallosEstimados, @tallosReales,
      @horaInicio, @horaFinCorteEstimado, @horaFinCorteReal,
      @horaCama,
      @rendimientoCorteEstimado, @rendimientoCorteReal,
      GETDATE()
    )
  `;

  request.input('id', sql.NVarChar(50), filaId);
  request.input('formularioId', sql.NVarChar(50), formularioId);
  request.input('numeroColaborador', sql.Int, fila.numeroColaborador);
  request.input('nombreColaborador', sql.NVarChar(100), fila.nombreColaborador);
  request.input('colaboradorId', sql.NVarChar(50), fila.colaboradorId || null);
  request.input('bloqueId', sql.NVarChar(50), fila.bloqueId || null);
  request.input('variedadId', sql.NVarChar(50), fila.variedadId || null);
  request.input('variedadNombre', sql.NVarChar(100), fila.variedadNombre || null);
  request.input('externo', sql.Bit, fila.externo ? 1 : 0);
  request.input('tiempoEstimadoMinutos', sql.Int, fila.tiempoEstimadoMinutos || 0);
  request.input('tiempoEstimadoHoras', sql.Decimal(10, 2), fila.tiempoEstimadoHoras || 0);
  request.input('tiempoRealMinutos', sql.Int, fila.tiempoRealMinutos || 0);
  request.input('tiempoRealHoras', sql.Decimal(10, 2), fila.tiempoRealHoras || 0);
  request.input('tallosEstimados', sql.Int, fila.tallosEstimados || 0);
  request.input('tallosReales', sql.Int, fila.tallosReales || 0);
  request.input('horaInicio', sql.Time, fila.horaInicio || null);
  request.input('horaFinCorteEstimado', sql.Time, fila.horaFinCorteEstimado || null);
  request.input('horaFinCorteReal', sql.Time, fila.horaFinCorteReal || null);
  request.input('horaCama', sql.Decimal(10, 2), fila.horaCama || 0);
  request.input('rendimientoCorteEstimado', sql.Decimal(10, 2), fila.rendimientoCorteEstimado || 0);
  request.input('rendimientoCorteReal', sql.Decimal(10, 2), fila.rendimientoCorteReal || 0);

  return request.query(query);
}

// ============================================================================
// 3. Función auxiliar: insertarFilaLabores (COMPLEJA - con detalles)
// ============================================================================
async function insertarFilaLabores(pool, formularioId, filaId, fila) {
  const request = pool.request();

  // Calcular valores derivados
  const cantidadLabores = fila.labores?.length || 0;
  const rendimientoPromedio = calcularRendimientoPromedio(fila.labores);
  const tiempoTotalEstimado = sumTimeMinutes(fila.labores, 'rendimientoHorasEstimado');
  const tiempoTotalReal = sumTimeMinutes(fila.labores, 'rendimientoHorasReal');
  const camasTotalEstimadas = (fila.labores || []).reduce((sum, l) => sum + (l.camasEstimadas || 0), 0);
  const camasTotalReales = (fila.labores || []).reduce((sum, l) => sum + (l.camasReales || 0), 0);

  // INSERT en FormularioRowsLabores
  const queryLabores = `
    INSERT INTO FormularioRowsLabores (
      id, formularioId, numeroColaborador, nombreColaborador, colaboradorId,
      bloqueId, variedadId, variedadNombre, externo,
      cantidadLaboresRegistradas, rendimientoPromedio,
      tiempoTotalLaboresEstimado, tiempoTotalLaboresReal,
      camasTotalEstimadas, camasTotalReales,
      fechaCreacion
    )
    VALUES (
      @id, @formularioId, @numeroColaborador, @nombreColaborador, @colaboradorId,
      @bloqueId, @variedadId, @variedadNombre, @externo,
      @cantidadLaboresRegistradas, @rendimientoPromedio,
      @tiempoTotalEstimado, @tiempoTotalReal,
      @camasTotalEstimadas, @camasTotalReales,
      GETDATE()
    )
  `;

  const req1 = pool.request();
  req1.input('id', sql.NVarChar(50), filaId);
  req1.input('formularioId', sql.NVarChar(50), formularioId);
  req1.input('numeroColaborador', sql.Int, fila.numeroColaborador);
  req1.input('nombreColaborador', sql.NVarChar(100), fila.nombreColaborador);
  req1.input('colaboradorId', sql.NVarChar(50), fila.colaboradorId || null);
  req1.input('bloqueId', sql.NVarChar(50), fila.bloqueId || null);
  req1.input('variedadId', sql.NVarChar(50), fila.variedadId || null);
  req1.input('variedadNombre', sql.NVarChar(100), fila.variedadNombre || null);
  req1.input('externo', sql.Bit, fila.externo ? 1 : 0);
  req1.input('cantidadLaboresRegistradas', sql.Int, cantidadLabores);
  req1.input('rendimientoPromedio', sql.Decimal(10, 2), rendimientoPromedio);
  req1.input('tiempoTotalEstimado', sql.Int, tiempoTotalEstimado);
  req1.input('tiempoTotalReal', sql.Int, tiempoTotalReal);
  req1.input('camasTotalEstimadas', sql.Int, camasTotalEstimadas);
  req1.input('camasTotalReales', sql.Int, camasTotalReales);

  await req1.query(queryLabores);

  // Para cada labor, INSERT en LaboresTotalPorFila
  if (fila.labores && fila.labores.length > 0) {
    for (const labor of fila.labores) {
      const laborId = generateUUID();
      const queryLabor = `
        INSERT INTO LaboresTotalPorFila (
          id, filaLaboresId, laborId, laborNombre,
          camasEstimadas, tiempoCamaEstimado, rendimientoHorasEstimado,
          camasReales, tiempoCamaReal, rendimientoHorasReal, rendimientoPorcentaje,
          fechaCreacion
        )
        VALUES (
          @id, @filaLaboresId, @laborId, @laborNombre,
          @camasEstimadas, @tiempoCamaEstimado, @rendimientoHorasEstimado,
          @camasReales, @tiempoCamaReal, @rendimientoHorasReal, @rendimientoPorcentaje,
          GETDATE()
        )
      `;

      const reqLabor = pool.request();
      reqLabor.input('id', sql.NVarChar(50), laborId);
      reqLabor.input('filaLaboresId', sql.NVarChar(50), filaId);
      reqLabor.input('laborId', sql.NVarChar(50), labor.laborId || null);
      reqLabor.input('laborNombre', sql.NVarChar(100), labor.laborNombre || null);
      reqLabor.input('camasEstimadas', sql.Int, labor.camasEstimadas || 0);
      reqLabor.input('tiempoCamaEstimado', sql.Int, labor.tiempoCamaEstimado || 0);
      reqLabor.input('rendimientoHorasEstimado', sql.Decimal(10, 2), labor.rendimientoHorasEstimado || 0);
      reqLabor.input('camasReales', sql.Int, labor.camasReales || 0);
      reqLabor.input('tiempoCamaReal', sql.Int, labor.tiempoCamaReal || 0);
      reqLabor.input('rendimientoHorasReal', sql.Decimal(10, 2), labor.rendimientoHorasReal || 0);
      reqLabor.input('rendimientoPorcentaje', sql.Decimal(10, 2), labor.rendimientoPorcentaje || 0);

      await reqLabor.query(queryLabor);
    }
  }
}

// ============================================================================
// 4. Función auxiliar: insertarFilaAseguramiento
// ============================================================================
async function insertarFilaAseguramiento(pool, formularioId, filaId, fila) {
  const request = pool.request();

  // Calcular cumplimiento de calidad
  const calidades = [
    fila.calidad1, fila.calidad2, fila.calidad3, fila.calidad4, fila.calidad5
  ].filter(Boolean).length;
  const cumplimientoCalidad = (calidades / 5) * 100;

  const query = `
    INSERT INTO FormularioRowsAseguramiento (
      id, formularioId, numeroColaborador, nombreColaborador, colaboradorId,
      bloqueId, variedadId, variedadNombre, externo,
      desglossePiPc, procesoSeguridad,
      calidad1, calidad2, calidad3, calidad4, calidad5,
      cumplimientoCalidad, rendimientoPromedio, rendimientoCorteReal,
      observaciones,
      fechaCreacion
    )
    VALUES (
      @id, @formularioId, @numeroColaborador, @nombreColaborador, @colaboradorId,
      @bloqueId, @variedadId, @variedadNombre, @externo,
      @desglossePiPc, @procesoSeguridad,
      @calidad1, @calidad2, @calidad3, @calidad4, @calidad5,
      @cumplimientoCalidad, @rendimientoPromedio, @rendimientoCorteReal,
      @observaciones,
      GETDATE()
    )
  `;

  request.input('id', sql.NVarChar(50), filaId);
  request.input('formularioId', sql.NVarChar(50), formularioId);
  request.input('numeroColaborador', sql.Int, fila.numeroColaborador);
  request.input('nombreColaborador', sql.NVarChar(100), fila.nombreColaborador);
  request.input('colaboradorId', sql.NVarChar(50), fila.colaboradorId || null);
  request.input('bloqueId', sql.NVarChar(50), fila.bloqueId || null);
  request.input('variedadId', sql.NVarChar(50), fila.variedadId || null);
  request.input('variedadNombre', sql.NVarChar(100), fila.variedadNombre || null);
  request.input('externo', sql.Bit, fila.externo ? 1 : 0);
  request.input('desglossePiPc', sql.Bit, fila.desglossePiPc ? 1 : 0);
  request.input('procesoSeguridad', sql.NVarChar(50), fila.procesoSeguridad || 'NO');
  request.input('calidad1', sql.Bit, fila.calidad1 ? 1 : 0);
  request.input('calidad2', sql.Bit, fila.calidad2 ? 1 : 0);
  request.input('calidad3', sql.Bit, fila.calidad3 ? 1 : 0);
  request.input('calidad4', sql.Bit, fila.calidad4 ? 1 : 0);
  request.input('calidad5', sql.Bit, fila.calidad5 ? 1 : 0);
  request.input('cumplimientoCalidad', sql.Decimal(10, 2), cumplimientoCalidad);
  request.input('rendimientoPromedio', sql.Decimal(10, 2), fila.rendimientoPromedio || 0);
  request.input('rendimientoCorteReal', sql.Decimal(10, 2), fila.rendimientoCorteReal || 0);
  request.input('observaciones', sql.NVarChar(sql.MAX), fila.observaciones || null);

  return request.query(query);
}

// ============================================================================
// 5. Función auxiliar: actualizarMetadata
// ============================================================================
async function actualizarMetadata(pool, formularioId, numeroColaborador, tipoRegistro, filaId) {
  const request = pool.request();

  const query = `
    IF NOT EXISTS (SELECT 1 FROM FormularioRowMetadata 
                  WHERE formularioId = @formularioId 
                  AND numeroColaborador = @numeroColaborador
                  AND tipoRegistro = @tipoRegistro)
    BEGIN
      INSERT INTO FormularioRowMetadata (
        id, formularioId, numeroColaborador, tipoRegistro, seCompleto,
        filaCorteId, filaLaboresId, filaAseguramientoId, fechaCreacion
      )
      VALUES (
        @id, @formularioId, @numeroColaborador, @tipoRegistro, 1,
        @filaCorteId, @filaLaboresId, @filaAseguramientoId, GETDATE()
      )
    END
    ELSE
    BEGIN
      UPDATE FormularioRowMetadata
      SET seCompleto = 1, fechaActualizacion = GETDATE()
      WHERE formularioId = @formularioId 
      AND numeroColaborador = @numeroColaborador
      AND tipoRegistro = @tipoRegistro
    END
  `;

  request.input('id', sql.NVarChar(50), generateUUID());
  request.input('formularioId', sql.NVarChar(50), formularioId);
  request.input('numeroColaborador', sql.Int, numeroColaborador);
  request.input('tipoRegistro', sql.NVarChar(50), tipoRegistro);
  request.input('filaCorteId', sql.NVarChar(50), tipoRegistro === 'Corte' ? filaId : null);
  request.input('filaLaboresId', sql.NVarChar(50), tipoRegistro === 'Labores' ? filaId : null);
  request.input('filaAseguramientoId', sql.NVarChar(50), tipoRegistro === 'Aseguramiento' ? filaId : null);

  return request.query(query);
}

// ============================================================================
// 6. Funciones auxiliares
// ============================================================================

function generateUUID() {
  // Generar UUID v4 simple
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function calcularRendimientoPromedio(labores) {
  if (!labores || labores.length === 0) return 0;
  const sum = labores.reduce((acc, l) => acc + (l.rendimientoPorcentaje || 0), 0);
  return Math.round((sum / labores.length) * 100) / 100;
}

function sumTimeMinutes(labores, field) {
  if (!labores || labores.length === 0) return 0;
  const sum = labores.reduce((acc, l) => acc + (l[field] || 0), 0);
  return Math.round(sum * 60); // Convertir horas a minutos si es necesario
}

// ============================================================================
// 7. GET - Obtener registros por tipo
// ============================================================================
/*
// getFormularioCorte/index.js
module.exports = async function(context, req) {
  const { formularioId } = req.query;
  const pool = new sql.ConnectionPool({...});
  
  const result = await pool
    .request()
    .input('formularioId', sql.NVarChar(50), formularioId)
    .query('SELECT * FROM FormularioRowsCorte WHERE formularioId = @formularioId');
  
  context.res = { status: 200, body: result.recordset };
};

// getFormularioLabores/index.js
module.exports = async function(context, req) {
  const { formularioId } = req.query;
  const pool = new sql.ConnectionPool({...});
  
  const result = await pool
    .request()
    .input('formularioId', sql.NVarChar(50), formularioId)
    .query(`
      SELECT l.*, 
             (SELECT COUNT(*) FROM LaboresTotalPorFila WHERE filaLaboresId = l.id) as cantidadLabores
      FROM FormularioRowsLabores l 
      WHERE l.formularioId = @formularioId
    `);
  
  context.res = { status: 200, body: result.recordset };
};

// getFormularioAseguramiento/index.js
module.exports = async function(context, req) {
  const { formularioId } = req.query;
  const pool = new sql.ConnectionPool({...});
  
  const result = await pool
    .request()
    .input('formularioId', sql.NVarChar(50), formularioId)
    .query('SELECT * FROM FormularioRowsAseguramiento WHERE formularioId = @formularioId');
  
  context.res = { status: 200, body: result.recordset };
};
*/
