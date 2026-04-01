# 🚗 F&F Workshop - Frontend

Frontend moderno para el sistema de gestión de talleres mecánicos F&F Workshop. Construido con React, TypeScript y Tailwind CSS.

## 📋 Características

- ✅ **Autenticación JWT** con access + refresh tokens
- ✅ **Rutas Protegidas** con redirects automáticos
- ✅ **CRUD Completo** para Vehículos, Servicios y Pagos
- ✅ **Dashboard** con estadísticas en tiempo real
- ✅ **Auto Refresh** de tokens cuando expiran
- ✅ **UI Responsive** optimizada para desktop y tablet
- ✅ **Manejo de Estados** con colores intuitivos
- ✅ **Búsqueda y Filtros** en tiempo real

## 🛠️ Stack Tecnológico

- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos modernos
- **React Router 6** - Navegación SPA
- **Axios** - Cliente HTTP con interceptores
- **Context API** - Manejo de estado global
- **Vite** - Build tool rápido

## 📁 Estructura del Proyecto

```
src/
├── app/
│   └── router.tsx              # Configuración de rutas
├── auth/
│   ├── AuthProvider.tsx        # Context de autenticación
│   ├── useAuth.ts              # Hook personalizado
│   └── authService.ts          # Servicios de auth
├── components/
│   ├── Layout.tsx              # Layout principal
│   ├── Navbar.tsx              # Barra de navegación
│   └── ProtectedRoute.tsx      # HOC para rutas protegidas
├── pages/
│   ├── Login.tsx               # Página de login
│   ├── Dashboard.tsx           # Estadísticas
│   ├── Vehicles.tsx            # CRUD vehículos
│   ├── Services.tsx            # CRUD servicios
│   └── Payments.tsx            # Registro de pagos
├── services/
│   └── api.ts                  # Config Axios + interceptores
└── types/
    ├── auth.ts                 # Tipos de autenticación
    ├── vehicle.ts              # Tipos de vehículos
    ├── service.ts              # Tipos de servicios
    └── payment.ts              # Tipos de pagos
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- npm o yarn
- Backend corriendo en `http://localhost:8080`

### Instalación

```powershell
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Abrir en navegador
# http://localhost:5173
```

### Con Docker

```powershell
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Autenticación

### Flujo de Autenticación

1. **Login** → Recibe access token (15 min) + refresh token (7 días)
2. **Access token** se guarda en memoria (useState)
3. **Refresh token** se guarda en localStorage
4. **Interceptor** detecta 401 y refresca automáticamente
5. **Logout** revoca tokens en backend

### Interceptor de Axios

```typescript
// Automáticamente:
// ✅ Agrega Authorization header
// ✅ Detecta token expirado (401)
// ✅ Refresca token automáticamente
// ✅ Reintenta request original
// ✅ Redirect a /login si falla
```

## 📄 Páginas

### 1. Login (`/login`)

- Email y password
- Manejo de errores
- Spinner de carga

### 2. Dashboard (`/`)

**Métricas:**
- Total de vehículos
- Servicios pendientes
- Servicios en progreso
- Servicios completados

**Acciones rápidas:**
- Nuevo vehículo
- Nuevo servicio 
- Registrar pago

### 3. Vehículos (`/vehicles`)

**Funcionalidades:**
- Lista completa de vehículos
- Búsqueda por placa/cliente/modelo
- Crear nuevo vehículo
- Editar vehículo existente
- Eliminar vehículo

**Campos:**
- Cliente
- Teléfono
- Modelo
- Placa (única)

### 4. Servicios (`/services`)

**Funcionalidades:**
- Vista en tarjetas
- Filtro por estado
- Crear servicio
- Editar servicio
- Cambio de estado con un click
- Asociar a vehículo

**Estados:**
- 🟡 **Pendiente** → Iniciar Trabajo
- 🔵 **En Progreso** → Marcar Completado
- 🟢 **Completado**
- 🔴 **Cancelado**

**Campos:**
- Vehículo (select)
- Descripción
- Costo
- Estado

### 5. Pagos (`/payments`)

**Funcionalidades:**
- Tabla de pagos registrados
- Registrar nuevo pago
- Ver saldo pendiente por servicio
- Eliminar pago

**Características:**
- Total recaudado
- Saldo pendiente automático
- Métodos de pago: Efectivo, Tarjeta, Transferencia, Otro
- Notas opcionales

**Cálculos automáticos:**
- Total pagado por servicio
- Saldo pendiente = Costo - Total Pagado

## 🎨 UI/UX

### Principios de Diseño

- **Botones grandes** y fáciles de tocar
- **Contraste fuerte** para lectura rápida
- **Colores por estado** (verde=ok, amarillo=pendiente, rojo=problema)
- **Sin animaciones innecesarias**
- **Responsive** para desktop y tablet

### Paleta de Colores

```
Primary (Azul):   #0ea5e9
Success (Verde):  #10b981
Warning (Amarillo): #f59e0b
Danger (Rojo):    #ef4444
Gray (Neutro):    #6b7280
```

## 🧪 Testing

```powershell
# Run tests (cuando estén implementados)
npm test

