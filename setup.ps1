# 🚀 Script de Instalación Automática

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  F&F Workshop - Frontend Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js NO encontrado. Instálalo desde: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host "[2/5] Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm instalado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm NO encontrado" -ForegroundColor Red
    exit 1
}

# Instalar dependencias
Write-Host "[3/5] Instalando dependencias..." -ForegroundColor Yellow
Write-Host "Esto puede tomar unos minutos..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencias instaladas correctamente" -ForegroundColor Green
}
else {
    Write-Host "✗ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

# Verificar backend
Write-Host "[4/5] Verificando backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -Method GET -TimeoutSec 3
    Write-Host "✓ Backend está corriendo ✓" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Backend NO está corriendo en http://localhost:8080" -ForegroundColor Red
    Write-Host "Necesitas iniciar el backend primero:" -ForegroundColor Yellow
    Write-Host "  cd ..\Mechanic_backend" -ForegroundColor Cyan
    Write-Host "  docker-compose up -d" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "¿Deseas continuar de todos modos? (Y/N)" -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 1
    }
}

# Todo listo
Write-Host "[5/5] Verificación completada" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  ✓ Setup completado exitosamente" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar el servidor de desarrollo:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Luego abre en tu navegador:" -ForegroundColor Cyan
Write-Host "  http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Login de prueba:" -ForegroundColor Cyan
Write-Host "  Email: admin@workshop.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Para más información, lee:" -ForegroundColor Cyan
Write-Host "  - QUICKSTART.md (inicio rápido)" -ForegroundColor White
Write-Host "  - FINAL_SETUP.md (guía completa)" -ForegroundColor White
Write-Host "  - README.md (documentación)" -ForegroundColor White
Write-Host ""
