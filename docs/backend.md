backend/
├── 📁 src/
│   ├── 📄 server.ts                    # Servidor principal Fastify
│   ├── 📄 app.ts                       # Configuración de la aplicación
│   │
│   ├── 📁 config/
│   │   ├── 📄 database.ts              # Configuración Prisma/DB
│   │   ├── 📄 environment.ts           # Variables de entorno tipadas
│   │   └── 📄 constants.ts             # Constantes del sistema
│   │
│   ├── 📁 middleware/
│   │   ├── 📄 auth.ts                  # Middleware de autenticación JWT
│   │   ├── 📄 rbac.ts                  # Control de acceso basado en roles
│   │   ├── 📄 upload.ts                # Middleware para uploads
│   │   ├── 📄 validation.ts            # Validación de esquemas Zod
│   │   ├── 📄 errorHandler.ts          # Manejo global de errores
│   │   └── 📄 logging.ts               # Logging de requests
│   │
│   ├── 📁 routes/
│   │   ├── 📄 index.ts                 # Registro de todas las rutas
│   │   ├── 📁 auth/
│   │   │   ├── 📄 index.ts             # Rutas de autenticación
│   │   │   ├── 📄 login.ts             # POST /auth/login
│   │   │   ├── 📄 register.ts          # POST /auth/register (admin)
│   │   │   ├── 📄 refresh.ts           # POST /auth/refresh
│   │   │   └── 📄 logout.ts            # POST /auth/logout
│   │   │
│   │   ├── 📁 documents/
│   │   │   ├── 📄 index.ts             # Rutas de documentos
│   │   │   ├── 📄 upload.ts            # POST /documents/upload
│   │   │   ├── 📄 list.ts              # GET /documents (con filtros)
│   │   │   ├── 📄 get.ts               # GET /documents/:id
│   │   │   ├── 📄 download.ts          # GET /documents/:id/download
│   │   │   ├── 📄 status.ts            # PUT /documents/:id/status
│   │   │   ├── 📄 archive.ts           # PUT /documents/:id/archive
│   │   │   └── 📄 delete.ts            # DELETE /documents/:id
│   │   │
│   │   ├── 📁 users/
│   │   │   ├── 📄 index.ts             # Rutas de usuarios
│   │   │   ├── 📄 list.ts              # GET /users (admin)
│   │   │   ├── 📄 create.ts            # POST /users (admin)
│   │   │   ├── 📄 update.ts            # PUT /users/:id
│   │   │   ├── 📄 profile.ts           # GET/PUT /users/profile
│   │   │   └── 📄 permissions.ts       # GET /users/:id/permissions
│   │   │
│   │   ├── 📁 workspaces/
│   │   │   ├── 📄 index.ts             # Rutas de espacios de trabajo
│   │   │   ├── 📄 cam.ts               # Específico para CAM
│   │   │   ├── 📄 ampp.ts              # Específico para AMPP
│   │   │   ├── 📄 presidencia.ts       # Específico para Presidencia
│   │   │   ├── 📄 intendencia.ts       # Específico para Intendencia
│   │   │   └── 📄 comisiones.ts        # Específico para CF1-CF8
│   │   │
│   │   ├── 📁 notifications/
│   │   │   ├── 📄 index.ts             # Rutas de notificaciones
│   │   │   ├── 📄 list.ts              # GET /notifications
│   │   │   ├── 📄 read.ts              # PUT /notifications/:id/read
│   │   │   └── 📄 create.ts            # POST /notifications (sistema)
│   │   │
│   │   └── 📁 admin/
│   │       ├── 📄 index.ts             # Rutas administrativas
│   │       ├── 📄 dashboard.ts         # GET /admin/dashboard (stats)
│   │       ├── 📄 settings.ts          # GET/PUT /admin/settings
│   │       └── 📄 audit.ts             # GET /admin/audit (logs)
│   │
│   ├── 📁 services/
│   │   ├── 📄 authService.ts           # Lógica de autenticación
│   │   ├── 📄 userService.ts           # Gestión de usuarios
│   │   ├── 📄 documentService.ts       # Gestión de documentos
│   │   ├── 📄 fileService.ts           # Manejo de archivos (upload/download)
│   │   ├── 📄 notificationService.ts   # Sistema de notificaciones
│   │   ├── 📄 permissionService.ts     # Verificación de permisos
│   │   ├── 📄 workspaceService.ts      # Lógica de espacios de trabajo
│   │   └── 📄 auditService.ts          # Logging de actividades
│   │
│   ├── 📁 types/
│   │   ├── 📄 auth.ts                  # Tipos de autenticación
│   │   ├── 📄 user.ts                  # Tipos de usuario
│   │   ├── 📄 document.ts              # Tipos de documento
│   │   ├── 📄 workspace.ts             # Tipos de espacios de trabajo
│   │   ├── 📄 notification.ts          # Tipos de notificaciones
│   │   ├── 📄 api.ts                   # Tipos de respuestas API
│   │   └── 📄 database.ts              # Tipos de base de datos
│   │
│   ├── 📁 utils/
│   │   ├── 📄 jwt.ts                   # Utilidades JWT
│   │   ├── 📄 password.ts              # Hash/verify passwords
│   │   ├── 📄 validation.ts            # Esquemas de validación Zod
│   │   ├── 📄 fileUtils.ts             # Utilidades de archivos
│   │   ├── 📄 permissions.ts           # Matriz de permisos
│   │   ├── 📄 dateUtils.ts             # Manejo de fechas
│   │   └── 📄 constants.ts             # Constantes compartidas
│   │
│   └── 📁 schemas/
│       ├── 📄 auth.ts                  # Esquemas Zod auth
│       ├── 📄 user.ts                  # Esquemas Zod user
│       ├── 📄 document.ts              # Esquemas Zod document
│       └── 📄 common.ts                # Esquemas comunes
│
├── 📁 prisma/
│   ├── 📄 schema.prisma                # Esquema Prisma
│   ├── 📁 migrations/                  # Migraciones DB
│   └── 📄 seed.ts                      # Datos semilla
│
├── 📁 uploads/                         # Archivos subidos
│   ├── 📁 cam/                         # Documentos CAM
│   ├── 📁 ampp/                        # Documentos AMPP
│   ├── 📁 presidencia/                 # Documentos Presidencia
│   ├── 📁 intendencia/                 # Documentos Intendencia
│   └── 📁 comisiones_cf/               # Documentos Comisiones
│
├── 📁 tests/                           # Tests
│   ├── 📁 unit/                        # Tests unitarios
│   ├── 📁 integration/                 # Tests de integración
│   └── 📁 e2e/                         # Tests end-to-end
│
├── 📄 .env                             # Variables de entorno
├── 📄 .env.example                     # Ejemplo de variables
├── 📄 package.json                     # Dependencias
├── 📄 tsconfig.json                    # Config TypeScript
└── 📄 README.md                        # Documentación