# Type checking
npm run tsc

# Linting
npm run lint
```

## 🐳 Docker

### Desarrollo

```dockerfile
# Hot reload habilitado
# Puerto: 5173
docker-compose up -d
```

### Producción

```dockerfile
# Build estático con nginx
# Puerto: 3000
docker-compose -f docker-compose.prod.yml up -d
```

### Build Manual

```powershell
# Build optimizado
npm run build

# Preview local
npm run preview
```

## 📱 Responsive

### Breakpoints

- **Mobile**: < 768px (básico)
- **Tablet**: 768px - 1024px ✅ Optimizado
- **Desktop**: > 1024px ✅ Optimizado

## 🔧 Configuración

### Cambiar URL del Backend

Editar [src/services/api.ts](src/services/api.ts):

```typescript
export const api = axios.create({
  baseURL: "http://localhost:8080/api/v1", // ← Cambiar aquí
  withCredentials: true,
});
```

### Variables de Entorno (Producción)

Crear `.env.production`:

```env
VITE_API_URL=https://api.ffworkshop.com/api/v1
```

Actualizar `api.ts`:

```typescript
baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"
```

## 🚀 Despliegue

### Netlify / Vercel

```powershell
# 1. Build
npm run build

# 2. Deploy carpeta dist/
```

**Redirects para SPA** (Netlify):

Crear `public/_redirects`:

```
/*    /index.html   200
```

### Nginx (VPS)

```nginx
server {
    listen 80;
    server_name workshop.example.com;
    root /var/www/workshop/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📝 Scripts Disponibles

```json
{
  "dev": "vite",                    // Desarrollo
  "build": "tsc && vite build",     // Producción
  "preview": "vite preview",        // Preview de build
  "lint": "eslint . --ext ts,tsx"   // Linting
}
```

## 🐛 Troubleshooting

### "Network Error" al hacer login

**Causa**: Backend no está corriendo o CORS bloqueado

**Solución**:
```powershell
# Verificar que el backend está corriendo
curl http://localhost:8080/health

# Verificar CORS en backend
# Debe permitir: http://localhost:5173
```

### Token expira constantemente

**Causa**: Reloj del sistema desincronizado

**Solución**: Sincronizar hora del sistema

### Redirect loop en login

**Causa**: Estado de autenticación corrupto

**Solución**:
```javascript
// En DevTools Console
localStorage.clear()
// Reload
```

### Build falla en producción

**Causa**: Type errors o dependencias faltantes

**Solución**:
```powershell
# Limpiar cache
rm -rf node_modules dist
npm install
npm run build
```

## 🔒 Seguridad

### Buenas Prácticas Implementadas

✅ Access token en memoria (no localStorage)
✅ Refresh token en localStorage (menor riesgo)
✅ withCredentials para cookies httpOnly
✅ Auto logout en 401 persistente
✅ Validación en frontend + backend
✅ HTTPS en producción (recomendado)

### NO Almacenar

❌ Contraseñas en texto plano
❌ Tokens en console.log
❌ Datos sensibles en localStorage sin cifrar

## 📚 Recursos

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/en/main)
- [Axios](https://axios-http.com/docs/intro)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-repo/issues)
- **Email**: support@ffworkshop.com
- **Docs**: [COMPREHENSIVE_DOCUMENTATION.md](COMPREHENSIVE_DOCUMENTATION.md)

---

**Versión**: 1.0.0  
**Estado**: ✅ Production Ready  
**Última Actualización**: Febrero 2026
#   m e c h a n i c - f r o n t e n d - r e p o  
 