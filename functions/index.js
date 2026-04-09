const { onRequest } = require('firebase-functions/v2/https')
const express = require('express')
const { appendRows, readAllRows, updateRow } = require('./sheets')

const app = express()
app.use(express.json())

// ── GET /api/areas ──────────────────────────────────────────────────────────
app.get('/areas', async (req, res) => {
  try {
    const SHEET = process.env.SHEET_AREAS || 'Areas'
    const rows = await readAllRows(SHEET)
    const [, ...data] = rows
    const areas = data.map(r => ({
      id: r[0], nombre: r[1], sede: r[2], idSupervisor: r[3],
    }))
    res.json(areas)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── GET /api/bloques ────────────────────────────────────────────────────────
app.get('/bloques', async (req, res) => {
  try {
    const SHEET = process.env.SHEET_BLOQUES || 'Bloques'
    const rows = await readAllRows(SHEET)
    const [, ...data] = rows
    const bloques = data.map(r => ({ id: r[0], nombre: r[1], area: r[2] }))
    res.json(bloques)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── GET /api/colaboradores ──────────────────────────────────────────────────
app.get('/colaboradores', async (req, res) => {
  try {
    const SHEET = process.env.SHEET_COLABORADORES || 'Colaboradores'
    const rows = await readAllRows(SHEET)
    const [, ...data] = rows
    const colaboradores = data.map(r => ({
      id: r[0], nombre: r[1], esExterno: r[2] === 'TRUE',
      area: r[3], supervisor: r[4], asignado: r[5] === 'TRUE',
    }))
    res.json(colaboradores)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── GET /api/labores ────────────────────────────────────────────────────────
app.get('/labores', async (req, res) => {
  try {
    const SHEET = process.env.SHEET_LABORES || 'Labores'
    const rows = await readAllRows(SHEET)
    const [, ...data] = rows
    const labores = data.map(r => ({ id: r[0], nombre: r[1] }))
    res.json(labores)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── GET /api/sedes ──────────────────────────────────────────────────────────
app.get('/sedes', async (req, res) => {
  try {
    const SHEET = process.env.SHEET_SEDES || 'Sedes'
    const rows = await readAllRows(SHEET)
    const [, ...data] = rows
    const sedes = data.map(r => ({ id: r[0], nombre: r[1] }))
    res.json(sedes)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── GET /api/supervisores ───────────────────────────────────────────────────
app.get('/supervisores', async (req, res) => {
  try {
    const SHEET = process.env.SHEET_SUPERVISORES || 'Supervisors'
    const rows = await readAllRows(SHEET)
    const [, ...data] = rows
    const supervisores = data.map(r => ({
      id: r[0], nombre: r[1], idArea: r[2], sede: r[3],
    }))
    res.json(supervisores)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── GET /api/variedades ─────────────────────────────────────────────────────
app.get('/variedades', async (req, res) => {
  try {
    const SHEET = process.env.SHEET_VARIEDADES || 'Variedades'
    const rows = await readAllRows(SHEET)
    const [, ...data] = rows
    const variedades = data.map(r => ({ id: r[0], nombre: r[1] }))
    res.json(variedades)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── GET /api/variedadesBloques ──────────────────────────────────────────────
app.get('/variedadesBloques', async (req, res) => {
  try {
    const SHEET = process.env.SHEET_VARIEDADES_BLOQUES || 'VariedadesBloques'
    const rows = await readAllRows(SHEET)
    const [, ...data] = rows
    const vb = data.map(r => ({ idVariedad: r[0], idBloque: r[1] }))
    res.json(vb)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── PATCH /api/areas/:id/assign ─────────────────────────────────────────────
app.patch('/areas/:id/assign', async (req, res) => {
  try {
    const SHEET_AREAS = process.env.SHEET_AREAS || 'Areas'
    const SHEET_AUDIT = process.env.SHEET_AUDIT || 'Asignaciones'
    const { id } = req.params
    const { supervisorId } = req.body || {}
    if (!supervisorId) return res.status(400).json({ error: 'Missing supervisorId' })

    const rows = await readAllRows(SHEET_AREAS)
    const rowIdx = rows.findIndex(r => r[0] === id)
    if (rowIdx === -1) return res.status(404).json({ error: 'Area not found' })

    const row = [...rows[rowIdx]]
    row[3] = supervisorId
    await updateRow(SHEET_AREAS, rowIdx + 1, row)
    await appendRows(SHEET_AUDIT, [[id, supervisorId, new Date().toISOString()]])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── POST /api/registro ──────────────────────────────────────────────────────
app.post('/registro', async (req, res) => {
  const r = req.body
  if (!r || !r.id) return res.status(400).json({ error: 'Invalid payload: missing id' })

  try {
    const SHEET_FORMULARIOS = process.env.SHEET_FORMULARIOS || 'Formularios'
    const SHEET_ROWS = process.env.SHEET_ROWS || 'FormularioRows'

    if (r.formularioId) {
      const existing = await readAllRows(SHEET_FORMULARIOS)
      if (!existing.some(row => row[0] === r.formularioId)) {
        await appendRows(SHEET_FORMULARIOS, [[
          r.formularioId, r.fecha ?? '', r.areaId ?? '', r.supervisorId ?? '',
          r.tipo ?? '', r.fechaCreacion ?? '',
          r.sincronizado ? 'TRUE' : 'FALSE',
          r.intentosSincronizacion ?? 0,
          r.errorSincronizacionPermanente ? 'TRUE' : 'FALSE',
          r.ultimoError ?? '',
        ]])
      }
    }

    const labores = r.labores || []
    const lab = (i, field) => (labores[i] ? (labores[i][field] ?? '') : '')

    await appendRows(SHEET_ROWS, [[
      r.id, r.formularioId ?? '', r.colaboradorId ?? r.no ?? '',
      r.colaborador ?? '', r.externo ? 'TRUE' : 'FALSE',
      r.areaId ?? '', r.supervisorId ?? '', r.bloqueId ?? '', r.variedadId ?? '',
      r.tiempoEstimadoHoras ?? '', r.tiempoEstimadoMinutos ?? '',
      r.tiempoRealHoras ?? '', r.tiempoRealMinutos ?? '',
      r.tallosEstimados ?? 0, r.tallosReales ?? 0,
      r.horaInicio ?? '', r.horaFinCorteEstimado ?? '', r.horaFinCorteReal ?? '',
      r.horaCama ?? '', r.rendimientoCorteEstimado ?? '', r.rendimientoCorteReal ?? '',
      lab(0,'laborId'), lab(0,'camasEstimadas'), lab(0,'camasReales'), lab(0,'tiempoCamaEstimado'), lab(0,'tiempoCamaReal'), lab(0,'rendimientoHorasEstimado'), lab(0,'rendimientoHorasReal'), lab(0,'rendimientoPorcentaje'),
      lab(1,'laborId'), lab(1,'camasEstimadas'), lab(1,'camasReales'), lab(1,'tiempoCamaEstimado'), lab(1,'tiempoCamaReal'), lab(1,'rendimientoHorasEstimado'), lab(1,'rendimientoHorasReal'), lab(1,'rendimientoPorcentaje'),
      lab(2,'laborId'), lab(2,'camasEstimadas'), lab(2,'camasReales'), lab(2,'tiempoCamaEstimado'), lab(2,'tiempoCamaReal'), lab(2,'rendimientoHorasEstimado'), lab(2,'rendimientoHorasReal'), lab(2,'rendimientoPorcentaje'),
      lab(3,'laborId'), lab(3,'camasEstimadas'), lab(3,'camasReales'), lab(3,'tiempoCamaEstimado'), lab(3,'tiempoCamaReal'), lab(3,'rendimientoHorasEstimado'), lab(3,'rendimientoHorasReal'), lab(3,'rendimientoPorcentaje'),
      lab(4,'laborId'), lab(4,'camasEstimadas'), lab(4,'camasReales'), lab(4,'tiempoCamaEstimado'), lab(4,'tiempoCamaReal'), lab(4,'rendimientoHorasEstimado'), lab(4,'rendimientoHorasReal'), lab(4,'rendimientoPorcentaje'),
      r.desglossePiPc ? 'TRUE' : 'FALSE',
      r.procesoSeguridad ?? '',
      r.calidad1 ? 'TRUE' : 'FALSE', r.calidad2 ? 'TRUE' : 'FALSE',
      r.calidad3 ? 'TRUE' : 'FALSE', r.calidad4 ? 'TRUE' : 'FALSE',
      r.calidad5 ? 'TRUE' : 'FALSE',
      r.cumplimientoCalidad ?? '', r.rendimientoPromedio ?? '', r.observaciones ?? '',
    ]])

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

exports.api = onRequest({ region: 'us-central1' }, app)
