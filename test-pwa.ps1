#!/usr/bin/env pwsh
# Script para probar PWA localmente en Windows

Write-Host "🚀 Iniciando ambiente PWA..." -ForegroundColor Green

# 1. Instalar dependencias si no las tiene
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# 2. Build de producción
Write-Host "🔨 Compilando para producción..." -ForegroundColor Yellow
npm run build

# 3. Preview (modo producción)
Write-Host "`n✅ PWA lista para probar:`n" -ForegroundColor Green
Write-Host "📍 Abre en tu navegador: http://localhost:4173" -ForegroundColor Cyan
Write-Host "📱 Desde celular abre: http://TU_IP:4173`n" -ForegroundColor Cyan

Write-Host "💡 Instrucciones de prueba:" -ForegroundColor Green
Write-Host "   1. Abre DevTools (F12)" -ForegroundColor Gray
Write-Host "   2. Ve a Application > Manifest y Service Workers" -ForegroundColor Gray
Write-Host "   3. Verifica que el Service Worker esté 'activated and running'" -ForegroundColor Gray
Write-Host "   4. En Android: Chrome mostrará banner 'Instalar Labores Tandil'" -ForegroundColor Gray
Write-Host "   5. Desconecta internet y verifica que funciona offline" -ForegroundColor Gray

Write-Host "`n📲 Para obtener tu IP local:" -ForegroundColor Green
Write-Host "ipconfig" -ForegroundColor Cyan
Write-Host "(busca IPv4 Address, ej: 192.168.x.x)" -ForegroundColor Gray

npm run preview
