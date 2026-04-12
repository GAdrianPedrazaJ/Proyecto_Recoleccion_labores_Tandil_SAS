import { useEffect, useState } from 'react'
import { useNavigationStore } from '../store/useNavigationStore'
import { useNavigation } from '../hooks/useNavigation'
import { getAreaById, getBloquesByArea, getAllVariedades, getAllVariedadesBloques, getColaboradoresByArea } from '../services/db'
import { syncFromRemote } from '../services/sync'
import type { Area, Bloque, Colaborador, SeleccionColaborador, Variedad, VariedadBloque } from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'

interface ColabRow {
  colaborador: Colaborador
  incluido: boolean
  bloqueId: string
  variedadId: string
}

export default function AreaDetalle() {
  const { params } = useNavigationStore()
  const areaId = String(params.areaId)
  const sedeId = String(params.sedeId ?? '')
  const navigate = useNavigation()
  const [area, setArea] = useState<Area | null>(null)
  const [rows, setRows] = useState<ColabRow[]>([])
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [variedades, setVariedades] = useState<Variedad[]>([])
  const [variedadesBloques, setVariedadesBloques] = useState<VariedadBloque[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!areaId) return
    const id = decodeURIComponent(areaId)
    setLoading(true)
    let [areaData, colabs, bloquesData, varsData, vbData] = await Promise.all([
      getAreaById(id),
      getColaboradoresByArea(id),
      getBloquesByArea(id),
      getAllVariedades(),
      getAllVariedadesBloques(),
    ])
    // If no data or variedadesBloques missing, try syncing once
    if (colabs.length === 0 || vbData.length === 0) {
      await syncFromRemote()
      ;[areaData, colabs, bloquesData, varsData, vbData] = await Promise.all([
        getAreaById(id),
        getColaboradoresByArea(id),
        getBloquesByArea(id),
        getAllVariedades(),
        getAllVariedadesBloques(),
      ])
    }
    setArea(areaData ?? null)
    setBloques(bloquesData)
    setVariedades(varsData)
    setVariedadesBloques(vbData)
    setRows(
      colabs.map((c) => ({
        colaborador: c,
        incluido: true,
        bloqueId: bloquesData[0]?.id ?? '',
        variedadId: '',
      })),
    )
    setLoading(false)
  }

  useEffect(() => { load() }, [areaId])

  const toggle = (idx: number) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, incluido: !r.incluido } : r)))

  const setBloque = (idx: number, bloqueId: string) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, bloqueId, variedadId: '' } : r)))

  const setVariedad = (idx: number, variedadId: string) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, variedadId } : r)))

  const [intentoIniciar, setIntentoIniciar] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState('Corte')

  const seleccionados = rows.filter((r) => r.incluido)

  const sinBloque = (r: ColabRow) => r.incluido && !r.bloqueId && bloques.length > 0
  const sinVariedad = (r: ColabRow) => r.incluido && !r.variedadId

  const handleIniciar = () => {
    setIntentoIniciar(true)
    if (seleccionados.length === 0) return
    const invalidos = seleccionados.filter((r) => sinBloque(r) || sinVariedad(r))
    if (invalidos.length > 0) return
    const selecciones: SeleccionColaborador[] = seleccionados.map((r) => ({
      colaboradorId: r.colaborador.id,
      nombre: r.colaborador.nombre,
      externo: r.colaborador.externo,
      bloqueId: r.bloqueId,
      variedadId: r.variedadId,
    }))
    // Guardar selecciones Y tipo en sessionStorage para pasar a NuevoRegistro
    sessionStorage.setItem('labores-selecciones', JSON.stringify(selecciones))
    sessionStorage.setItem('labores-tipo-actual', tipoRegistro)
    navigate('nuevo-registro', { areaId, sedeId: sedeId || '', tipo: tipoRegistro })
  }

  const bloquesOpts = bloques.map((b) => ({ value: b.id, label: b.nombre }))
  const getVarsOpts = (bloqueId: string) => {
    const allVars = variedades.map((v) => ({ value: v.id, label: v.nombre }))
    if (!bloqueId) return allVars
    const idsEnBloque = new Set(
      variedadesBloques.filter((vb) => vb.bloqueId === bloqueId).map((vb) => vb.variedadId)
    )
    // Si no hay restricciones definidas para el bloque, mostrar todas las variedades
    if (idsEnBloque.size === 0) return allVars
    return variedades
      .filter((v) => idsEnBloque.has(v.id))
      .map((v) => ({ value: v.id, label: v.nombre }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title={area?.nombre ?? 'Área'} showBack />

      <main className="flex-1 px-4 py-6 pb-32 space-y-4">
        {area && (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
            <h1 className="text-lg font-bold text-gray-900">{area.nombre}</h1>
            {area.sedeId && <p className="text-sm text-gray-500">Sede: {area.sedeId}</p>}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            No hay colaboradores. Sincroniza para actualizar.
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Colaboradores</h2>
              <span className="text-xs text-gray-500">{seleccionados.length} seleccionados</span>
            </div>

            {rows.map((row, idx) => (
              <div
                key={row.colaborador.id}
                className={`rounded-xl border p-3 space-y-3 transition-colors ${
                  row.incluido
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white opacity-60'
                }`}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={row.incluido}
                    onChange={() => toggle(idx)}
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="flex-1 font-medium text-gray-900 text-sm">
                    {row.colaborador.nombre}
                  </span>
                  {row.colaborador.externo && <Badge variant="blue">Externo</Badge>}
                </label>

                {row.incluido && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-0 sm:pl-8">
                    <div>
                      <Select
                        label="Bloque"
                        options={bloquesOpts}
                        placeholder="Seleccionar..."
                        value={row.bloqueId}
                        onChange={(e) => setBloque(idx, e.target.value)}
                        className={intentoIniciar && sinBloque(row) ? 'border-red-400 ring-1 ring-red-400' : ''}
                      />
                      {intentoIniciar && sinBloque(row) && (
                        <p className="mt-1 text-xs text-red-600">Requerido</p>
                      )}
                    </div>
                    <div>
                      <Select
                        label="Variedad"
                        options={getVarsOpts(row.bloqueId)}
                        placeholder="Seleccionar..."
                        value={row.variedadId}
                        onChange={(e) => setVariedad(idx, e.target.value)}
                        disabled={bloques.length > 0 && !row.bloqueId}
                        className={intentoIniciar && sinVariedad(row) ? 'border-red-400 ring-1 ring-red-400' : ''}
                      />
                      {intentoIniciar && sinVariedad(row) && (
                        <p className="mt-1 text-xs text-red-600">Requerido</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {!loading && (
        <div className="fixed bottom-16 inset-x-0 px-4 pb-2 space-y-2">
          {intentoIniciar && seleccionados.length === 0 && (
            <p className="text-center text-sm font-medium text-red-600 bg-red-50 rounded-lg py-2">
              Seleccioná al menos un colaborador
            </p>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow px-3 py-2">
            <Select
              label="Tipo de registro"
              options={[
                { value: 'Corte', label: 'Corte' },
                { value: 'Labores', label: 'Labores' },
                { value: 'Aseguramiento', label: 'Aseguramiento' },
              ]}
              value={tipoRegistro}
              onChange={(e) => setTipoRegistro(e.target.value)}
            />
          </div>
          <Button className="w-full shadow-lg" size="lg" onClick={handleIniciar}>
            Iniciar Formulario
            {seleccionados.length > 0 && ` · ${seleccionados.length} colaborador${seleccionados.length !== 1 ? 'es' : ''}`}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
