Instrucciones para preparar el Excel y subir a OneDrive

Archivos incluidos (CSV):
- `Areas.csv` -> tabla `Areas`
- `Supervisors.csv` -> tabla `Supervisors`
- `Variedades.csv` -> tabla `Variedades`
- `Colaboradores.csv` -> tabla `Colaboradores`
- `Formularios.csv` -> tabla `Formularios`
- `FormularioRows.csv` -> tabla `FormularioRows`

Pasos para crear el archivo Excel con tablas (recomendado)
1. Abrir Excel y crear un nuevo libro.
2. Para cada CSV:
   - En la pestaña "Datos" seleccionar "Obtener datos" -> "Desde archivo" -> "Desde texto/CSV" y elegir el archivo correspondiente.
   - Importar, elegir codificación UTF-8 y confirmar.
   - Una vez importado, seleccionar la hoja y con el rango importado crear una Tabla (Insertar -> Tabla).
   - Asignar a la tabla el nombre exacto indicado arriba (p. ej. `Areas`).
3. Repetir para todas las CSVs.
4. Guardar el libro como `labores-db.xlsx`.
5. Subir `labores-db.xlsx` a OneDrive (en la carpeta que uses para la Azure Function).

Recomendaciones para la Azure Function
- La Function puede usar Microsoft Graph para localizar el workbook por path y la tabla por nombre, luego llamar a `/workbook/tables/{tableName}/rows/add`.
- Asegúrate de crear tablas (no solo rangos) para poder usar la API de `tables/{id}/rows/add`.
- Si quieres que la Function actualice asignaciones de `Area` / `Supervisor`, crea una tabla separada `Areas` (ya la incluimos) y una Function que busque la fila y la actualice.

Notas sobre el formato
- Las claves `id` son strings; puedes generar UUIDs desde la app o usar un prefijo legible.
- `formularioId` y `areaId` son claves que referencian otras tablas.
- `FormularioRows` contiene una fila por colaborador dentro de un formulario; esto facilita análisis y gráficas.

Siguiente paso opcional (puedo hacerlo por ti)
- Generar el `labores-db.xlsx` final con las tablas ya creadas (archivo .xlsx listo) y subirlo a la carpeta del repositorio o comprimir para descargar.
- Ajustar columnas para que coincidan exactamente con la hoja `LUNES LABORES` si quieres que el Excel tenga la misma disposición.

Dime si quieres que genere el `labores-db.xlsx` final aquí en el repo y lo deje listo para subir a OneDrive.