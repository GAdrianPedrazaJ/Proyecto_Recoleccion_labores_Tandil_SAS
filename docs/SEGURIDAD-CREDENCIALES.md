# 🔒 Gestión de Credenciales y Seguridad

## ⚠️ Alerta GitGuardian (10 Abril 2026)

Se detectó **Company Email Password** expuesta en repositorio:
- **Tipo**: Google Cloud Service Account Private Key
- **Ubicación Original**: `azure-function/local.settings.json`
- **Commits Afectados**: 
  - 5f3ae65 (deploy: azure function)
  - 6d3ee4f (merge dev: azure function)
  - cc4c518 (fix: postRegistro payload)
- **Remediación**: Archivo ahora ignorado por `.gitignore`

## 🚀 Acción Requerida INMEDIATA

### 1. Regenerar Credenciales en Google Cloud

```bash
1. Ir a: Google Cloud Console
   https://console.cloud.google.com/iam-admin/serviceaccounts

2. Seleccionar: flowerhub-api (Service Account)

3. Pestaña: Keys

4. ELIMINAR: Principal key (Ya comprometida)

5. CREATE NEW KEY:
   - Type: JSON
   - Descargar nuevo file
```

### 2. Actualizar en Azure Functions

```bash
1. Azure Portal > Function App > Configuration

2. Agregar/Actualizar variables:
   - GOOGLE_SERVICE_ACCOUNT_EMAIL: <nuevo email>
   - GOOGLE_PRIVATE_KEY: <nueva private key JSON completa>

3. Save y Restart app
```

### 3. Limpiar Historial de Git (OPCIONAL - GitHub Desktop)

```bash
# Opción A: Usar BFG Repo-Cleaner (RECOMENDADO)
# Descarga: https://rtyley.github.io/bfg-repo-cleaner/

bfg --delete-file local.settings.json

# Opción B: git filter-branch (MÁS LENTO)
git filter-branch --tree-filter 'rm -f azure-function/local.settings.json' HEAD

# Opción C: GitHub cuenta con Secret Scanning (Ya detectado)
# Puedes ignorar el historial si las credenciales nuevas ya están regeneradas
```

## ✅ Mejores Prácticas

### Ambiente Local

```json
// ✅ CORRECTO: local.settings.json (en .gitignore)
{
  "Values": {
    "GOOGLE_PRIVATE_KEY": "NUNCA EN CÓDIGO",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL": "NUNCA EN CÓDIGO"
  }
}
```

### Ambiente Producción (Azure Functions)

```bash
# ✅ CORRECTO: Usar Configuration/App Settings
- No commitear a Git
- Usar Azure Key Vault para máxima seguridad
- Rotar keys cada 90 días
```

### Ambiente Desarrollo (Local)

```bash
# ✅ RECOMENDADO: Usar archivo .env local
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=<full_private_key>

# Cargar en código:
require('dotenv').config()
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const privateKey = process.env.GOOGLE_PRIVATE_KEY
```

## 🔐 Checklist de Seguridad

- [ ] Nueva credencial generada en Google Cloud
- [ ] Vieja credencial ELIMINADA en Google Cloud
- [ ] Nuevos valores configurados en Azure Functions
- [ ] Tests ejecutados para confirmar conexión
- [ ] Local.settings.json NO subido a Git
- [ ] .env archivos en .gitignore
- [ ] Credenciales NUNCA hardcodeadas en src/
- [ ] BFG ejecutado para limpiar historial (opcional)

## 📚 Referencias

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/)
- [Google Cloud Service Accounts](https://cloud.google.com/docs/authentication)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---
**Última actualización**: 10 Abril 2026
**Responsable**: GitGuardian Alert
**Estado**: ⚠️ PENDIENTE REMEDIACIÓN
