$src = "c:\Proyectos\Maria_Alejandra\Recoleccion_de_labores\labores-app\azure-function"
$zipPath = "$env:TEMP\func-deploy.zip"

# Credenciales ZipDeploy
$scmUrl = "func-labores-tandil-gzepegarh7b4h6ax.scm.eastus2-01.azurewebsites.net"
$user = '$func-labores-tandil'
$pass = "xGKNee83ijrhjwdBiq68n7QXAkTFG1smowNqMqnQcNKvkbua1T02SvhyCnAv"

Write-Host "SCM: $scmUrl"
Write-Host "User length: $($user.Length)"

# Crear ZIP sin node_modules
if (Test-Path $zipPath) { Remove-Item $zipPath }
Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
Get-ChildItem $src -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel) | Out-Null
}
$zip.Dispose()
Write-Host "ZIP: $((Get-Item $zipPath).Length) bytes"

# Deploy
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$resp = Invoke-WebRequest -Uri "https://$scmUrl/api/zipdeploy" -Method Post -Headers @{ Authorization = "Basic $cred" } -InFile $zipPath -ContentType "application/octet-stream"
Write-Host "Status: $($resp.StatusCode)"
