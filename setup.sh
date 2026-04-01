#!/bin/bash

# Script de instalación para Linux/Mac

echo "================================"
echo "  F&F Workshop - Frontend Setup"
echo "================================"
echo ""

# Verificar Node.js
echo "[1/5] Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js instalado: $NODE_VERSION"
else
    echo "✗ Node.js NO encontrado. Instálalo desde: https://nodejs.org"
    exit 1
fi

# Verificar npm
echo "[2/5] Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm instalado: $NPM_VERSION"
else
    echo "✗ npm NO encontrado"
    exit 1
fi

# Instalar dependencias
echo "[3/5] Instalando dependencias..."
echo "Esto puede tomar unos minutos..."
npm install
if [ $? -eq 0 ]; then
    echo "✓ Dependencias instaladas correctamente"
else
    echo "✗ Error al instalar dependencias"
    exit 1
fi

# Verificar backend
echo "[4/5] Verificando backend..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✓ Backend está corriendo ✓"
else
    echo "⚠ Backend NO está corriendo en http://localhost:8080"
    echo "Necesitas iniciar el backend primero:"
    echo "  cd ../Mechanic_backend"
    echo "  docker-compose up -d"
    echo ""
    read -p "¿Deseas continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Todo listo
echo "[5/5] Verificación completada"
echo ""
echo "================================"
echo "  ✓ Setup completado exitosamente"
echo "================================"
echo ""
echo "Para iniciar el servidor de desarrollo:"
echo "  npm run dev"
echo ""
echo "Luego abre en tu navegador:"
echo "  http://localhost:5173"
echo ""
echo "Login de prueba:"
echo "  Email: admin@workshop.com"
echo "  Password: admin123"
echo ""
echo "Para más información, lee:"
echo "  - QUICKSTART.md (inicio rápido)"
echo "  - FINAL_SETUP.md (guía completa)"
echo "  - README.md (documentación)"
echo ""
