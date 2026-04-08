Guía rápida: conectar una Azure Function a un Excel (OneDrive / SharePoint) usando Microsoft Graph

Resumen
- Escenario: la app cliente envía `FormularioDia` a una Azure Function HTTP.
- Objetivo: la Function escribe los datos recibidos en un libro de Excel (archivo en OneDrive o SharePoint) usando Microsoft Graph.

Pasos altos
1. Registrar una app en Azure AD
   - En Azure Portal -> Azure Active Directory -> App registrations -> New registration.
   - Anotar `CLIENT_ID` y `TENANT_ID`.
   - Crear un client secret (`CLIENT_SECRET`) en "Certificates & secrets".
2. Permisos API (Application permissions)
   - En "API permissions" añadir permisos Microsoft Graph tipo Application:
     - `Files.ReadWrite.All` y/o `Sites.ReadWrite.All` (permitir que la Function edite archivos en OneDrive/SharePoint).
   - Grant admin consent.
3. Implementar Azure Function (Node.js) usando client credentials
   - Instalar dependencias: `npm i @microsoft/microsoft-graph-client isomorphic-fetch @azure/identity` (o usar `@azure/identity` + `@microsoft/microsoft-graph-client`).

Ejemplo (esqueleto, Node.js):

```js
const { Client } = require('@microsoft/microsoft-graph-client')
require('isomorphic-fetch')
const { ClientSecretCredential } = require('@azure/identity')

const credential = new ClientSecretCredential(process.env.TENANT_ID, process.env.CLIENT_ID, process.env.CLIENT_SECRET)

async function getGraphClient() {
  const token = await credential.getToken('https://graph.microsoft.com/.default')
  const client = Client.init({
    authProvider: (done) => done(null, token.token),
  })
  return client
}

module.exports = async function (context, req) {
  const client = await getGraphClient()
  const workbookPath = '/drive/root:/path/to/Libro.xlsx:' // ajustar según ubicación

  // Abrir workbook y tabla, luego añadir fila
  const payload = req.body // FormularioDia
  await client.api(`${workbookPath}/workbook/tables/{table-id}/rows/add`).post({ values: [[payload.id, payload.fecha, payload.supervisor]] })

  context.res = { status: 200, body: { ok: true } }
}
```

Notas y recomendaciones
- Si el archivo Excel no tiene una tabla, crea una tabla (tables) para poder insertar filas fácilmente.
- Para archivos en SharePoint, la ruta será `sites/{site-id}/drive/items/{item-id}` o usar drive by path.
- Maneja concurrencia y errores: respuestas no 200 desde Graph deben propagarse al cliente para reintentos.
- Seguridad: guarda `CLIENT_SECRET` en Azure Function App Settings (Configuration) y no en código.

Referencias
- Microsoft Graph REST: https://docs.microsoft.com/graph/api/resources/excel?view=graph-rest-1.0
- Autenticación con client credentials: https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow
