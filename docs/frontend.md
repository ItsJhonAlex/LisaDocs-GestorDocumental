frontend/
├── 📁 src/
│   ├── 📄 main.tsx                     # Punto de entrada React
│   ├── 📄 App.tsx                      # Componente principal
│   ├── 📄 index.css                    # Estilos globales Tailwind
│   │
│   ├── 📁 components/
│   │   ├── 📁 ui/                      # Componentes shadcn/ui
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 input.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 dialog.tsx
│   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   ├── 📄 table.tsx
│   │   │   ├── 📄 badge.tsx
│   │   │   ├── 📄 sonner.tsx           # ✨ NUEVO: Sonner toasts
│   │   │   ├── 📄 avatar.tsx
│   │   │   ├── 📄 tabs.tsx
│   │   │   ├── 📄 select.tsx
│   │   │   ├── 📄 form.tsx
│   │   │   ├── 📄 label.tsx
│   │   │   ├── 📄 separator.tsx
│   │   │   ├── 📄 progress.tsx
│   │   │   └── 📄 skeleton.tsx
│   │   │
│   │   ├── 📁 layout/
│   │   │   ├── 📄 Header.tsx           # Header con nav y notificaciones
│   │   │   ├── 📄 Sidebar.tsx          # Sidebar con navegación por rol
│   │   │   ├── 📄 Layout.tsx           # Layout principal
│   │   │   ├── 📄 Navigation.tsx       # Navegación dinámica por rol
│   │   │   └── 📄 Breadcrumbs.tsx      # Breadcrumbs de navegación
│   │   │
│   │   ├── 📁 auth/
│   │   │   ├── 📄 LoginForm.tsx        # Formulario de login
│   │   │   ├── 📄 ProtectedRoute.tsx   # HOC para rutas protegidas
│   │   │   ├── 📄 RoleGuard.tsx        # Componente para verificar roles
│   │   │   └── 📄 AuthProvider.tsx     # Context provider de auth
│   │   │
│   │   ├── 📁 documents/
│   │   │   ├── 📄 DocumentList.tsx     # Lista de documentos
│   │   │   ├── 📄 DocumentCard.tsx     # Card individual de documento
│   │   │   ├── 📄 DocumentUpload.tsx   # Componente de upload
│   │   │   ├── 📄 DocumentViewer.tsx   # Visualizador de documentos
│   │   │   ├── 📄 DocumentFilters.tsx  # Filtros y búsqueda
│   │   │   ├── 📄 DocumentActions.tsx  # Acciones (archivar, eliminar)
│   │   │   └── 📄 DocumentStatus.tsx   # Badge de estado
│   │   │
│   │   ├── 📁 users/
│   │   │   ├── 📄 UserList.tsx         # Lista de usuarios (admin)
│   │   │   ├── 📄 UserForm.tsx         # Formulario crear/editar usuario
│   │   │   ├── 📄 UserProfile.tsx      # Perfil de usuario
│   │   │   ├── 📄 UserCard.tsx         # Card de usuario
│   │   │   └── 📄 RoleSelector.tsx     # Selector de rol
│   │   │
│   │   ├── 📁 workspaces/
│   │   │   ├── 📄 WorkspaceSwitch.tsx  # Cambiar entre espacios
│   │   │   ├── 📄 CAMDashboard.tsx     # Dashboard específico CAM
│   │   │   ├── 📄 AMPPDashboard.tsx    # Dashboard específico AMPP
│   │   │   ├── 📄 PresidenciaDashboard.tsx # Dashboard Presidencia
│   │   │   ├── 📄 IntendenciaDashboard.tsx # Dashboard Intendencia
│   │   │   └── 📄 ComisionesDashboard.tsx  # Dashboard Comisiones
│   │   │
│   │   ├── 📁 notifications/
│   │   │   ├── 📄 NotificationBell.tsx # Icono con contador
│   │   │   ├── 📄 NotificationList.tsx # Lista de notificaciones
│   │   │   ├── 📄 NotificationItem.tsx # Item individual
│   │   │   └── 📄 SonnerProvider.tsx   # ✨ NUEVO: Provider para Sonner
│   │   │
│   │   ├── 📁 admin/
│   │   │   ├── 📄 AdminDashboard.tsx   # Dashboard administrativo
│   │   │   ├── 📄 SystemSettings.tsx   # Configuraciones sistema
│   │   │   ├── 📄 AuditLog.tsx         # Log de auditoría
│   │   │   ├── 📄 SystemStats.tsx      # Estadísticas del sistema
│   │   │   └── 📄 PermissionMatrix.tsx # Matriz de permisos
│   │   │
│   │   └── 📁 common/
│   │       ├── 📄 LoadingSpinner.tsx   # Spinner de carga
│   │       ├── 📄 ErrorBoundary.tsx    # Manejo de errores
│   │       ├── 📄 ConfirmDialog.tsx    # Dialog de confirmación
│   │       ├── 📄 EmptyState.tsx       # Estado vacío
│   │       └── 📄 SearchBox.tsx        # Componente de búsqueda
│   │
│   ├── 📁 pages/
│   │   ├── 📄 LoginPage.tsx            # Página de login
│   │   ├── 📄 DashboardPage.tsx        # Dashboard principal
│   │   ├── 📄 DocumentsPage.tsx        # Página de documentos
│   │   ├── 📄 UsersPage.tsx            # Página de usuarios (admin)
│   │   ├── 📄 ProfilePage.tsx          # Página de perfil
│   │   ├── 📄 SettingsPage.tsx         # Página de configuraciones
│   │   ├── 📄 NotFoundPage.tsx         # Página 404
│   │   └── 📄 UnauthorizedPage.tsx     # Página sin permisos
│   │
│   ├── 📁 hooks/
│   │   ├── 📄 useAuth.ts               # Hook de autenticación
│   │   ├── 📄 useDocuments.ts          # Hook para documentos
│   │   ├── 📄 useUsers.ts              # Hook para usuarios
│   │   ├── 📄 useNotifications.ts      # Hook para notificaciones
│   │   ├── 📄 useUpload.ts             # Hook para uploads
│   │   ├── 📄 usePermissions.ts        # Hook para permisos
│   │   ├── 📄 useToast.ts              # ✨ NUEVO: Hook para Sonner toasts
│   │   └── 📄 useDebounce.ts           # Hook de debounce
│   │
│   ├── 📁 store/
│   │   ├── 📄 authStore.ts             # Store de autenticación (Zustand)
│   │   ├── 📄 documentsStore.ts        # Store de documentos
│   │   ├── 📄 usersStore.ts            # Store de usuarios
│   │   ├── 📄 notificationsStore.ts    # Store de notificaciones
│   │   ├── 📄 uiStore.ts               # Store de UI (sidebar, theme)
│   │   └── 📄 index.ts                 # Exports centralizados
│   │
│   ├── 📁 lib/
│   │   ├── 📄 api.ts                   # Cliente API (axios config)
│   │   ├── 📄 auth.ts                  # Utilidades de auth
│   │   ├── 📄 permissions.ts           # Lógica de permisos
│   │   ├── 📄 utils.ts                 # Utilidades generales (cn helper)
│   │   ├── 📄 constants.ts             # Constantes del frontend
│   │   ├── 📄 validators.ts            # Validadores con Zod
│   │   └── 📄 formatters.ts            # Formateo de datos
│   │
│   ├── 📁 types/
│   │   ├── 📄 auth.ts                  # Tipos de autenticación
│   │   ├── 📄 user.ts                  # Tipos de usuario
│   │   ├── 📄 document.ts              # Tipos de documento
│   │   ├── 📄 workspace.ts             # Tipos de espacios
│   │   ├── 📄 notification.ts          # Tipos de notificaciones
│   │   ├── 📄 api.ts                   # Tipos de API responses
│   │   └── 📄 global.ts                # Tipos globales
│   │
│   └── 📁 assets/
│       ├── 📁 icons/                   # Iconos SVG custom
│       ├── 📁 images/                  # Imágenes
│       └── 📁 files/                   # Archivos estáticos
│
├── 📁 public/
│   ├── 📄 vite.svg                     # Favicon
│   └── 📄 robots.txt                   # SEO
│
├── 📄 index.html                       # HTML principal
├── 📄 package.json                     # Dependencias
├── 📄 tailwind.config.js               # Config Tailwind
├── 📄 postcss.config.mjs               # Config PostCSS
├── 📄 tsconfig.json                    # Config TypeScript
├── 📄 tsconfig.app.json                # Config TypeScript app
├── 📄 tsconfig.node.json               # Config TypeScript node
├── 📄 vite.config.ts                   # Config Vite
├── 📄 components.json                  # ✨ NUEVO: Config shadcn/ui
└── 📄 README.md                        # Documentación
