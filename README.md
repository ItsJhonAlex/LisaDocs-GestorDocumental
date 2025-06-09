# 📋 LisaDocs - Sistema de Gestión Documental

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-In%20Development-yellow.svg)

> **Sistema integral de gestión documental con control avanzado de roles, permisos granulares y flujos de trabajo organizacionales** 🏢✨

## 🌟 Descripción del Proyecto

**LisaDocs** es un sistema de gestión documental empresarial diseñado para organizaciones con estructuras jerárquicas complejas como Consejos de Administración Municipal (C.A.M), Asambleas Municipales del Poder Popular (A.M.P.P) y Presidencias organizacionales.

### 🎯 Características Principales

- ✅ **Gestión Avanzada de Roles y Permisos**
- ✅ **Control de Visibilidad Granular**
- ✅ **Sistema de Versionado Inteligente**
- ✅ **Ciclo de Vida Completo de Documentos**
- ✅ **Flujos de Trabajo Personalizables**
- ✅ **Auditoría y Trazabilidad Total**
- ✅ **Dashboard Personalizado por Rol**
- ✅ **Notificaciones en Tiempo Real**

## 🏗️ Arquitectura del Sistema

### 📊 Estructura Organizacional

```Roles
┌─────────────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                            │
├─────────────────────┬───────────────────┬───────────────────┤
│     PRESIDENTE      │   VICEPRESIDENTE  │  VICEPRESIDENTE   │
├─────────────────────┼───────────────────┼───────────────────┤
│       C.A.M         │      A.M.P.P      │    PRESIDENCIA    │
├─────────────────────┼───────────────────┼───────────────────┤
│   • Intendente      │ • Secretario AMPP │ • Secretario CF   │
│   • Vicepres. CAM   │ • Secretario CAM  │ • CF1, CF2, etc.  │
│   • Secretario CAM  │ • Comisiones CF   │ • Secretarías     │
└─────────────────────┴───────────────────┴───────────────────┘
```

### 🔧 Stack Tecnológico

#### Backend

- **Framework**: NestJS + TypeScript (Clean Architecture)
- **Base de Datos**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Autenticación**: Supabase Auth + JWT + Row Level Security (RLS)
- **Storage**: Supabase Storage para archivos y documentos
- **Real-time**: Supabase Realtime para notificaciones en vivo
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger/OpenAPI
- **Arquitectura**: Clean Architecture (Domain, Application, Infrastructure)

#### Frontend

