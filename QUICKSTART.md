# 🚀 Inicio Rápido - F&F Workshop Frontend

## ⚡ 5 Pasos para Empezar

### 1️⃣ Instalar Dependencias

```powershell
npm install
```

### 2️⃣ Verificar que el Backend Esté Corriendo

```powershell
# El backend debe estar en http://localhost:8080
curl http://localhost:8080/health
```

Si NO está corriendo, iniciar el backend primero.

### 3️⃣ Iniciar el Frontend

```powershell
npm run dev
```

### 4️⃣ Abrir en el Navegador

```
http://localhost:5173
```

### 5️⃣ Login de Prueba

**Si es la primera vez**, necesitas crear un usuario en el backend:

```powershell
# Opción A: Usar Postman/Insomnia
POST http://localhost:8080/api/v1/auth/register
{
  "name": "Admin",
  "email": "admin@ffworkshop.com",
  "password": "admin123",
  "role": "admin"
}

# Opción B: Usar curl
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@ffworkshop.com",
    "password": "admin123",
    "role": "admin"
  }'
```

Luego login con:

```
Email: admin@ffworkshop.com
Password: admin123
```

---

## 🐳 Con Docker

### Desarrollo

```powershell
docker-compose up -d
```

Abre: http://localhost:5173

### Producción

```powershell
docker-compose -f docker-compose.prod.yml up -d
```

Abre: http://localhost:3000

---

## 📦 Estructura al Iniciar

Después de `npm install`, deberías tener:

```
Mechanic_frontend/
├── node_modules/          ✅ Instalado
├── src/                   ✅ Código fuente
├── public/               (opcional)
├── dist/                 (después de build)
├── package.json           ✅
├── vite.config.ts         ✅
├── tsconfig.json          ✅
├── tailwind.config.js     ✅
└── README.md              ✅
```

---

## ✅ Verificación

### 1. Frontend Corriendo

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2. Login Funciona

- Ver página de login
- Ingresar credenciales
- Redirect a dashboard
- Ver navbar con nombre de usuario

### 3. Datos se Cargan

- Dashboard muestra estadísticas
- Vehículos lista vacía o con datos
- No hay errores en consola

---

## 🚨 Problemas Comunes

### "npm install" falla

```powershell
# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "Network Error" al hacer login

**Causa**: Backend no está corriendo

**Solución**:

```powershell
# Ir a carpeta del backend
cd ..\Mechanic_backend

# Iniciar backend
docker-compose up -d

# Verificar
curl http://localhost:8080/health
```

### Puerto 5173 ocupado

```powershell
# Matar proceso en puerto 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# O cambiar puerto en vite.config.ts
server: {
  port: 5174
}
```

### CORS Error

**Causa**: Backend no permite http://localhost:5173

**Solución**: Verificar `.env` del backend:

```env
FRONTEND_URL=http://localhost:5173
```

---

## 📖 Siguientes Pasos

1. ✅ Login exitoso
2. 📋 Crear primer vehículo
3. 🔧 Crear primer servicio
4. 💰 Registrar primer pago
5. 📊 Ver estadísticas en dashboard

---

## 🆘 Ayuda

- Ver README completo: [README.md](README.md)
- Documentación del backend: [../Mechanic_backend/COMPREHENSIVE_DOCUMENTATION.md](../Mechanic_backend/COMPREHENSIVE_DOCUMENTATION.md)
- Issues: GitHub Issues

---

**¡Listo para trabajar!** 🚀
