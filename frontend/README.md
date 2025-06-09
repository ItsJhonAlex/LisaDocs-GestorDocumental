# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Frontend LisaDocs 🎨

## 🚀 Quick Start

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm run dev

# Build para producción
pnpm run build
```

## 🔧 Testing Backend Connection

Para verificar que la gestión de usuarios funciona correctamente:

### 1. Verificar Backend

```bash
# El backend debe estar ejecutándose en http://localhost:8080
# Desde la carpeta backend:
npm run dev
```

### 2. Verificar Conexión API

```bash
# Probar endpoint de usuarios (requiere autenticación)
curl -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Probar endpoint de salud
curl -X GET http://localhost:8080/api/health
```

### 3. Verificar en el Frontend

1. Ir a `/admin` o `/users` (solo administradores/presidentes)
2. El sistema debe mostrar:
   - ✅ "Sistema Operativo" si hay conexión
   - ⚠️ "Backend Desconectado" si no hay conexión
3. Los usuarios deben cargarse desde el backend
4. Debe poder crear, editar y eliminar usuarios

### 4. Funcionalidades de Gestión de Usuarios

**Roles disponibles:**

- `administrador` - Acceso total al sistema
- `presidente` - Gestión ejecutiva principal
- `vicepresidente` - Gestión ejecutiva secundaria
- `secretario_cam` - Cámara de Comercio
- `secretario_ampp` - Asociación de Municipios
- `secretario_cf` - Comisiones de Fiscalización
- `intendente` - Gestión territorial
- `cf_member` - Miembro de comisiones

**Workspaces disponibles:**

- `presidencia` - Presidencia del Consejo
- `intendencia` - Intendencia Regional
- `cam` - Cámara de Comercio (CAM)
- `ampp` - Asociación de Municipios (AMPP)
- `comisiones_cf` - Comisiones de Fiscalización (CF1-CF8)

## 🛡️ Permisos de Usuarios

| Acción | Administrador | Presidente | Otros |
|--------|--------------|------------|-------|
| Ver usuarios | ✅ | ✅ | ❌ |
| Crear usuarios | ✅ | ✅ (no admin) | ❌ |
| Editar usuarios | ✅ | ✅ (no admin) | Solo su perfil |
| Eliminar usuarios | ✅ | ✅ (no admin) | ❌ |
| Cambiar contraseñas | ✅ | ✅ (no admin) | ❌ |
| Ver estadísticas | ✅ | ✅ | ❌ |
| Exportar datos | ✅ | ✅ | ❌ |

## 🔗 API Endpoints Utilizados

```typescript
GET    /api/users              // Lista de usuarios con filtros
POST   /api/users              // Crear nuevo usuario
GET    /api/users/:id          // Obtener usuario por ID
PUT    /api/users/:id          // Actualizar usuario
DELETE /api/users/:id          // Eliminar usuario
PATCH  /api/users/:id/password // Cambiar contraseña
GET    /api/users/stats        // Estadísticas de usuarios
GET    /api/users/export       // Exportar usuarios
POST   /api/users/:id/resend-verification // Reenviar verificación
```

## 🎯 Componentes Principales

- `AdminDashboard` - Dashboard principal de administración
- `UserList` - Lista de usuarios con filtros y acciones
- `CreateUserDialog` - Modal para crear usuarios
- `EditUserDialog` - Modal para editar usuarios
- `UserDetailsDialog` - Modal para ver detalles de usuario

## 🔧 Hooks Utilizados

- `useUsers` - Gestión completa de usuarios (CRUD, filtros, estadísticas)
- `useAuth` - Autenticación y permisos de usuario