- **Framework**: Next.js 14 + TypeScript (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand + React Query (TanStack Query)
- **Autenticación**: Supabase Auth Client
- **Real-time**: Supabase Realtime subscriptions
- **Forms**: React Hook Form + Zod validation
- **Routing**: Next.js App Router con middleware

#### Supabase Services

- **Database**: PostgreSQL con RLS policies
- **Auth**: Autenticación multi-provider (email, OAuth)
- **Storage**: Almacenamiento seguro de archivos
- **Edge Functions**: Serverless functions para lógica personalizada
- **Real-time**: Subscripciones en tiempo real
- **API**: Auto-generated REST y GraphQL APIs

#### DevOps & Herramientas

- **Contenedores**: Docker + Docker Compose
- **CI/CD**: GitHub Actions + Vercel (Frontend) + Railway/Render (Backend)
- **Monitoreo**: Winston + Morgan + Supabase Analytics
- **Testing**: Jest + Supertest + Playwright + Vitest

## 🔐 Sistema de Roles y Permisos

### 📋 Jerarquía de Roles

#### 🟢 Roles Principales (Máximo Acceso)

```typescript
enum MainRoles {
  ADMINISTRADOR = 'administrador',      // Acceso total al sistema
  PRESIDENTE = 'presidente',            // Autoridad ejecutiva máxima
  VICEPRESIDENTE = 'vicepresidente'     // Segundo en mando
}
```

#### 🔵 Roles de Zona (Acceso Medio)

```typescript
enum ZoneRoles {
  INTENDENTE = 'intendente',
  SECRETARIO_AMPP = 'secretario_ampp',
  SECRETARIO_CF = 'secretario_cf'
}
```

#### 🌸 Roles Subordinados (Acceso Específico)

```typescript
enum SubordinateRoles {
  VICEPRESIDENCIA_CAM = 'vicepresidencia_cam',
  SECRETARIO_CAM = 'secretario_cam',
  CF_MEMBER = 'cf_member',
  SECRETARIO_ESPECIALIZADA = 'secretario_especializada'
}
```

### 🎭 Espacios de Trabajo

```typescript
enum WorkSpaces {
  CAM = 'cam',                    // Consejo de Administración Municipal
  AMPP = 'ampp',                  // Asamblea Municipal del Poder Popular
  PRESIDENCIA = 'presidencia',    // Presidencia
  INTENDENCIA = 'intendencia',    // Espacio de Intendencia
  COMISIONES_CF = 'comisiones_cf' // Comisiones de Trabajo
}
```

### 🔒 Matriz de Permisos

| Rol | Crear | Leer | Editar | Eliminar | Aprobar | Archivar |
|-----|-------|------|--------|----------|---------|----------|
| **Administrador** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Presidente** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Vicepresidente** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Secretario** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **CF Member** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## 👁️ Sistema de Visibilidad y Trazabilidad

### 📤 Control de Subida de Documentos

```typescript
interface DocumentUpload {
  uploadedBy: {
    userId: string;
    userName: string;
    role: string;
    workspace: string;
    timestamp: Date;
  };
  visibility: {
    isPublic: boolean;
    allowedRoles: string[];
    allowedWorkspaces: string[];
    restrictedUsers?: string[];
  };
}
```

### 📥 Control de Descarga de Documentos

```typescript
interface DocumentDownload {
  downloadedBy: {
    userId: string;
    userName: string;
    role: string;
    ipAddress: string;
    timestamp: Date;
  };
  document: {
    documentId: string;
    version: string;
    fileName: string;
  };
}
```

### 🕵️ Auditoría Completa

- **Quién subió** cada documento y cuándo
- **Quién descargó** cada documento y cuándo
- **Quién modificó** y qué cambios realizó
- **Historial de aprobaciones** y rechazos
- **Logs de acceso** y actividad por usuario

## 📚 Sistema de Versionado

### 🔄 Versionado Semántico para Documentos

```Versiones
Formato: MAJOR.MINOR.PATCH
- MAJOR: Cambios importantes en contenido
- MINOR: Actualizaciones menores
- PATCH: Correcciones y ajustes
```

### 📋 Ejemplo de Versionado

```typescript
interface DocumentVersion {
  id: string;
  version: string;           // "1.2.3"
  title: string;
  content: string;
  changes: string;           // Descripción de cambios
  createdBy: string;
  createdAt: Date;
  status: VersionStatus;
  parentVersion?: string;    // Versión anterior
  tags: string[];
}

enum VersionStatus {
  DRAFT = 'borrador',
  UNDER_REVIEW = 'en_revision',
  APPROVED = 'aprobado',
  ARCHIVED = 'archivado'
}
```

### 🔀 Control de Versiones

- **Historial completo** de todas las versiones
- **Comparación visual** entre versiones
- **Restauración** a versiones anteriores
- **Merge de cambios** colaborativos
- **Ramas de desarrollo** para grandes cambios

## 🔄 Ciclo de Vida de Documentos

### 📈 Estados del Documento

```typescript
enum DocumentLifecycle {
  DRAFT = 'borrador',           // 📝 Documento en creación
  PENDING_REVIEW = 'pendiente_revision',  // ⏳ Esperando revisión
  UNDER_REVIEW = 'en_revision',     // 👀 En proceso de revisión
  PENDING_APPROVAL = 'pendiente_aprobacion', // ⏰ Esperando aprobación
  APPROVED = 'aprobado',        // ✅ Documento aprobado
  REJECTED = 'rechazado',       // ❌ Documento rechazado
  PUBLISHED = 'publicado',      // 📢 Disponible públicamente
  ARCHIVED = 'archivado',       // 📦 Archivado
  OBSOLETE = 'obsoleto'         // 🗑️ Documento obsoleto
}
```

### 🎯 Flujo de Estados

```Flujo de Estados
📝 DRAFT → ⏳ PENDING_REVIEW → 👀 UNDER_REVIEW → ⏰ PENDING_APPROVAL
                                                        ↓
📦 ARCHIVED ← 📢 PUBLISHED ← ✅ APPROVED
                                ↓
                           ❌ REJECTED → 📝 DRAFT
```

### ⏰ Reglas de Tiempo de Vida

- **Borradores**: Se eliminan automáticamente después de 30 días sin actividad
- **En Revisión**: Recordatorios automáticos cada 7 días
- **Aprobados**: Revisión obligatoria cada 12 meses
- **Archivados**: Conservación según políticas organizacionales

## ⚡ Flujos de Trabajo (Workflows)

### 🔄 Flujo de Aprobación Estándar

```typescript
interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
}

interface WorkflowStep {
  id: string;
  name: string;
  assignedRoles: string[];
  requiredActions: ActionType[];
  timeLimit?: number;        // En días
  escalationRules?: EscalationRule[];
}
```

### 📋 Tipos de Flujos Predefinidos

#### 🏛️ **Flujo C.A.M (Consejo de Administración Municipal)**

1. **Creación** → Secretario CAM
2. **Revisión Inicial** → Vicepresidencia CAM
3. **Aprobación** → Presidente
4. **Publicación** → Automática

#### 🏢 **Flujo A.M.P.P (Asamblea Municipal)**

1. **Borrador** → Secretario AMPP
2. **Revisión Técnica** → Comisión CF correspondiente
3. **Revisión Legal** → Secretario Especializada
4. **Aprobación Final** → Presidente/Vicepresidente
5. **Archivo** → Sistema automático

#### 📊 **Flujo de Comisiones CF**

1. **Propuesta** → Miembro CF
2. **Revisión de Pares** → Otros miembros CF
3. **Validación** → Secretario CF
4. **Aprobación** → Autoridad correspondiente

### ⚙️ Configuración de Workflows

```typescript
// Ejemplo de configuración
const camWorkflow: ApprovalWorkflow = {
  id: 'cam-standard',
  name: 'Flujo Estándar CAM',
  description: 'Proceso de aprobación para documentos del CAM',
  steps: [
    {
      id: 'step-1',
      name: 'Revisión Inicial',
      assignedRoles: ['secretario_cam'],
      requiredActions: ['review', 'comment'],
      timeLimit: 3
    },
    {
      id: 'step-2',
      name: 'Aprobación Final',
      assignedRoles: ['presidente', 'vicepresidente'],
      requiredActions: ['approve', 'reject'],
      timeLimit: 5
    }
  ]
};
```

## 🚀 Funcionalidades Avanzadas

### 🔔 Sistema de Notificaciones

- **Email automático** para asignaciones
- **Notificaciones push** en la aplicación
- **Recordatorios** de tareas pendientes
- **Escalamiento automático** por tiempo límite
- **Resúmenes diarios/semanales** por rol

### 📊 Dashboard y Reportes

- **Panel personalizado** según rol y workspace
- **Métricas de productividad** por departamento
- **Reportes de auditoría** detallados
- **Gráficos de flujo** de documentos
- **Estadísticas de tiempo** de aprobación

### 🔍 Búsqueda y Filtros Avanzados

- **Búsqueda full-text** en contenido
- **Filtros por metadatos** (fecha, autor, estado)
- **Búsqueda por tags** y categorías
- **Filtros por workspace** y rol
- **Búsqueda semántica** con IA

### 📱 Funcionalidades Móviles

- **App móvil responsive** para consultas
- **Aprobaciones rápidas** desde móvil
- **Notificaciones push** nativas
- **Lectura offline** de documentos
- **Firma digital** móvil

## 🗂️ Estructura del Proyecto

```Estructura de Proyecto
LisaDocs-GestorDocumental/
├── 📁 lisadocs-backend/ 
│   ├── 📁 src/
│   │   ├── 📁 domain/                 # Entidades y reglas de negocio
│   │   │   ├── 📁 entities/          # User, Document, Workflow, etc.
│   │   │   ├── 📁 repositories/      # Interfaces de repositorios
│   │   │   └── 📁 services/          # Servicios de dominio
│   │   ├── 📁 application/           # Casos de uso y DTOs
│   │   │   ├── 📁 use-cases/         # Casos de uso específicos
│   │   │   ├── 📁 dtos/              # Data Transfer Objects
│   │   │   └── 📁 interfaces/        # Interfaces de aplicación
│   │   ├── 📁 infrastructure/        # Implementaciones externas
│   │   │   ├── 📁 database/          # Supabase client y configuración
│   │   │   ├── 📁 repositories/      # Implementación de repositorios
│   │   │   ├── 📁 auth/              # Supabase Auth integration
│   │   │   ├── 📁 storage/           # Supabase Storage integration
│   │   │   └── 📁 realtime/          # Supabase Realtime integration
│   │   └── 📁 presentation/          # Controllers y middleware
│   │       ├── 📁 controllers/       # REST API controllers
│   │       ├── 📁 middleware/        # Auth, validation, etc.
│   │       ├── 📁 guards/            # Route guards
│   │       └── 📁 decorators/        # Custom decorators
│   ├── 📄 package.json
│   ├── 📄 supabase/
│   │   ├── 📄 migrations/            # Database migrations
│   │   ├── 📄 functions/             # Edge functions
│   │   └── 📄 config.toml            # Supabase configuration
│   └── 📄 docker-compose.yml
├── 📁 lisadocs-frontend/ 
│   ├── 📁 src/
│   │   ├── 📁 app/                   # App Router pages y layouts
│   │   │   ├── 📁 (auth)/            # Auth group routes
│   │   │   ├── 📁 dashboard/         # Dashboard routes
│   │   │   ├── 📁 documents/         # Documents management
│   │   │   ├── 📁 workflows/         # Workflow management
│   │   │   ├── 📁 admin/             # Admin panel
│   │   │   ├── 📄 layout.tsx         # Root layout
│   │   │   ├── 📄 page.tsx           # Home page
│   │   │   └── 📄 loading.tsx        # Loading UI
│   │   ├── 📁 components/            # Componentes reutilizables
│   │   │   ├── 📁 ui/                # shadcn/ui components
│   │   │   ├── 📁 layout/            # Layout components
│   │   │   ├── 📁 auth/              # Auth components
│   │   │   ├── 📁 documents/         # Document components
│   │   │   └── 📁 workflows/         # Workflow components
│   │   ├── 📁 lib/                   # Utilities y configuración
│   │   │   ├── 📄 supabase.ts        # Supabase client
│   │   │   ├── 📄 auth.ts            # Auth utilities
│   │   │   ├── 📄 utils.ts           # General utilities
│   │   │   └── 📄 validations.ts     # Zod schemas
│   │   ├── 📁 hooks/                 # Custom React hooks
│   │   │   ├── 📄 useAuth.ts         # Auth hook
│   │   │   ├── 📄 useSupabase.ts     # Supabase hooks
│   │   │   └── 📄 useRealtime.ts     # Real-time hooks
│   │   ├── 📁 store/                 # Estado global con Zustand
│   │   │   ├── 📄 authStore.ts       # Auth state
│   │   │   ├── 📄 documentStore.ts   # Documents state
│   │   │   └── 📄 workflowStore.ts   # Workflows state
│   │   ├── 📁 types/                 # TypeScript definitions
│   │   │   ├── 📄 database.ts        # Supabase generated types
│   │   │   ├── 📄 auth.ts            # Auth types
│   │   │   └── 📄 api.ts             # API types
│   │   └── 📁 middleware.ts          # Next.js middleware
│   ├── 📄 package.json
│   ├── 📄 next.config.js
│   ├── 📄 tailwind.config.js
│   └── 📄 tsconfig.json
├── 📁 supabase/                      # Configuración Supabase
│   ├── 📄 config.toml
│   ├── 📁 migrations/
│   ├── 📁 functions/
│   └── 📄 seed.sql
├── 📁 docs/
│   ├── 📄 api-documentation.md
│   ├── 📄 clean-architecture.md
│   ├── 📄 supabase-setup.md
│   └── 📄 deployment-guide.md
│   └── 📄 frontend.md
│   └── 📄 backend.md
│   └── 📄 models.md
└── 📄 README.md
```

## 📋 Roadmap de Desarrollo

### 🎯 Fase 1: Fundación (Semanas 1-4)

- [x] ✅ Análisis de requerimientos
- [ ] 🔄 Configuración del entorno de desarrollo
- [ ] 📊 Diseño de base de datos
- [ ] 🔐 Sistema básico de autenticación
- [ ] 👤 Gestión básica de usuarios y roles

### 🎯 Fase 2: Core Features (Semanas 5-8)

- [ ] 📄 CRUD de documentos
- [ ] 🔄 Sistema de versionado
- [ ] 🔒 Control de permisos granular
- [ ] 👁️ Auditoría básica (quién sube/baja)
- [ ] 🔄 Estados básicos del ciclo de vida

### 🎯 Fase 3: Workflows (Semanas 9-12)

- [ ] ⚡ Motor de workflows
- [ ] 📋 Flujos predefinidos por workspace
- [ ] 🔔 Sistema de notificaciones
- [ ] ⏰ Escalamiento automático
- [ ] 📊 Dashboard básico

### 🎯 Fase 4: Funcionalidades Avanzadas (Semanas 13-16)

- [ ] 🔍 Búsqueda avanzada
- [ ] 📊 Reportes y analytics
- [ ] 📱 Optimización móvil
- [ ] 🔐 Firma digital
- [ ] 🤖 Automatizaciones IA

### 🎯 Fase 5: Producción (Semanas 17-20)

- [ ] 🧪 Testing exhaustivo
- [ ] 🚀 Despliegue en producción
- [ ] 📚 Documentación final
- [ ] 🎓 Capacitación de usuarios
- [ ] 🔧 Soporte y mantenimiento

## 🛠️ Instalación y Configuración

### 📋 Prerrequisitos

- Node.js v18+
- pnpm (package manager)
- Docker & Docker Compose (opcional)
- Git
- Cuenta de Supabase (supabase.com)

### 🚀 Inicio Rápido

1. **Clonar el repositorio**

```bash
git clone https://github.com/ItsJhonAlex/LisaDocs-GestorDocumental.git
cd LisaDocs-GestorDocumental
```

2. **Configurar Supabase**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Crear nuevo proyecto en Supabase (desde dashboard)
# Copiar las credenciales del proyecto

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Supabase
```

3. **Variables de Entorno**

```bash
# .env.local (Frontend y Backend)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
DATABASE_URL=your_supabase_database_url

# Backend específico
NEST_APP_PORT=3001
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_custom_jwt_secret

# Frontend específico  
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **Setup del Backend (NestJS + Clean Architecture)**

```bash
cd backend

# Instalar dependencias
pnpm install

# Configurar Supabase client
pnpm add @supabase/supabase-js
pnpm add -D @types/node

# Generar tipos de Supabase
supabase gen types typescript --project-id your_project_id > src/types/database.ts

# Iniciar en modo desarrollo
pnpm run start:dev
```

5. **Setup del Frontend (Next.js 14)**

```bash
cd frontend

# Instalar dependencias
pnpm install

# Configurar Supabase y dependencias UI
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
pnpm add zustand @tanstack/react-query
pnpm add react-hook-form @hookform/resolvers zod
pnpm add tailwindcss @tailwindcss/forms @tailwindcss/typography
pnpm add lucide-react class-variance-authority clsx tailwind-merge

# Configurar shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card table

# Iniciar en modo desarrollo
pnpm run dev
```

6. **Configuración de Base de Datos**

```bash
# Aplicar migraciones iniciales
supabase db reset

# Ejecutar seeds con datos de ejemplo
supabase db seed

# Configurar Row Level Security policies
supabase db push
```

### 🗄️ **Configuración de Supabase**

#### **Schema de Base de Datos**

```sql
-- Usuarios con roles y workspaces
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('administrador', 'presidente', 'vicepresidente', 'secretario_cam', 'secretario_ampp', 'secretario_cf', 'intendente', 'cf_member')),
  workspace VARCHAR NOT NULL CHECK (workspace IN ('cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documentos con metadatos
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT,
  file_url VARCHAR,
  file_name VARCHAR,
  file_size INTEGER,
  mime_type VARCHAR,
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'under_review', 'pending_approval', 'approved', 'rejected', 'published', 'archived', 'obsolete')),
  workspace VARCHAR NOT NULL,
  version VARCHAR DEFAULT '1.0.0',
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Versiones de documentos
CREATE TABLE document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  content TEXT,
  file_url VARCHAR,
  changes_description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auditoría de acciones
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL,
  resource_type VARCHAR NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Row Level Security (RLS) Policies**

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy para usuarios: solo pueden ver su propia información y usuarios de su workspace
CREATE POLICY "Users can view own profile and workspace members" ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    workspace = (SELECT workspace FROM users WHERE auth.uid() = id)
  );

-- Policy para documentos: acceso basado en workspace y rol
CREATE POLICY "Document access based on workspace and role" ON documents
  FOR ALL USING (
    workspace = (SELECT workspace FROM users WHERE auth.uid() = id) OR
    (SELECT role FROM users WHERE auth.uid() = id) IN ('administrador', 'presidente')
  );
```

#### **Supabase Storage Buckets**

```sql
-- Crear bucket para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Policy para subir archivos
CREATE POLICY "Users can upload documents to their workspace" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

-- Policy para descargar archivos
CREATE POLICY "Users can download documents from their workspace" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );
```

## 🧪 Testing

### 🔬 Backend Tests

```bash
cd backend
pnpm run test              # Tests unitarios
pnpm run test:e2e          # Tests end-to-end
pnpm run test:coverage     # Cobertura de código
```

### 🎭 Frontend Tests

```bash
cd frontend
pnpm run test              # Tests con Jest
pnpm run test:ui           # Tests de componentes
pnpm run test:e2e          # Tests con Playwright
```

## 📊 Métricas y Monitoreo

### 📈 KPIs del Sistema

- **Tiempo promedio de aprobación** por tipo de documento
- **Documentos procesados** por día/semana/mes
- **Eficiencia por workspace** y rol
- **Tiempo de respuesta** del sistema
- **Satisfacción del usuario** (ratings)

### 🔍 Monitoreo Técnico

- **Performance** de la aplicación
- **Uso de recursos** (CPU, memoria, disco)
- **Logs de errores** y excepciones
- **Métricas de base de datos**
- **Seguridad** y auditoría de accesos

## 🤝 Contribución

### 📝 Conventional Commits

```Conventional Commits
feat(auth): add JWT refresh token mechanism
fix(documents): resolve version conflict on concurrent edits  
docs(readme): update installation instructions
style(ui): improve mobile responsiveness
refactor(workflows): optimize approval process performance
test(api): add integration tests for document upload
chore(deps): update dependencies to latest versions
```

### 🔄 Pull Request Process

1. **Fork** el repositorio
2. **Crear** una rama feature (`git checkout -b feature/amazing-feature`)
3. **Commit** los cambios (`git commit -m 'feat: add amazing feature'`)
4. **Push** a la rama (`git push origin feature/amazing-feature`)
5. **Crear** un Pull Request con descripción detallada

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🌟 Créditos

### 👨‍💻 Desarrollador Principal

**Jonathan Alejandro Rodriguez Lopes** - *El Mago del Stack* 🧙‍♂️

- GitHub: [@ItsJhonAlex](https://github.com/ItsJhonAlex)
- Email: <itsjhonalex@gmail.com>

### 🎯 Diseño Organizacional

Basado en el análisis del diagrama de roles y espacios de trabajo proporcionado, adaptado para un sistema de gestión documental empresarial moderno.

---

<div align="center">

**⭐ ¡Si este proyecto te resulta útil, no olvides darle una estrella! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/ItsJhonAlex/LisaDocs-GestorDocumental.svg?style=social&label=Star)](https://github.com/ItsJhonAlex/LisaDocs-GestorDocumental)
[![GitHub forks](https://img.shields.io/github/forks/ItsJhonAlex/LisaDocs-GestorDocumental.svg?style=social&label=Fork)](https://github.com/ItsJhonAlex/LisaDocs-GestorDocumental/fork)

</div>

---

> 💡 **"La documentación bien gestionada es la base de cualquier organización exitosa"** - LisaDocs Team

¡Construyamos juntos el futuro de la gestión documental! 🚀✨
