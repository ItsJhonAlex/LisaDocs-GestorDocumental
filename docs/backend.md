# 🏗️ Backend Documentation - LisaDocs

![NestJS](https://img.shields.io/badge/NestJS-10.3-red.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)
![Clean Architecture](https://img.shields.io/badge/Clean%20Architecture-✅-brightgreen.svg)

> **Documentación completa del backend de LisaDocs construido con NestJS, Clean Architecture, Supabase, y las mejores prácticas de desarrollo enterprise** 🚀✨

## 📋 Tabla de Contenidos

- [🏗️ Backend Documentation - LisaDocs](#️-backend-documentation---lisadocs)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [🏛️ Arquitectura Clean Architecture](#️-arquitectura-clean-architecture)
    - [🎯 **Principios de Clean Architecture**](#-principios-de-clean-architecture)
    - [🔧 **Patrón de Arquitectura**](#-patrón-de-arquitectura)
    - [📐 **Flujo de Dependencias**](#-flujo-de-dependencias)
  - [⚡ Stack Tecnológico](#-stack-tecnológico)
    - [🚀 **Core Framework**](#-core-framework)
    - [🗄️ **Database \& Backend Services**](#️-database--backend-services)
    - [🔐 **Authentication \& Security**](#-authentication--security)
    - [✅ **Validation \& DTOs**](#-validation--dtos)
    - [🧪 **Testing \& Quality**](#-testing--quality)
    - [📚 **Documentation \& Monitoring**](#-documentation--monitoring)
  - [📁 Estructura del Proyecto](#-estructura-del-proyecto)
  - [🚀 Setup y Configuración](#-setup-y-configuración)
    - [📦 **Instalación Inicial**](#-instalación-inicial)
    - [⚙️ **Configuración de NestJS**](#️-configuración-de-nestjs)
    - [🌍 **Variables de Entorno**](#-variables-de-entorno)
  - [🏗️ Modules y Dependency Injection](#️-modules-y-dependency-injection)
    - [📦 **App Module Principal**](#-app-module-principal)
    - [🚀 **Main Application**](#-main-application)
  - [🏛️ Domain Layer](#️-domain-layer)
    - [🎯 **User Entity**](#-user-entity)
    - [📄 **Document Entity**](#-document-entity)
    - [🏷️ **Domain Enums**](#️-domain-enums)
    - [💎 **Value Objects**](#-value-objects)
  - [🎯 Application Layer](#-application-layer)
    - [📋 **Use Cases**](#-use-cases)
    - [📄 **DTOs de Aplicación**](#-dtos-de-aplicación)
  - [🏗️ Infrastructure Layer](#️-infrastructure-layer)
    - [🗄️ **Supabase Configuration**](#️-supabase-configuration)
    - [🗃️ **Repository Implementations**](#️-repository-implementations)
  - [🎭 Presentation Layer](#-presentation-layer)
    - [🎮 **Controllers**](#-controllers)
    - [🛡️ **Guards y Decorators**](#️-guards-y-decorators)

## 🏛️ Arquitectura Clean Architecture

### 🎯 **Principios de Clean Architecture**

```typescript
// Arquitectura basada en:
🏛️ Separation of Concerns → Cada capa tiene su responsabilidad
🔄 Dependency Inversion → Dependencias apuntan hacia el dominio
🛡️ Domain-Driven Design → El dominio es el corazón del sistema
⚡ Testability → Cada capa es 100% testeable
🎨 SOLID Principles → Código mantenible y escalable
```

### 🔧 **Patrón de Arquitectura**

```Arquitectura Clean
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  Controllers, Guards, Middleware, DTOs, Decorators         │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                       │
│     Use Cases, Command/Query Handlers, Application DTOs    │
├─────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                          │
│    Entities, Value Objects, Domain Services, Repositories  │
├─────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                     │
│  Database, External APIs, File System, Email, Notifications│
└─────────────────────────────────────────────────────────────┘
```

### 📐 **Flujo de Dependencias**

```typescript
// Flujo de datos:
Request → Controller → UseCase → Repository → Database
Response ← Controller ← UseCase ← Repository ← Database

// Reglas de dependencias:
✅ Presentation → Application → Domain
✅ Infrastructure → Domain (solo interfaces)
❌ Domain NO depende de nada externo
❌ Application NO depende de Infrastructure
```

## ⚡ Stack Tecnológico

### 🚀 **Core Framework**

- **[NestJS 10.3](https://docs.nestjs.com/)** - Framework enterprise con TypeScript
- **[TypeScript 5.0+](https://www.typescriptlang.org/)** - Type safety y developer experience
- **[Node.js 18+](https://nodejs.org/)** - Runtime JavaScript/TypeScript
- **[Express](https://expressjs.com/)** - HTTP server framework (por defecto en NestJS)

### 🗄️ **Database & Backend Services**

- **[Supabase](https://supabase.com/)** - Backend-as-a-Service completo
- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos relacional (via Supabase)
- **[Supabase Client](https://supabase.com/docs/reference/javascript)** - Cliente oficial TypeScript
- **[Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)** - Seguridad a nivel de fila

### 🔐 **Authentication & Security**

- **[Supabase Auth](https://supabase.com/docs/guides/auth)** - Autenticación integrada
- **[JWT](https://jwt.io/)** - JSON Web Tokens para sesiones
- **[Passport.js](http://www.passportjs.org/)** - Middleware de autenticación
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Hash de contraseñas

### ✅ **Validation & DTOs**

- **[class-validator](https://github.com/typestack/class-validator)** - Validación decorative
- **[class-transformer](https://github.com/typestack/class-transformer)** - Transformación de objetos
- **[joi](https://joi.dev/)** - Schema validation alternativo

### 🧪 **Testing & Quality**

- **[Jest](https://jestjs.io/)** - Testing framework (incluido en NestJS)
- **[Supertest](https://github.com/visionmedia/supertest)** - HTTP testing
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** - Linting y formatting
- **[Husky](https://typicode.github.io/husky/)** - Git hooks

### 📚 **Documentation & Monitoring**

- **[Swagger/OpenAPI](https://swagger.io/)** - API documentation automática
- **[Winston](https://github.com/winstonjs/winston)** - Logging avanzado
- **[Morgan](https://github.com/expressjs/morgan)** - HTTP request logging

## 📁 Estructura del Proyecto

```Estructura de Proyecto
backend/
├── 📁 src/
│   ├── 📁 domain/                           # DOMAIN LAYER
│   │   ├── 📁 entities/                     # Entidades de dominio
│   │   │   ├── 📄 user.entity.ts
│   │   │   ├── 📄 document.entity.ts
│   │   │   ├── 📄 workflow.entity.ts
│   │   │   └── 📄 audit-log.entity.ts
│   │   ├── 📁 value-objects/                # Value Objects
│   │   │   ├── 📄 email.vo.ts
│   │   │   ├── 📄 password.vo.ts
│   │   │   └── 📄 document-version.vo.ts
│   │   ├── 📁 repositories/                 # Repository Interfaces
│   │   │   ├── 📄 user.repository.ts
│   │   │   ├── 📄 document.repository.ts
│   │   │   ├── 📄 workflow.repository.ts
│   │   │   └── 📄 audit-log.repository.ts
│   │   ├── 📁 services/                     # Domain Services
│   │   │   ├── 📄 permission.service.ts
│   │   │   ├── 📄 workflow-engine.service.ts
│   │   │   └── 📄 document-lifecycle.service.ts
│   │   └── 📁 enums/                        # Domain Enums
│   │       ├── 📄 user-role.enum.ts
│   │       ├── 📄 document-status.enum.ts
│   │       └── 📄 workspace.enum.ts
│   ├── 📁 application/                      # APPLICATION LAYER
│   │   ├── 📁 use-cases/                    # Use Cases
│   │   │   ├── 📁 auth/
│   │   │   │   ├── 📄 login.use-case.ts
│   │   │   │   ├── 📄 register.use-case.ts
│   │   │   │   └── 📄 refresh-token.use-case.ts
│   │   │   ├── 📁 documents/
│   │   │   │   ├── 📄 create-document.use-case.ts
│   │   │   │   ├── 📄 update-document.use-case.ts
│   │   │   │   ├── 📄 delete-document.use-case.ts
│   │   │   │   └── 📄 get-documents.use-case.ts
│   │   │   ├── 📁 workflows/
│   │   │   │   ├── 📄 start-workflow.use-case.ts
│   │   │   │   ├── 📄 approve-document.use-case.ts
│   │   │   │   └── 📄 reject-document.use-case.ts
│   │   │   └── 📁 users/
│   │   │       ├── 📄 create-user.use-case.ts
│   │   │       ├── 📄 update-user.use-case.ts
│   │   │       └── 📄 get-users.use-case.ts
│   │   ├── 📁 dtos/                         # Application DTOs
│   │   │   ├── 📁 auth/
│   │   │   ├── 📁 documents/
│   │   │   ├── 📁 workflows/
│   │   │   └── 📁 users/
│   │   ├── 📁 interfaces/                   # Application Interfaces
│   │   │   ├── 📄 auth.service.interface.ts
│   │   │   ├── 📄 email.service.interface.ts
│   │   │   └── 📄 storage.service.interface.ts
│   │   └── 📁 events/                       # Domain Events
│   │       ├── 📄 document-created.event.ts
│   │       ├── 📄 document-approved.event.ts
│   │       └── 📄 user-registered.event.ts
│   ├── 📁 infrastructure/                   # INFRASTRUCTURE LAYER
│   │   ├── 📁 database/                     # Database Layer
│   │   │   ├── 📁 supabase/
│   │   │   │   ├── 📄 supabase.client.ts
│   │   │   │   ├── 📄 supabase.config.ts
│   │   │   │   └── 📄 supabase.module.ts
│   │   │   ├── 📁 repositories/             # Repository Implementations
│   │   │   │   ├── 📄 user.repository.impl.ts
│   │   │   │   ├── 📄 document.repository.impl.ts
│   │   │   │   ├── 📄 workflow.repository.impl.ts
│   │   │   │   └── 📄 audit-log.repository.impl.ts
│   │   │   └── 📁 migrations/               # Database Migrations
│   │   │       ├── 📄 001_create_users.sql
│   │   │       ├── 📄 002_create_documents.sql
│   │   │       └── 📄 003_create_workflows.sql
│   │   ├── 📁 auth/                         # Authentication Infrastructure
│   │   │   ├── 📄 supabase-auth.service.ts
│   │   │   ├── 📄 jwt.strategy.ts
│   │   │   └── 📄 auth.module.ts
│   │   ├── 📁 storage/                      # File Storage
│   │   │   ├── 📄 supabase-storage.service.ts
│   │   │   └── 📄 storage.module.ts
│   │   ├── 📁 email/                        # Email Service
│   │   │   ├── 📄 supabase-email.service.ts
│   │   │   └── 📄 email.module.ts
│   │   └── 📁 realtime/                     # Real-time Service
│   │       ├── 📄 supabase-realtime.service.ts
│   │       └── 📄 realtime.module.ts
│   ├── 📁 presentation/                     # PRESENTATION LAYER
│   │   ├── 📁 controllers/                  # REST Controllers
│   │   │   ├── 📄 auth.controller.ts
│   │   │   ├── 📄 documents.controller.ts
│   │   │   ├── 📄 workflows.controller.ts
│   │   │   ├── 📄 users.controller.ts
│   │   │   └── 📄 health.controller.ts
│   │   ├── 📁 guards/                       # Route Guards
│   │   │   ├── 📄 jwt-auth.guard.ts
│   │   │   ├── 📄 roles.guard.ts
│   │   │   └── 📄 permissions.guard.ts
│   │   ├── 📁 decorators/                   # Custom Decorators
│   │   │   ├── 📄 current-user.decorator.ts
│   │   │   ├── 📄 roles.decorator.ts
│   │   │   └── 📄 permissions.decorator.ts
│   │   ├── 📁 interceptors/                 # Interceptors
│   │   │   ├── 📄 logging.interceptor.ts
│   │   │   ├── 📄 transform.interceptor.ts
│   │   │   └── 📄 audit.interceptor.ts
│   │   ├── 📁 filters/                      # Exception Filters
│   │   │   ├── 📄 global-exception.filter.ts
│   │   │   ├── 📄 validation-exception.filter.ts
│   │   │   └── 📄 supabase-exception.filter.ts
│   │   └── 📁 middleware/                   # Custom Middleware
│   │       ├── 📄 cors.middleware.ts
│   │       └── 📄 rate-limit.middleware.ts
│   ├── 📁 shared/                           # Shared Resources
│   │   ├── 📁 constants/
│   │   │   ├── 📄 app.constants.ts
│   │   │   └── 📄 database.constants.ts
│   │   ├── 📁 utils/
│   │   │   ├── 📄 hash.util.ts
│   │   │   ├── 📄 date.util.ts
│   │   │   └── 📄 validation.util.ts
│   │   └── 📁 types/
│   │       ├── 📄 supabase.types.ts
│   │       └── 📄 common.types.ts
│   ├── 📄 app.module.ts                     # Root Module
│   ├── 📄 main.ts                           # Application Entry Point
│   └── 📄 app.controller.ts                 # Root Controller
├── 📁 test/                                 # Test Files
│   ├── 📁 unit/
│   ├── 📁 integration/
│   ├── 📁 e2e/
│   └── 📁 __mocks__/
├── 📁 scripts/                              # Utility Scripts
│   ├── 📄 db-seed.ts
│   └── 📄 generate-types.ts
├── 📄 package.json
├── 📄 nest-cli.json                         # NestJS CLI configuration
├── 📄 tsconfig.json                         # TypeScript configuration
├── 📄 jest.config.js                        # Jest configuration
├── 📄 .eslintrc.js                          # ESLint configuration
├── 📄 .env.example                          # Environment template
└── 📄 Dockerfile                            # Docker configuration
```

## 🚀 Setup y Configuración

### 📦 **Instalación Inicial**

```bash
# Instalar NestJS CLI globalmente
npm install -g @nestjs/cli

# Crear proyecto NestJS
nest new lisadocs-backend --package-manager pnpm
cd lisadocs-backend

# Instalar dependencias principales
pnpm add @supabase/supabase-js
pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt
pnpm add class-validator class-transformer
pnpm add @nestjs/swagger swagger-ui-express
pnpm add winston nest-winston

# Instalar dependencias de desarrollo
pnpm add -D @types/passport-jwt
pnpm add -D @types/bcrypt
pnpm add -D supertest @types/supertest
```

### ⚙️ **Configuración de NestJS**

```typescript
// nest-cli.json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "tsconfig.build.json",
    "assets": [
      {
        "include": "**/*.sql",
        "outDir": "dist"
      }
    ]
  },
  "projects": {
    "lisadocs-backend": {
      "type": "application",
      "root": "",
      "entryFile": "main",
      "sourceRoot": "src",
      "compilerOptions": {
        "tsConfigPath": "tsconfig.app.json"
      }
    }
  }
}
```

### 🌍 **Variables de Entorno**

```bash
# .env.example
# Application
NODE_ENV=development
PORT=3001
APP_NAME=LisaDocs Backend
API_VERSION=1.0.0

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_supabase_database_url

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,png

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs
```

## 🏗️ Modules y Dependency Injection

### 📦 **App Module Principal**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

// Infrastructure Modules
import { SupabaseModule } from './infrastructure/database/supabase/supabase.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { EmailModule } from './infrastructure/email/email.module';

// Presentation Modules
import { AuthController } from './presentation/controllers/auth.controller';
import { DocumentsController } from './presentation/controllers/documents.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { WorkflowsController } from './presentation/controllers/workflows.controller';
import { HealthController } from './presentation/controllers/health.controller';

// Guards, Filters, Interceptors
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { AuditInterceptor } from './presentation/interceptors/audit.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Logging
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.json(),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.json(),
        }),
      ],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60,
      limit: parseInt(process.env.RATE_LIMIT_LIMIT) || 100,
    }),

    // Infrastructure Modules
    SupabaseModule,
    AuthModule,
    StorageModule,
    EmailModule,
  ],

  controllers: [
    AuthController,
    DocumentsController,
    UsersController,
    WorkflowsController,
    HealthController,
  ],

  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
```

### 🚀 **Main Application**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as morgan from 'morgan';
import * as compression from 'compression';
import * as helmet from 'helmet';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: configService.get('CORS_CREDENTIALS') === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // HTTP Request Logging
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.log(message.trim());
        },
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('LisaDocs API')
    .setDescription('Sistema de Gestión Documental - API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Documents', 'Document management')
    .addTag('Users', 'User management')
    .addTag('Workflows', 'Workflow management')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start Server
  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
```

## 🏛️ Domain Layer

### 🎯 **User Entity**

```typescript
// src/domain/entities/user.entity.ts
import { UserRole } from '../enums/user-role.enum';
import { Workspace } from '../enums/workspace.enum';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly fullName: string,
    public readonly role: UserRole,
    public readonly workspace: Workspace,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    private _password?: Password,
  ) {}

  // Domain Methods
  public canAccessWorkspace(workspace: Workspace): boolean {
    // Admin y Presidente pueden acceder a cualquier workspace
    if (this.role === UserRole.ADMINISTRADOR || this.role === UserRole.PRESIDENTE) {
      return true;
    }
    
    // Otros usuarios solo pueden acceder a su workspace
    return this.workspace === workspace;
  }

  public hasPermission(permission: string): boolean {
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.ADMINISTRADOR]: ['*'], // Todos los permisos
      [UserRole.PRESIDENTE]: ['read', 'write', 'approve', 'delete'],
      [UserRole.VICEPRESIDENTE]: ['read', 'write', 'approve'],
      [UserRole.SECRETARIO_CAM]: ['read', 'write'],
      [UserRole.SECRETARIO_AMPP]: ['read', 'write'],
      [UserRole.SECRETARIO_CF]: ['read', 'write'],
      [UserRole.INTENDENTE]: ['read', 'write'],
      [UserRole.CF_MEMBER]: ['read'],
    };

    const permissions = rolePermissions[this.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }

  public isInSameHierarchy(otherUser: User): boolean {
    // Lógica para verificar si los usuarios están en la misma jerarquía
    const hierarchies = {
      [Workspace.CAM]: [UserRole.SECRETARIO_CAM, UserRole.VICEPRESIDENCIA_CAM],
      [Workspace.AMPP]: [UserRole.SECRETARIO_AMPP],
      [Workspace.PRESIDENCIA]: [UserRole.SECRETARIO_CF, UserRole.CF_MEMBER],
      [Workspace.INTENDENCIA]: [UserRole.INTENDENTE],
      [Workspace.COMISIONES_CF]: [UserRole.CF_MEMBER, UserRole.SECRETARIO_CF],
    };

    return hierarchies[this.workspace]?.includes(otherUser.role) || false;
  }

  public deactivate(): void {
    // Lógica de negocio para desactivar usuario
    if (!this.isActive) {
      throw new Error('User is already inactive');
    }
    
    // Aquí iría la lógica adicional como:
    // - Cancelar documentos asignados
    // - Transferir responsabilidades
    // - Notificar a supervisores
  }

  public changePassword(newPassword: Password): void {
    this._password = newPassword;
  }

  public updateProfile(fullName: string): User {
    return new User(
      this.id,
      this.email,
      fullName,
      this.role,
      this.workspace,
      this.isActive,
      this.createdAt,
      new Date(),
      this._password,
    );
  }

  // Getters
  public get passwordHash(): string | undefined {
    return this._password?.hash;
  }
}
```

### 📄 **Document Entity**

```typescript
// src/domain/entities/document.entity.ts
import { DocumentStatus } from '../enums/document-status.enum';
import { Workspace } from '../enums/workspace.enum';
import { DocumentVersion } from '../value-objects/document-version.vo';

export class Document {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string | null,
    public readonly status: DocumentStatus,
    public readonly workspace: Workspace,
    public readonly version: DocumentVersion,
    public readonly fileUrl: string | null,
    public readonly fileName: string | null,
    public readonly fileSize: number | null,
    public readonly mimeType: string | null,
    public readonly tags: string[],
    public readonly createdBy: string,
    public readonly assignedTo: string | null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  // Domain Methods
  public canBeEditedBy(userId: string, userRole: string): boolean {
    // El creador siempre puede editar (si no está en workflow)
    if (this.createdBy === userId && this.isEditable()) {
      return true;
    }

    // Admin y Presidente pueden editar cualquier documento
    if (userRole === 'administrador' || userRole === 'presidente') {
      return true;
    }

    // Asignado puede editar si está en estado editable
    if (this.assignedTo === userId && this.isEditable()) {
      return true;
    }

    return false;
  }

  public isEditable(): boolean {
    const editableStatuses = [
      DocumentStatus.DRAFT,
      DocumentStatus.REJECTED,
    ];
    
    return editableStatuses.includes(this.status);
  }

  public canBeApprovedBy(userId: string, userRole: string): boolean {
    const approvableStatuses = [
      DocumentStatus.PENDING_APPROVAL,
      DocumentStatus.UNDER_REVIEW,
    ];

    if (!approvableStatuses.includes(this.status)) {
      return false;
    }

    // Solo ciertos roles pueden aprobar
    const approverRoles = ['administrador', 'presidente', 'vicepresidente'];
    return approverRoles.includes(userRole);
  }

  public submitForReview(reviewerId: string): Document {
    if (this.status !== DocumentStatus.DRAFT) {
      throw new Error('Only draft documents can be submitted for review');
    }

    return this.updateStatus(DocumentStatus.PENDING_REVIEW, reviewerId);
  }

  public approve(approverId: string): Document {
    if (!this.canBeApprovedBy(approverId, 'presidente')) {
      throw new Error('Document cannot be approved by this user');
    }

    return this.updateStatus(DocumentStatus.APPROVED, approverId);
  }

  public reject(rejectorId: string, reason?: string): Document {
    const rejectableStatuses = [
      DocumentStatus.PENDING_REVIEW,
      DocumentStatus.UNDER_REVIEW,
      DocumentStatus.PENDING_APPROVAL,
    ];

    if (!rejectableStatuses.includes(this.status)) {
      throw new Error('Document cannot be rejected in current status');
    }

    return this.updateStatus(DocumentStatus.REJECTED, rejectorId);
  }

  public publish(): Document {
    if (this.status !== DocumentStatus.APPROVED) {
      throw new Error('Only approved documents can be published');
    }

    return this.updateStatus(DocumentStatus.PUBLISHED, this.assignedTo || this.createdBy);
  }

  public archive(): Document {
    const archivableStatuses = [
      DocumentStatus.PUBLISHED,
      DocumentStatus.APPROVED,
      DocumentStatus.OBSOLETE,
    ];

    if (!archivableStatuses.includes(this.status)) {
      throw new Error('Document cannot be archived in current status');
    }

    return this.updateStatus(DocumentStatus.ARCHIVED, this.assignedTo || this.createdBy);
  }

  public createNewVersion(
    newTitle: string,
    newContent: string,
    versionType: 'major' | 'minor' | 'patch' = 'patch',
  ): Document {
    const newVersion = this.version.increment(versionType);
    
    return new Document(
      this.id,
      newTitle,
      newContent,
      DocumentStatus.DRAFT,
      this.workspace,
      newVersion,
      this.fileUrl,
      this.fileName,
      this.fileSize,
      this.mimeType,
      this.tags,
      this.createdBy,
      this.assignedTo,
      this.createdAt,
      new Date(),
    );
  }

  public addTags(newTags: string[]): Document {
    const uniqueTags = Array.from(new Set([...this.tags, ...newTags]));
    
    return new Document(
      this.id,
      this.title,
      this.content,
      this.status,
      this.workspace,
      this.version,
      this.fileUrl,
      this.fileName,
      this.fileSize,
      this.mimeType,
      uniqueTags,
      this.createdBy,
      this.assignedTo,
      this.createdAt,
      new Date(),
    );
  }

  private updateStatus(newStatus: DocumentStatus, updatedBy: string): Document {
    return new Document(
      this.id,
      this.title,
      this.content,
      newStatus,
      this.workspace,
      this.version,
      this.fileUrl,
      this.fileName,
      this.fileSize,
      this.mimeType,
      this.tags,
      this.createdBy,
      updatedBy,
      this.createdAt,
      new Date(),
    );
  }

  // Computed Properties
  public get isPublic(): boolean {
    return this.status === DocumentStatus.PUBLISHED;
  }

  public get isInWorkflow(): boolean {
    const workflowStatuses = [
      DocumentStatus.PENDING_REVIEW,
      DocumentStatus.UNDER_REVIEW,
      DocumentStatus.PENDING_APPROVAL,
    ];
    
    return workflowStatuses.includes(this.status);
  }

  public get nextPossibleStatuses(): DocumentStatus[] {
    const transitions: Record<DocumentStatus, DocumentStatus[]> = {
      [DocumentStatus.DRAFT]: [DocumentStatus.PENDING_REVIEW],
      [DocumentStatus.PENDING_REVIEW]: [DocumentStatus.UNDER_REVIEW, DocumentStatus.REJECTED],
      [DocumentStatus.UNDER_REVIEW]: [DocumentStatus.PENDING_APPROVAL, DocumentStatus.REJECTED],
      [DocumentStatus.PENDING_APPROVAL]: [DocumentStatus.APPROVED, DocumentStatus.REJECTED],
      [DocumentStatus.APPROVED]: [DocumentStatus.PUBLISHED, DocumentStatus.ARCHIVED],
      [DocumentStatus.REJECTED]: [DocumentStatus.DRAFT],
      [DocumentStatus.PUBLISHED]: [DocumentStatus.ARCHIVED, DocumentStatus.OBSOLETE],
      [DocumentStatus.ARCHIVED]: [DocumentStatus.OBSOLETE],
      [DocumentStatus.OBSOLETE]: [],
    };

    return transitions[this.status] || [];
  }
}
```

### 🏷️ **Domain Enums**

```typescript
// src/domain/enums/user-role.enum.ts
export enum UserRole {
  // Roles Principales (Máximo Acceso)
  ADMINISTRADOR = 'administrador',
  PRESIDENTE = 'presidente',
  VICEPRESIDENTE = 'vicepresidente',

  // Roles de Zona (Acceso Medio)
  INTENDENTE = 'intendente',
  SECRETARIO_AMPP = 'secretario_ampp',
  SECRETARIO_CF = 'secretario_cf',

  // Roles Subordinados (Acceso Específico)
  VICEPRESIDENCIA_CAM = 'vicepresidencia_cam',
  SECRETARIO_CAM = 'secretario_cam',
  CF_MEMBER = 'cf_member',
  SECRETARIO_ESPECIALIZADA = 'secretario_especializada',
}

// src/domain/enums/workspace.enum.ts
export enum Workspace {
  CAM = 'cam',                    // Consejo de Administración Municipal
  AMPP = 'ampp',                  // Asamblea Municipal del Poder Popular
  PRESIDENCIA = 'presidencia',    // Presidencia
  INTENDENCIA = 'intendencia',    // Espacio de Intendencia
  COMISIONES_CF = 'comisiones_cf', // Comisiones de Trabajo
}

// src/domain/enums/document-status.enum.ts
export enum DocumentStatus {
  DRAFT = 'draft',                      // 📝 Documento en creación
  PENDING_REVIEW = 'pending_review',    // ⏳ Esperando revisión
  UNDER_REVIEW = 'under_review',        // 👀 En proceso de revisión
  PENDING_APPROVAL = 'pending_approval', // ⏰ Esperando aprobación
  APPROVED = 'approved',                // ✅ Documento aprobado
  REJECTED = 'rejected',                // ❌ Documento rechazado
  PUBLISHED = 'published',              // 📢 Disponible públicamente
  ARCHIVED = 'archived',                // 📦 Archivado
  OBSOLETE = 'obsolete',               // 🗑️ Documento obsoleto
}
```

### 💎 **Value Objects**

```typescript
// src/domain/value-objects/email.vo.ts
export class Email {
  private readonly _value: string;

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format');
    }
    this._value = email.toLowerCase();
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

// src/domain/value-objects/password.vo.ts
import * as bcrypt from 'bcrypt';

export class Password {
  private readonly _hash: string;

  constructor(password: string, isHashed: boolean = false) {
    if (isHashed) {
      this._hash = password;
    } else {
      this.validatePassword(password);
      this._hash = this.hashPassword(password);
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  }

  private hashPassword(password: string): string {
    const saltRounds = 12;
    return bcrypt.hashSync(password, saltRounds);
  }

  public verify(plainPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, this._hash);
  }

  public get hash(): string {
    return this._hash;
  }
}

// src/domain/value-objects/document-version.vo.ts
export class DocumentVersion {
  constructor(
    private readonly major: number,
    private readonly minor: number,
    private readonly patch: number,
  ) {
    if (major < 0 || minor < 0 || patch < 0) {
      throw new Error('Version numbers must be non-negative');
    }
  }

  public static fromString(version: string): DocumentVersion {
    const parts = version.split('.').map(Number);
    
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error('Invalid version format. Expected format: major.minor.patch');
    }

    return new DocumentVersion(parts[0], parts[1], parts[2]);
  }

  public increment(type: 'major' | 'minor' | 'patch'): DocumentVersion {
    switch (type) {
      case 'major':
        return new DocumentVersion(this.major + 1, 0, 0);
      case 'minor':
        return new DocumentVersion(this.major, this.minor + 1, 0);
      case 'patch':
        return new DocumentVersion(this.major, this.minor, this.patch + 1);
      default:
        throw new Error('Invalid version increment type');
    }
  }

  public compare(other: DocumentVersion): number {
    if (this.major !== other.major) {
      return this.major - other.major;
    }
    if (this.minor !== other.minor) {
      return this.minor - other.minor;
    }
    return this.patch - other.patch;
  }

  public isGreaterThan(other: DocumentVersion): boolean {
    return this.compare(other) > 0;
  }

  public equals(other: DocumentVersion): boolean {
    return this.compare(other) === 0;
  }

  public toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}
```

## 🎯 Application Layer

### 📋 **Use Cases**

```typescript
// src/application/use-cases/documents/create-document.use-case.ts
import { Injectable } from '@nestjs/common';
import { Document } from '../../../domain/entities/document.entity';
import { DocumentRepository } from '../../../domain/repositories/document.repository';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { DocumentStatus } from '../../../domain/enums/document-status.enum';
import { DocumentVersion } from '../../../domain/value-objects/document-version.vo';
import { CreateDocumentDto } from '../../dtos/documents/create-document.dto';

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    createDocumentDto: CreateDocumentDto,
    createdBy: string,
  ): Promise<Document> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(createdBy);
    if (!user) {
      throw new Error('User not found');
    }

    // Verificar permisos
    if (!user.hasPermission('write')) {
      throw new Error('User does not have permission to create documents');
    }

    // Verificar acceso al workspace
    if (!user.canAccessWorkspace(createDocumentDto.workspace)) {
      throw new Error('User cannot access this workspace');
    }

    // Crear nueva versión
    const version = new DocumentVersion(1, 0, 0);

    // Crear documento
    const document = new Document(
      generateUUID(), // Utility function
      createDocumentDto.title,
      createDocumentDto.content || null,
      DocumentStatus.DRAFT,
      createDocumentDto.workspace,
      version,
      createDocumentDto.fileUrl || null,
      createDocumentDto.fileName || null,
      createDocumentDto.fileSize || null,
      createDocumentDto.mimeType || null,
      createDocumentDto.tags || [],
      createdBy,
      null, // assignedTo
    );

    // Guardar en repositorio
    const savedDocument = await this.documentRepository.save(document);

    // Publicar evento de dominio
    // await this.eventBus.publish(new DocumentCreatedEvent(savedDocument));

    return savedDocument;
  }
}

// src/application/use-cases/workflows/approve-document.use-case.ts
import { Injectable } from '@nestjs/common';
import { Document } from '../../../domain/entities/document.entity';
import { DocumentRepository } from '../../../domain/repositories/document.repository';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { AuditLogRepository } from '../../../domain/repositories/audit-log.repository';
import { DocumentApprovedEvent } from '../../events/document-approved.event';

@Injectable()
export class ApproveDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly userRepository: UserRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async execute(
    documentId: string,
    approverId: string,
    comments?: string,
  ): Promise<Document> {
    // Buscar documento
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Buscar usuario que aprueba
    const approver = await this.userRepository.findById(approverId);
    if (!approver) {
      throw new Error('Approver not found');
    }

    // Verificar permisos de aprobación
    if (!document.canBeApprovedBy(approverId, approver.role)) {
      throw new Error('User does not have permission to approve this document');
    }

    // Aprobar documento
    const approvedDocument = document.approve(approverId);

    // Guardar cambios
    const savedDocument = await this.documentRepository.save(approvedDocument);

    // Crear log de auditoría
    await this.auditLogRepository.save({
      userId: approverId,
      action: 'APPROVE_DOCUMENT',
      resourceType: 'document',
      resourceId: documentId,
      details: {
        previousStatus: document.status,
        newStatus: approvedDocument.status,
        comments,
      },
      timestamp: new Date(),
    });

    // Publicar evento
    // await this.eventBus.publish(new DocumentApprovedEvent(savedDocument, approver, comments));

    return savedDocument;
  }
}

// src/application/use-cases/auth/login.use-case.ts
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { Email } from '../../../domain/value-objects/email.vo';
import { Password } from '../../../domain/value-objects/password.vo';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../../dtos/auth/login.dto';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    workspace: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(loginDto: LoginDto): Promise<LoginResult> {
    // Crear value objects
    const email = new Email(loginDto.email);
    const password = new Password(loginDto.password);

    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verificar que el usuario está activo
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Verificar contraseña
    const storedPassword = new Password(user.passwordHash!, true);
    if (!storedPassword.verify(loginDto.password)) {
      throw new Error('Invalid credentials');
    }

    // Generar tokens JWT
    const payload = {
      sub: user.id,
      email: user.email.value,
      role: user.role,
      workspace: user.workspace,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Crear log de auditoría para login
    await this.auditLogRepository.save({
      userId: user.id,
      action: 'LOGIN',
      resourceType: 'auth',
      resourceId: user.id,
      details: {
        loginTime: new Date(),
        userAgent: 'TODO: Extract from request',
        ipAddress: 'TODO: Extract from request',
      },
      timestamp: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.value,
        fullName: user.fullName,
        role: user.role,
        workspace: user.workspace,
      },
    };
  }
}
```

### 📄 **DTOs de Aplicación**

```typescript
// src/application/dtos/documents/create-document.dto.ts
import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Workspace } from '../../../domain/enums/workspace.enum';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Document title',
    example: 'Acta de Reunión CAM - Enero 2024',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Document content',
    example: 'Contenido del documento...',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Workspace where the document belongs',
    enum: Workspace,
    example: Workspace.CAM,
  })
  @IsEnum(Workspace)
  workspace: Workspace;

  @ApiPropertyOptional({
    description: 'File URL in storage',
    example: 'https://storage.supabase.co/documents/file.pdf',
  })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Original file name',
    example: 'documento.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'File MIME type',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Document tags',
    example: ['acta', 'reunion', 'cam'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// src/application/dtos/auth/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@lisadocs.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}

// src/application/dtos/users/create-user.dto.ts
import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { Workspace } from '../../../domain/enums/workspace.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'usuario@lisadocs.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Juan Pérez González',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.SECRETARIO_CAM,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'User workspace',
    enum: Workspace,
    example: Workspace.CAM,
  })
  @IsEnum(Workspace)
  workspace: Workspace;

  @ApiProperty({
    description: 'Initial password',
    example: 'TempPassword123!',
  })
  @IsString()
  password: string;
}
```

## 🏗️ Infrastructure Layer

### 🗄️ **Supabase Configuration**

```typescript
// src/infrastructure/database/supabase/supabase.client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Supabase client initialized');
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Helper methods for common operations
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('users').select('id').limit(1);
      return !error;
    } catch (error) {
      this.logger.error('Supabase health check failed:', error);
      return false;
    }
  }

  // Transaction support
  async withTransaction<T>(callback: (client: SupabaseClient) => Promise<T>): Promise<T> {
    // Supabase doesn't have explicit transactions, but we can use RLS and proper error handling
    try {
      return await callback(this.supabase);
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      throw error;
    }
  }
}

// src/infrastructure/database/supabase/supabase.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.client';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
```

### 🗃️ **Repository Implementations**

```typescript
// src/infrastructure/database/repositories/user.repository.impl.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { SupabaseService } from '../supabase/supabase.client';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  private readonly logger = new Logger(UserRepositoryImpl.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows returned
        }
        throw error;
      }

      return this.mapToEntity(data);
    } catch (error) {
      this.logger.error(`Error finding user by id ${id}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('users')
        .select('*')
        .eq('email', email.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return this.mapToEntity(data);
    } catch (error) {
      this.logger.error(`Error finding user by email ${email.value}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findByWorkspace(workspace: string): Promise<User[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('users')
        .select('*')
        .eq('workspace', workspace)
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;

      return data.map(user => this.mapToEntity(user));
    } catch (error) {
      this.logger.error(`Error finding users by workspace ${workspace}:`, error);
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  async save(user: User): Promise<User> {
    try {
      const userData = this.mapToDatabase(user);

      const { data, error } = await this.supabaseService.client
        .from('users')
        .upsert(userData, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToEntity(data);
    } catch (error) {
      this.logger.error('Error saving user:', error);
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Soft delete - mark as inactive
      const { error } = await this.supabaseService.client
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.logger.error(`Error deleting user ${id}:`, error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async findAll(filters?: {
    role?: string;
    workspace?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      let query = this.supabaseService.client
        .from('users')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }

      if (filters?.workspace) {
        query = query.eq('workspace', filters.workspace);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      }

      // Order
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const users = data.map(user => this.mapToEntity(user));

      return {
        users,
        total: count || 0,
      };
    } catch (error) {
      this.logger.error('Error finding all users:', error);
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  private mapToEntity(data: any): User {
    return new User(
      data.id,
      new Email(data.email),
      data.full_name,
      data.role,
      data.workspace,
      data.is_active,
      new Date(data.created_at),
      new Date(data.updated_at),
    );
  }

  private mapToDatabase(user: User): any {
    return {
      id: user.id,
      email: user.email.value,
      full_name: user.fullName,
      role: user.role,
      workspace: user.workspace,
      is_active: user.isActive,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
      password_hash: user.passwordHash,
    };
  }
}

// src/infrastructure/database/repositories/document.repository.impl.ts
import { Injectable, Logger } from '@nestjs/common';
import { DocumentRepository } from '../../../domain/repositories/document.repository';
import { Document } from '../../../domain/entities/document.entity';
import { SupabaseService } from '../supabase/supabase.client';
import { DocumentVersion } from '../../../domain/value-objects/document-version.vo';

@Injectable()
export class DocumentRepositoryImpl implements DocumentRepository {
  private readonly logger = new Logger(DocumentRepositoryImpl.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findById(id: string): Promise<Document | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('documents')
        .select(`
          *,
          created_by_user:users!documents_created_by_fkey(id, full_name, email),
          assigned_to_user:users!documents_assigned_to_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return this.mapToEntity(data);
    } catch (error) {
      this.logger.error(`Error finding document by id ${id}:`, error);
      throw new Error(`Failed to find document: ${error.message}`);
    }
  }

  async findByWorkspace(
    workspace: string,
    filters?: {
      status?: string;
      createdBy?: string;
      assignedTo?: string;
      search?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      let query = this.supabaseService.client
        .from('documents')
        .select(`
          *,
          created_by_user:users!documents_created_by_fkey(id, full_name, email)
        `, { count: 'exact' })
        .eq('workspace', workspace);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 20) - 1
        );
      }

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const documents = data.map(doc => this.mapToEntity(doc));

      return {
        documents,
        total: count || 0,
      };
    } catch (error) {
      this.logger.error(`Error finding documents by workspace ${workspace}:`, error);
      throw new Error(`Failed to find documents: ${error.message}`);
    }
  }

  async save(document: Document): Promise<Document> {
    try {
      const documentData = this.mapToDatabase(document);

      const { data, error } = await this.supabaseService.client
        .from('documents')
        .upsert(documentData, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToEntity(data);
    } catch (error) {
      this.logger.error('Error saving document:', error);
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.logger.error(`Error deleting document ${id}:`, error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async findVersions(documentId: string): Promise<Document[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(version => this.mapVersionToEntity(version));
    } catch (error) {
      this.logger.error(`Error finding versions for document ${documentId}:`, error);
      throw new Error(`Failed to find document versions: ${error.message}`);
    }
  }

  private mapToEntity(data: any): Document {
    return new Document(
      data.id,
      data.title,
      data.content,
      data.status,
      data.workspace,
      DocumentVersion.fromString(data.version),
      data.file_url,
      data.file_name,
      data.file_size,
      data.mime_type,
      data.tags || [],
      data.created_by,
      data.assigned_to,
      new Date(data.created_at),
      new Date(data.updated_at),
    );
  }

  private mapToDatabase(document: Document): any {
    return {
      id: document.id,
      title: document.title,
      content: document.content,
      status: document.status,
      workspace: document.workspace,
      version: document.version.toString(),
      file_url: document.fileUrl,
      file_name: document.fileName,
      file_size: document.fileSize,
      mime_type: document.mimeType,
      tags: document.tags,
      created_by: document.createdBy,
      assigned_to: document.assignedTo,
      created_at: document.createdAt.toISOString(),
      updated_at: document.updatedAt.toISOString(),
    };
  }

  private mapVersionToEntity(data: any): Document {
    // Similar mapping for document versions
    return this.mapToEntity(data);
  }
}
```

## 🎭 Presentation Layer

### 🎮 **Controllers**

```typescript
// src/presentation/controllers/documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';

import { CreateDocumentUseCase } from '../../application/use-cases/documents/create-document.use-case';
import { UpdateDocumentUseCase } from '../../application/use-cases/documents/update-document.use-case';
import { GetDocumentsUseCase } from '../../application/use-cases/documents/get-documents.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/documents/delete-document.use-case';

import { CreateDocumentDto } from '../../application/dtos/documents/create-document.dto';
import { UpdateDocumentDto } from '../../application/dtos/documents/update-document.dto';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Permissions } from '../decorators/permissions.decorator';

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    private readonly getDocumentsUseCase: GetDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @Permissions('write')
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    const document = await this.createDocumentUseCase.execute(
      createDocumentDto,
      userId,
    );

    return {
      status: 'success',
      message: 'Document created successfully',
      data: document,
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload document file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('write')
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    // TODO: Implement file upload use case
    return {
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        url: 'TODO: Generate URL',
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get documents with filters' })
  @ApiQuery({ name: 'workspace', required: false, description: 'Filter by workspace' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title and content' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents retrieved successfully',
  })
  @Permissions('read')
  async getDocuments(
    @Query('workspace') workspace?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: any,
  ) {
    const filters = {
      workspace,
      status,
      search,
      tags: tags ? tags.split(',') : undefined,
      limit: limit || 20,
      offset: offset || 0,
    };

    const result = await this.getDocumentsUseCase.execute(filters, user);

    return {
      status: 'success',
      message: 'Documents retrieved successfully',
      data: result.documents,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @Permissions('read')
  async getDocument(@Param('id') id: string) {
    // TODO: Implement get single document use case
    return {
      status: 'success',
      message: 'Document retrieved successfully',
      data: { id }, // TODO: Return actual document
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @Permissions('write')
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    const document = await this.updateDocumentUseCase.execute(
      id,
      updateDocumentDto,
      userId,
    );

    return {
      status: 'success',
      message: 'Document updated successfully',
      data: document,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions to delete',
  })
  @Roles('administrador', 'presidente')
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.deleteDocumentUseCase.execute(id, userId);

    return {
      status: 'success',
      message: 'Document deleted successfully',
    };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit document for review' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document submitted for review',
  })
  @Permissions('write')
  async submitDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    // TODO: Implement submit document use case
    return {
      status: 'success',
      message: 'Document submitted for review',
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document approved successfully',
  })
  @Roles('administrador', 'presidente', 'vicepresidente')
  async approveDocument(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @CurrentUser('id') userId: string,
  ) {
    // TODO: Implement approve document use case
    return {
      status: 'success',
      message: 'Document approved successfully',
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document rejected successfully',
  })
  @Roles('administrador', 'presidente', 'vicepresidente')
  async rejectDocument(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    // TODO: Implement reject document use case
    return {
      status: 'success',
      message: 'Document rejected successfully',
    };
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get document version history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document versions retrieved successfully',
  })
  @Permissions('read')
  async getDocumentVersions(@Param('id') id: string) {
    // TODO: Implement get document versions use case
    return {
      status: 'success',
      message: 'Document versions retrieved successfully',
      data: [], // TODO: Return actual versions
    };
  }
}
```

### 🛡️ **Guards y Decorators**

```typescript
// src/presentation/guards/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user to request
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// src/presentation/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check roles
    if (requiredRoles) {
      const hasRole = requiredRoles.some(role => user.role === role);
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    // Check permissions (simplified version)
    if (requiredPermissions) {
      const userPermissions = this.getUserPermissions(user.role);
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission) || userPermissions.includes('*')
      );
      
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }

  private getUserPermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      administrador: ['*'],
      presidente: ['read', 'write', 'approve', 'delete'],
      vicepresidente: ['read', 'write', 'approve'],
      secretario_cam: ['read', 'write'],
      secretario_ampp: ['read', 'write'],
      secretario_cf: ['read', 'write'],
      intendente: ['read', 'write'],
      cf_member: ['read'],
    };

    return rolePermissions[role] || [];
  }
}

// src/presentation/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return data ? user?.[data] : user;
  },
);

// src/presentation/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// src/presentation/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

// src/presentation/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
```

¡¡**ESTO ES SOLO EL COMIENZO DE ESTA DOCUMENTACIÓN ÉPICA**!! 🚀🔥

Tenemos mucho más contenido increíble por venir:

- 🧪 **Testing completo** (Unit, Integration, E2E)
- 🔒 **Security avanzada**
- ⚡ **Performance optimization**
- 🚀 **Deployment strategies**
- 📊 **Monitoring y observability**
- 🎯 **Error handling**
- ✅ **Validation pipeline**

¿Quieres que continue con alguna sección específica o que complete toda la documentación de una vez? ¡Dime qué prefieres y seguimos **DOMINANDO** este backend! 💪⚡
