# TODO: Simplificar a 2 formularios - Planeacion (Corte+Labores) y Aseguramiento

## Pendientes
- [x] SelectTipo.tsx: 3→2 opciones ('Planeacion', 'Aseguramiento'), navigate('nuevo-registro', {tipo})
- [ ] FilaColaboradorForm.tsx: Para 'Planeacion' add:
  | Selector Bloque/Variedad 
  | Grid Corte: RendEst | RendReal
                   | TallEst | TallReal
                   | HoraIni | HoraFinEst (calc readonly)
                   | TiempoMin | HoraFinReal (calc)
                   | HoraCama display
  | Labores abajo (+ add, LaborRow)
- [ ] NuevoRegistro.tsx: tipo='Planeacion' validaciones nuevas, bloqueId/variedadId required
- [ ] useFormulario.ts: save para 'Planeacion' → api.savePlaneacion()
- [ ] Types: SeleccionColaborador bloqueId?:string, variedadId?:string
- [ ] Remover refs obsoletos FormularioCorte/Labores.tsx si no usados
- [ ] Test end-to-end

## Notas
- API lista: savePlaneacion() existe
- Reutilizar LaborRow, Select Bloque/Variedad de FilaColaboradorForm
- Calc: horaFinEst = tallosEst / rendEst
  horaFinReal = horaIni + tiempoEst/60
  horaCama = tiempoRealH / decimalHoraIni * 24

