param()
$url = "https://fjjmasdgakchhzbcprlt.supabase.co/rest/v1"
$key = "sb_publishable_V5vs6RVClrL-hVV_hRcRRg_1En5sAK5"
$headers = @{
    "apikey"        = $key
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

function Invoke-Api($method, $path, $body = $null) {
    $params = @{ Method = $method; Uri = "$url$path"; Headers = $headers; ErrorAction = 'Stop' }
    if ($body) { $params.Body = ($body | ConvertTo-Json -Compress) }
    try {
        $r = Invoke-RestMethod @params
        return $r
    } catch {
        $msg = $_.Exception.Response | ForEach-Object {
            $reader = [System.IO.StreamReader]::new($_.GetResponseStream())
            $reader.ReadToEnd()
        }
        return "ERROR: $($_.Exception.Message) | $msg"
    }
}

function Test-Table($name, $table, $idField, $nameField, $testRecord, $testUpdate) {
    Write-Host "`n══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $name" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════" -ForegroundColor Cyan

    # 1. GET - leer todos
    Write-Host "`n[GET] Leer registros..." -ForegroundColor Yellow
    $rows = Invoke-Api "GET" "/${table}?select=*&limit=5"
    if ($rows -is [array] -or $rows -is [System.Object[]]) {
        Write-Host "  OK - $($rows.Count) registros (mostrando max 5)" -ForegroundColor Green
        $rows | ForEach-Object { Write-Host "    - $($_.$idField): $($_.$nameField)" }
    } else { Write-Host "  $rows" -ForegroundColor Red; return }

    # 2. POST - crear registro de prueba
    Write-Host "`n[POST] Crear registro de prueba..." -ForegroundColor Yellow
    $created = Invoke-Api "POST" "/$table" $testRecord
    if ($created -is [string] -and $created.StartsWith("ERROR")) {
        Write-Host "  $created" -ForegroundColor Red; return
    }
    $newId = if ($created -is [array]) { $created[0].$idField } else { $created.$idField }
    Write-Host "  OK - Creado con ID: $newId" -ForegroundColor Green

    # 3. PATCH - modificar
    Write-Host "`n[PATCH] Modificar registro $newId..." -ForegroundColor Yellow
    $updated = Invoke-Api "PATCH" "/${table}?${idField}=eq.${newId}" $testUpdate
    if ($updated -is [string] -and $updated.StartsWith("ERROR")) {
        Write-Host "  $updated" -ForegroundColor Red
    } else {
        $upName = if ($updated -is [array]) { $updated[0].$nameField } else { $updated.$nameField }
        Write-Host "  OK - Nuevo nombre: $upName" -ForegroundColor Green
    }

    # 4. DELETE - eliminar
    Write-Host "`n[DELETE] Eliminar registro $newId..." -ForegroundColor Yellow
    $deleted = Invoke-Api "DELETE" "/${table}?${idField}=eq.${newId}"
    if ($deleted -is [string] -and $deleted.StartsWith("ERROR")) {
        Write-Host "  $deleted" -ForegroundColor Red
    } else {
        Write-Host "  OK - Eliminado correctamente" -ForegroundColor Green
    }
}

# ── Áreas ─────────────────────────────────────────────────────────────────────
Test-Table "ÁREAS" "areas" "id_area" "nom_area" `
    @{ id_area = "TEST_AREA_001"; nom_area = "Area Test API"; sede = "TEST"; activo = $true } `
    @{ nom_area = "Area Test API (modificada)" }

# ── Colaboradores ─────────────────────────────────────────────────────────────
Test-Table "COLABORADORES" "colaboradores" "id_colaborador" "nom_colaborador" `
    @{ id_colaborador = "TEST_COLAB_001"; nom_colaborador = "Juan Test"; es_externo = $false; asignado = $false; activo = $true } `
    @{ nom_colaborador = "Juan Test (modificado)" }

# ── Bloques ────────────────────────────────────────────────────────────────────
Test-Table "BLOQUES" "bloques" "id_bloque" "nom_bloque" `
    @{ id_bloque = "TEST_BLOQUE_001"; nom_bloque = "Bloque Test"; area = "" } `
    @{ nom_bloque = "Bloque Test (modificado)" }

# ── Variedades ─────────────────────────────────────────────────────────────────
Test-Table "VARIEDADES" "variedades" "id_variedad" "nom_variedad" `
    @{ id_variedad = "TEST_VAR_001"; nom_variedad = "Variedad Test" } `
    @{ nom_variedad = "Variedad Test (modificada)" }

# ── Supervisores ───────────────────────────────────────────────────────────────
Test-Table "SUPERVISORES" "supervisors" "id_supervisor" "nom_supervisor" `
    @{ id_supervisor = "TEST_SUP_001"; nom_supervisor = "Supervisor Test"; sede = "TEST"; activo = $true } `
    @{ nom_supervisor = "Supervisor Test (modificado)" }

# ── Labores ────────────────────────────────────────────────────────────────────
Test-Table "LABORES" "labores" "id_labor" "nom_labor" `
    @{ id_labor = "TEST_LAB_001"; nom_labor = "Labor Test" } `
    @{ nom_labor = "Labor Test (modificada)" }

Write-Host "`n══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TESTS COMPLETADOS" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════`n" -ForegroundColor Cyan
