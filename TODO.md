# TODO: Fix navegación colaboradores → formulario

## ✅ Pendientes
- [x] Crear TODO.md
- [x] Editar AreaDetalle.tsx: cambiar navigate('planeacion') → 'select-tipo'
- [x] Verificar flujo completo: Sede → Area → Colabs → SelectTipo → NuevoRegistro
- [ ] Test: seleccionados.length >0, sessionStorage pasa, form init filas
- [ ] attempt_completion

## Notas
- Flujo actual: AreaDetalle → planeacion (complejo)
- Nuevo: AreaDetalle → select-tipo → nuevo-registro
- Dependencias: sessionStorage 'labores-selecciones' & 'labores-tipo-actual'

