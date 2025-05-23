# 🎨 Frontend Documentation - LisaDocs

![Next.js](https://img.shields.io/badge/Next.js-15.3-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan.svg)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)

> **Documentación completa del frontend de LisaDocs construido con Next.js 15.3, App Router, Supabase, y las tecnologías más modernas del ecosistema React** 🚀✨

## 📋 Tabla de Contenidos

1. [Arquitectura del Frontend](#-arquitectura-del-frontend)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Setup y Configuración](#-setup-y-configuración)
5. [App Router y Routing](#-app-router-y-routing)
6. [Autenticación con Supabase](#-autenticación-con-supabase)
7. [Estado Global con Zustand](#-estado-global-con-zustand)
8. [UI Components con shadcn/ui](#-ui-components-con-shadcnui)
9. [Styling con Tailwind CSS](#-styling-con-tailwind-css)
10. [Data Fetching con React Query](#-data-fetching-con-react-query)
11. [Real-time con Supabase](#-real-time-con-supabase)
12. [Performance y Optimización](#-performance-y-optimización)
13. [Testing](#-testing)
14. [Deployment](#-deployment)
15. [Best Practices](#-best-practices)

## 🏗️ Arquitectura del Frontend

### 🎯 **Principios de Diseño**

```typescript
// Arquitectura basada en:
📁 Feature-based organization → Módulos por funcionalidad
🔄 Composable components → Reutilización máxima
🛡️ Type-safe everything → TypeScript end-to-end
⚡ Performance-first → Optimización automática
🎨 Design system → Consistencia visual
```

### 🔧 **Patron de Arquitectura**

```Arquitectura de Capas
┌─────────────────────────────────────────┐
│                UI LAYER                 │ ← Componentes y páginas
├─────────────────────────────────────────┤
│             BUSINESS LOGIC              │ ← Hooks y estado global
├─────────────────────────────────────────┤
│            DATA ACCESS LAYER            │ ← Supabase client y APIs
├─────────────────────────────────────────┤
│            EXTERNAL SERVICES            │ ← Supabase, Storage, etc.
└─────────────────────────────────────────┘
```

## ⚡ Stack Tecnológico

### 🚀 **Core Framework**

- **[Next.js 15.3](https://nextjs.org/blog/next-15-3)** - React framework con App Router
- **[Turbopack](https://nextjs.org/blog/next-15-3#turbopack-builds-alpha)** - Bundler ultra-rápido (alpha)
- **TypeScript 5.0+** - Type safety y developer experience
- **React 18** - Concurrent features y Suspense

### 🎨 **UI & Styling**

- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes hermosos y accesibles
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Iconos modernos y consistentes
- **[Radix UI](https://www.radix-ui.com/)** - Primitives accesibles (base de shadcn/ui)

### 🔄 **Estado y Data Fetching**

- **[Zustand](https://zustand-demo.pmnd.rs/)** - Estado global ligero y simple
- **[React Query (TanStack Query)](https://tanstack.com/query/latest)** - Data fetching y caching
- **[React Hook Form](https://react-hook-form.com/)** - Formularios performantes
- **[Zod](https://zod.dev/)** - Validación de schemas TypeScript-first

### 🗄️ **Backend Integration**

- **[Supabase Client](https://supabase.com/docs/reference/javascript)** - Backend-as-a-Service
- **[Supabase Auth](https://supabase.com/docs/guides/auth)** - Autenticación integrada
- **[Supabase Realtime](https://supabase.com/docs/guides/realtime)** - Subscripciones en tiempo real
- **[Supabase Storage](https://supabase.com/docs/guides/storage)** - File storage

### 🧪 **Testing & Quality**

- **[Vitest](https://vitest.dev/)** - Testing framework ultra-rápido
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Testing de componentes
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** - Linting y formatting

## 📁 Estructura del Proyecto

```Estructura de Proyecto
frontend/
├── 📁 src/
│   ├── 📁 app/                          # Next.js 15.3 App Router
│   │   ├── 📁 (auth)/                   # Auth group routes
│   │   │   ├── 📁 login/
│   │   │   │   ├── 📄 page.tsx          # Login page
│   │   │   │   └── 📄 loading.tsx       # Loading UI
│   │   │   ├── 📁 register/
│   │   │   │   └── 📄 page.tsx          # Register page
│   │   │   └── 📄 layout.tsx            # Auth layout
│   │   ├── 📁 dashboard/                # Protected dashboard
│   │   │   ├── 📁 documents/
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   ├── 📄 page.tsx      # Document detail
│   │   │   │   │   ├── 📄 edit/page.tsx # Document edit
│   │   │   │   │   └── 📄 versions/page.tsx # Version history
│   │   │   │   ├── 📄 page.tsx          # Documents list
│   │   │   │   ├── 📄 loading.tsx       # Loading skeleton
│   │   │   │   └── 📄 error.tsx         # Error boundary
│   │   │   ├── 📁 workflows/
│   │   │   │   ├── 📁 [id]/
│   │   │   │   └── 📄 page.tsx          # Workflows management
│   │   │   ├── 📁 admin/                # Admin panel
│   │   │   │   ├── 📁 users/
│   │   │   │   ├── 📁 roles/
│   │   │   │   └── 📁 audit/
│   │   │   ├── 📄 page.tsx              # Dashboard home
│   │   │   └── 📄 layout.tsx            # Dashboard layout
│   │   ├── 📁 api/                      # API routes (if needed)
│   │   │   └── 📁 auth/
│   │   │       └── 📁 callback/
│   │   │           └── 📄 route.ts      # OAuth callback
│   │   ├── 📄 globals.css               # Global styles
│   │   ├── 📄 layout.tsx                # Root layout
│   │   ├── 📄 page.tsx                  # Home page
│   │   ├── 📄 loading.tsx               # Global loading
│   │   ├── 📄 error.tsx                 # Global error
│   │   └── 📄 not-found.tsx            # 404 page
│   ├── 📁 components/                   # Reusable components
│   │   ├── 📁 ui/                       # shadcn/ui components
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 input.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 table.tsx
│   │   │   ├── 📄 dialog.tsx
│   │   │   ├── 📄 toast.tsx
│   │   │   └── 📄 ...                   # Más componentes UI
│   │   ├── 📁 layout/                   # Layout components
│   │   │   ├── 📄 Header.tsx
│   │   │   ├── 📄 Sidebar.tsx
│   │   │   ├── 📄 Breadcrumb.tsx
│   │   │   ├── 📄 UserMenu.tsx
│   │   │   └── 📄 ThemeToggle.tsx
│   │   ├── 📁 auth/                     # Auth components
│   │   │   ├── 📄 AuthProvider.tsx
│   │   │   ├── 📄 LoginForm.tsx
│   │   │   ├── 📄 RegisterForm.tsx
│   │   │   ├── 📄 ProtectedRoute.tsx
│   │   │   └── 📄 AuthButton.tsx
│   │   ├── 📁 documents/                # Document components
│   │   │   ├── 📄 DocumentList.tsx
│   │   │   ├── 📄 DocumentCard.tsx
│   │   │   ├── 📄 DocumentForm.tsx
│   │   │   ├── 📄 DocumentViewer.tsx
│   │   │   ├── 📄 DocumentUpload.tsx
│   │   │   ├── 📄 VersionHistory.tsx
│   │   │   ├── 📄 VersionComparison.tsx
│   │   │   └── 📄 DocumentActions.tsx
│   │   ├── 📁 workflows/                # Workflow components
│   │   │   ├── 📄 WorkflowList.tsx
│   │   │   ├── 📄 WorkflowCard.tsx
│   │   │   ├── 📄 WorkflowSteps.tsx
│   │   │   ├── 📄 TaskQueue.tsx
│   │   │   ├── 📄 ApprovalActions.tsx
│   │   │   └── 📄 StatusBadge.tsx
│   │   ├── 📁 admin/                    # Admin components
│   │   │   ├── 📄 UserManagement.tsx
│   │   │   ├── 📄 RoleEditor.tsx
│   │   │   ├── 📄 PermissionMatrix.tsx
│   │   │   ├── 📄 AuditTable.tsx
│   │   │   └── 📄 SystemMetrics.tsx
│   │   └── 📁 common/                   # Common components
│   │       ├── 📄 LoadingSpinner.tsx
│   │       ├── 📄 ErrorBoundary.tsx
│   │       ├── 📄 Pagination.tsx
│   │       ├── 📄 SearchBar.tsx
│   │       ├── 📄 FilterPanel.tsx
│   │       └── 📄 DataTable.tsx
│   ├── 📁 lib/                          # Utilities y configuración
│   │   ├── 📁 supabase/                 # Supabase configuration
│   │   │   ├── 📄 client.ts             # Client-side Supabase
│   │   │   ├── 📄 server.ts             # Server-side Supabase
│   │   │   ├── 📄 auth.ts               # Auth utilities
│   │   │   ├── 📄 storage.ts            # Storage utilities
│   │   │   └── 📄 realtime.ts           # Realtime utilities
│   │   ├── 📁 validations/              # Zod schemas
│   │   │   ├── 📄 auth.ts               # Auth schemas
│   │   │   ├── 📄 documents.ts          # Document schemas
│   │   │   ├── 📄 users.ts              # User schemas
│   │   │   └── 📄 workflows.ts          # Workflow schemas
│   │   ├── 📄 utils.ts                  # General utilities
│   │   ├── 📄 constants.ts              # App constants
│   │   ├── 📄 cn.ts                     # Tailwind class merger
│   │   └── 📄 api.ts                    # API utilities
│   ├── 📁 hooks/                        # Custom React hooks
│   │   ├── 📄 useAuth.ts                # Authentication hook
│   │   ├── 📄 useSupabase.ts            # Supabase hooks
│   │   ├── 📄 useRealtime.ts            # Real-time hooks
│   │   ├── 📄 useDocuments.ts           # Document operations
│   │   ├── 📄 useWorkflows.ts           # Workflow operations
│   │   ├── 📄 usePermissions.ts         # Permission checks
│   │   ├── 📄 useLocalStorage.ts        # Local storage hook
│   │   └── 📄 useDebounce.ts            # Debounce hook
│   ├── 📁 store/                        # Zustand stores
│   │   ├── 📄 authStore.ts              # Authentication state
│   │   ├── 📄 documentStore.ts          # Documents state
│   │   ├── 📄 workflowStore.ts          # Workflows state
│   │   ├── 📄 uiStore.ts                # UI state (theme, sidebar)
│   │   └── 📄 notificationStore.ts      # Notifications state
│   ├── 📁 types/                        # TypeScript types
│   │   ├── 📄 database.ts               # Generated Supabase types
│   │   ├── 📄 auth.ts                   # Auth types
│   │   ├── 📄 documents.ts              # Document types
│   │   ├── 📄 workflows.ts              # Workflow types
│   │   ├── 📄 api.ts                    # API types
│   │   └── 📄 global.ts                 # Global types
│   └── 📄 middleware.ts                 # Next.js middleware
├── 📁 public/                           # Static assets
│   ├── 📁 icons/
│   ├── 📁 images/
│   └── 📄 favicon.ico
├── 📁 tests/                            # Test files
│   ├── 📁 __mocks__/
│   ├── 📁 components/
│   ├── 📁 pages/
│   └── 📁 e2e/
├── 📄 package.json
├── 📄 next.config.js                    # Next.js configuration
├── 📄 tailwind.config.js                # Tailwind configuration
├── 📄 tsconfig.json                     # TypeScript configuration
├── 📄 components.json                   # shadcn/ui configuration
├── 📄 vitest.config.ts                  # Vitest configuration
├── 📄 playwright.config.ts              # Playwright configuration
├── 📄 .eslintrc.json                    # ESLint configuration
└── 📄 .env.local                        # Environment variables
```

## 🚀 Setup y Configuración

### 📦 **Instalación Inicial**

```bash
# Crear proyecto Next.js 15.3 con App Router
npx create-next-app@latest lisadocs-frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --use-pnpm

cd lisadocs-frontend

# Instalar dependencias principales
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
pnpm add zustand @tanstack/react-query
pnpm add react-hook-form @hookform/resolvers zod
pnpm add lucide-react class-variance-authority clsx tailwind-merge
pnpm add date-fns

# Instalar dependencias de desarrollo
pnpm add -D @types/node
pnpm add -D vitest @vitejs/plugin-react jsdom
pnpm add -D @testing-library/react @testing-library/jest-dom
pnpm add -D playwright @playwright/test
```

### 🎨 **Configuración de shadcn/ui**

```bash
# Inicializar shadcn/ui
npx shadcn-ui@latest init

# Instalar componentes base
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add popover
```

### ⚙️ **Configuración de Next.js 15.3**

```typescript
// next.config.js
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Habilitar Turbopack para builds (alpha)
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Variables de entorno
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 🎨 **Configuración de Tailwind CSS**

```typescript
// tailwind.config.js
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // LisaDocs brand colors
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // Workspace colors
        cam: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
        ampp: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        presidencia: {
          50: '#fdf4ff',
          500: '#a855f7',
          600: '#9333ea',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

## 🛣️ App Router y Routing

### 📁 **Next.js 15.3 App Router**

```typescript
// src/app/layout.tsx - Root Layout
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'LisaDocs - Sistema de Gestión Documental',
    template: '%s | LisaDocs',
  },
  description: 'Sistema integral de gestión documental empresarial',
  keywords: ['gestión documental', 'workflows', 'documentos', 'empresa'],
  authors: [{ name: 'Jonathan Rodriguez', url: 'https://github.com/ItsJhonAlex' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### 🔐 **Middleware para Autenticación**

```typescript
// src/middleware.ts - Next.js 15.3 Middleware
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ['/dashboard', '/admin', '/documents', '/workflows'];

// Rutas solo para usuarios no autenticados
const AUTH_ROUTES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req: request, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;
  
  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  // Verificar si es una ruta de autenticación
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Redirigir a login si no está autenticado y accede a ruta protegida
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirigir al dashboard si está autenticado y accede a rutas de auth
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Verificar permisos específicos para rutas admin
  if (pathname.startsWith('/admin') && session) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'administrador' && user?.role !== 'presidente') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 🏠 **Layouts Anidados**

```typescript
// src/app/dashboard/layout.tsx - Dashboard Layout
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <Breadcrumb />
            <div className="flex-1 overflow-auto p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 🔗 **Navigation Hooks (Next.js 15.3)**

```typescript
// src/hooks/useNavigation.ts - Navigation Hooks
import { useRouter } from 'next/navigation';
import { useLinkStatus } from 'next/link'; // New in Next.js 15.3
import { useTransition } from 'react';

export function useAppNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigateTo = (path: string) => {
    startTransition(() => {
      router.push(path);
    });
  };

  return {
    navigateTo,
    isPending,
  };
}

// Componente con Link y onNavigate
export function NavigationLink({ 
  href, 
  children, 
  onNavigate 
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const { pending } = useLinkStatus(); // New in Next.js 15.3

  return (
    <Link 
      href={href}
      onNavigate={onNavigate} // New in Next.js 15.3
      className={`transition-opacity ${pending ? 'opacity-50' : ''}`}
    >
      {children}
      {pending && <LoadingSpinner className="ml-2" />}
    </Link>
  );
}
```

## 🔐 Autenticación con Supabase

### ⚙️ **Configuración de Supabase Client**

```typescript
// src/lib/supabase/client.ts - Client-side Supabase
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

export const supabase = createClientComponentClient<Database>();

// Funciones de autenticación
export const auth = {
  // Sign in con email y password
  signInWithPassword: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up con email y password
  signUp: async (email: string, password: string, metadata: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
```

```typescript
// src/lib/supabase/server.ts - Server-side Supabase
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  });
};

// Obtener usuario actual en servidor
export const getCurrentUser = async () => {
  const supabase = createServerSupabaseClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return user;
};
```

### 🎯 **Auth Provider y Context**

```typescript
// src/components/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, metadata: any) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      router.push('/dashboard');
    }
    
    return { data, error };
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 📝 **Formularios de Autenticación**

```typescript
// src/components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await signIn(values.email, values.password);
      
      if (error) {
        toast({
          title: 'Error al iniciar sesión',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Bienvenido!',
          description: 'Has iniciado sesión correctamente',
        });
      }
    } catch (error) {
      toast({
        title: 'Error inesperado',
        description: 'Ha ocurrido un error. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Iniciar Sesión
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tu contraseña"
                        {...field}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

## 🗄️ Estado Global con Zustand

### 🎯 **Auth Store**

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  isInWorkspace: (workspace: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user 
        }),

        setProfile: (profile) => set({ profile }),

        setSession: (session) => set({ 
          session,
          isAuthenticated: !!session 
        }),

        setLoading: (isLoading) => set({ isLoading }),

        reset: () => set(initialState),

        hasPermission: (permission) => {
          const { profile } = get();
          if (!profile) return false;
          
          // Admin tiene todos los permisos
          if (profile.role === 'administrador') return true;
          
          // Lógica de permisos por rol
          const rolePermissions: Record<string, string[]> = {
            presidente: ['read', 'write', 'approve', 'delete'],
            vicepresidente: ['read', 'write', 'approve'],
            secretario_cam: ['read', 'write'],
            secretario_ampp: ['read', 'write'],
            secretario_cf: ['read', 'write'],
            intendente: ['read', 'write'],
            cf_member: ['read'],
          };
          
          return rolePermissions[profile.role]?.includes(permission) || false;
        },

        hasRole: (role) => {
          const { profile } = get();
          if (!profile) return false;
          
          if (Array.isArray(role)) {
            return role.includes(profile.role);
          }
          
          return profile.role === role;
        },

        isInWorkspace: (workspace) => {
          const { profile } = get();
          if (!profile) return false;
          return profile.workspace === workspace;
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          profile: state.profile,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
```

### 📄 **Documents Store**

```typescript
// src/store/documentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Database } from '@/types/database';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

interface DocumentFilters {
  workspace?: string;
  status?: string;
  search?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  createdBy?: string;
}

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  filters: DocumentFilters;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DocumentActions {
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setCurrentDocument: (document: Document | null) => void;
  setFilters: (filters: Partial<DocumentFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<DocumentState['pagination']>) => void;
  reset: () => void;
}

type DocumentStore = DocumentState & DocumentActions;

const initialState: DocumentState = {
  documents: [],
  currentDocument: null,
  filters: {},
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

export const useDocumentStore = create<DocumentStore>()(
  devtools((set, get) => ({
    ...initialState,

    setDocuments: (documents) => set({ documents }),

    addDocument: (document) => set((state) => ({
      documents: [document, ...state.documents],
    })),

    updateDocument: (id, updates) => set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
      currentDocument: state.currentDocument?.id === id
        ? { ...state.currentDocument, ...updates }
        : state.currentDocument,
    })),

    removeDocument: (id) => set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      currentDocument: state.currentDocument?.id === id
        ? null
        : state.currentDocument,
    })),

    setCurrentDocument: (document) => set({ currentDocument: document }),

    setFilters: (filters) => set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

    resetFilters: () => set({ filters: {} }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    setPagination: (pagination) => set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),

    reset: () => set(initialState),
  }))
);
```

## 🎨 UI Components con shadcn/ui

### 🃏 **Componente de Documento Card**

```typescript
// src/components/documents/DocumentCard.tsx
'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  MoreVertical, 
  Download, 
  Edit, 
  Share, 
  Archive,
  Eye 
} from 'lucide-react';
import type { Database } from '@/types/database';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onShare?: (document: Document) => void;
  onArchive?: (document: Document) => void;
  className?: string;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  pending_approval: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-purple-100 text-purple-800',
  archived: 'bg-gray-100 text-gray-600',
  obsolete: 'bg-gray-50 text-gray-500',
};

const statusLabels = {
  draft: 'Borrador',
  pending_review: 'Pendiente Revisión',
  under_review: 'En Revisión',
  pending_approval: 'Pendiente Aprobación',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  published: 'Publicado',
  archived: 'Archivado',
  obsolete: 'Obsoleto',
};

export function DocumentCard({
  document,
  onView,
  onEdit,
  onDownload,
  onShare,
  onArchive,
  className,
}: DocumentCardProps) {
  const { profile } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const canEdit = profile?.id === document.created_by || 
                  profile?.role === 'administrador' || 
                  profile?.role === 'presidente';

  const canArchive = profile?.role === 'administrador' || 
                     profile?.role === 'presidente';

  return (
    <Card 
      className={cn(
        'group relative transition-all duration-200 hover:shadow-md cursor-pointer',
        isHovered && 'shadow-lg',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView?.(document)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {document.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                v{document.version}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onView?.(document);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                Ver
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(document);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDownload?.(document);
              }}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onShare?.(document);
              }}>
                <Share className="mr-2 h-4 w-4" />
                Compartir
              </DropdownMenuItem>
              {canArchive && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.(document);
                }}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archivar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Status Badge */}
          <Badge 
            variant="secondary" 
            className={cn(
              'text-xs',
              statusColors[document.status as keyof typeof statusColors]
            )}
          >
            {statusLabels[document.status as keyof typeof statusLabels]}
          </Badge>

          {/* Content Preview */}
          {document.content && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {document.content}
            </p>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {document.created_by?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {document.workspace?.toUpperCase()}
            </span>
          </div>
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(document.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
```

### 📋 **Data Table Component**

```typescript
// src/components/common/DataTable.tsx
'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Buscar...',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
            />
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{' '}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-8 w-[70px] rounded border"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 📊 Data Fetching con React Query

### ⚙️ **React Query Configuration**

```typescript
// src/lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
      retry: (failureCount, error: any) => {
        // No retry en errores 4xx
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 🔄 **Custom Hooks para Documents**

```typescript
// src/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import type { Database } from '@/types/database';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

// Query Keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: string) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  versions: (id: string) => [...documentKeys.detail(id), 'versions'] as const,
};

// Fetch Documents
export function useDocuments(filters?: {
  workspace?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: documentKeys.list(JSON.stringify(filters)),
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select(`
          *,
          created_by_user:users!documents_created_by_fkey(
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Filtrar por workspace si el usuario no es admin/presidente
      if (profile?.role !== 'administrador' && profile?.role !== 'presidente') {
        query = query.eq('workspace', profile?.workspace);
      }

      // Aplicar filtros adicionales
      if (filters?.workspace) {
        query = query.eq('workspace', filters.workspace);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });
}

// Fetch Single Document
export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          created_by_user:users!documents_created_by_fkey(
            id,
            full_name,
            email,
            role,
            workspace
          ),
          assigned_to_user:users!documents_assigned_to_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Create Document
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: DocumentInsert) => {
      const { data, error } = await supabase
        .from('documents')
        .insert(document)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast({
        title: 'Documento creado',
        description: 'El documento se ha creado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al crear documento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update Document
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DocumentUpdate }) => {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(data.id) });
      toast({
        title: 'Documento actualizado',
        description: 'El documento se ha actualizado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar documento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete Document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast({
        title: 'Documento eliminado',
        description: 'El documento se ha eliminado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al eliminar documento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Upload File
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({
      file,
      bucket = 'documents',
      path,
    }: {
      file: File;
      bucket?: string;
      path: string;
    }) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        ...data,
        publicUrl,
      };
    },
    onError: (error) => {
      toast({
        title: 'Error al subir archivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
```

## 🔄 Real-time con Supabase

### ⚡ **Real-time Hooks**

```typescript
// src/hooks/useRealtime.ts
'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { documentKeys } from '@/hooks/useDocuments';
import { toast } from '@/components/ui/use-toast';
import type { Database } from '@/types/database';

type Tables = Database['public']['Tables'];

// Real-time Documents
export function useRealtimeDocuments() {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
        },
        (payload) => {
          console.log('Real-time document change:', payload);

          // Invalidate queries on any change
          queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

          // Handle specific events
          switch (payload.eventType) {
            case 'INSERT':
              toast({
                title: 'Nuevo documento',
                description: `Se ha creado un nuevo documento: ${payload.new.title}`,
              });
              break;
            case 'UPDATE':
              if (payload.new.status !== payload.old.status) {
                toast({
                  title: 'Estado actualizado',
                  description: `El documento "${payload.new.title}" cambió a ${payload.new.status}`,
                });
              }
              queryClient.invalidateQueries({ 
                queryKey: documentKeys.detail(payload.new.id) 
              });
              break;
            case 'DELETE':
              toast({
                title: 'Documento eliminado',
                description: 'Se ha eliminado un documento',
                variant: 'destructive',
              });
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);
}

// Real-time Workflow Updates
export function useRealtimeWorkflows() {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('workflow-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: 'status=neq.draft',
        },
        (payload) => {
          // Invalidate workflow-related queries
          queryClient.invalidateQueries({ queryKey: ['workflows'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });

          // Show workflow notifications
          if (payload.eventType === 'UPDATE' && 
              payload.new.assigned_to !== payload.old.assigned_to) {
            toast({
              title: 'Nueva tarea asignada',
              description: `Se te ha asignado el documento: ${payload.new.title}`,
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);
}

// Real-time Notifications
export function useRealtimeNotifications(userId: string) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new;
          
          toast({
            title: notification.title,
            description: notification.message,
            duration: 5000,
          });

          // Play notification sound (optional)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId]);
}

// Real-time Presence
export function useRealtimePresence(documentId?: string) {
  const channelRef = useRef<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!documentId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`document-presence-${documentId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track({
            user_id: 'user-id',
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [documentId]);

  return { onlineUsers };
}
```

## ⚡ Performance y Optimización

### 🚀 **Next.js 15.3 Optimizations**

```typescript
// next.config.js - Performance Configuration
const nextConfig = {
  // Enable Turbopack for faster builds
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Optimize bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable SWC minification
  swcMinify: true,

  // Gzip compression
  compress: true,

  // PWA configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### 🎯 **Component Optimization**

```typescript
// src/components/optimized/LazyDocumentList.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const DocumentList = lazy(() => import('@/components/documents/DocumentList'));
const DocumentViewer = lazy(() => import('@/components/documents/DocumentViewer'));

// Loading Skeleton
function DocumentListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LazyDocumentList() {
  return (
    <Suspense fallback={<DocumentListSkeleton />}>
      <DocumentList />
    </Suspense>
  );
}

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  height: number;
  itemHeight: number;
  renderItem: ({ index, style }: any) => React.ReactNode;
}

export function VirtualizedList({ 
  items, 
  height, 
  itemHeight, 
  renderItem 
}: VirtualizedListProps) {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {renderItem}
    </List>
  );
}
```

### 🔄 **React Query Optimizations**

```typescript
// src/lib/optimized-queries.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

// Prefetch queries
export function usePrefetchDocuments() {
  const queryClient = useQueryClient();

  const prefetchDocuments = useCallback(
    (filters?: any) => {
      queryClient.prefetchQuery({
        queryKey: ['documents', 'list', filters],
        queryFn: () => fetchDocuments(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    [queryClient]
  );

  return { prefetchDocuments };
}

// Infinite scroll
export function useInfiniteDocuments() {
  return useInfiniteQuery({
    queryKey: ['documents', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .range(pageParam, pageParam + 19)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length * 20 : undefined;
    },
    initialPageParam: 0,
  });
}

// Background sync
export function useBackgroundSync() {
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ['documents'],
        refetchType: 'none', // Only mark as stale, don't refetch immediately
      });
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);
}
```

## 🧪 Testing

### ⚙️ **Vitest Configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 🧪 **Test Utilities**

```typescript
// src/tests/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';

// Create test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Custom render function
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const testQueryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

### 🧪 **Component Tests**

```typescript
// src/tests/components/DocumentCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/tests/utils';
import { DocumentCard } from '@/components/documents/DocumentCard';

const mockDocument = {
  id: '1',
  title: 'Test Document',
  content: 'Test content',
  status: 'draft',
  version: '1.0.0',
  workspace: 'cam',
  created_at: '2024-01-01T00:00:00Z',
  created_by: 'user-1',
  tags: ['test', 'document'],
};

describe('DocumentCard', () => {
  it('renders document information correctly', () => {
    render(<DocumentCard document={mockDocument} />);
    
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Borrador')).toBeInTheDocument();
    expect(screen.getByText('CAM')).toBeInTheDocument();
  });

  it('calls onView when clicked', () => {
    const mockOnView = vi.fn();
    render(<DocumentCard document={mockDocument} onView={mockOnView} />);
    
    fireEvent.click(screen.getByRole('article'));
    expect(mockOnView).toHaveBeenCalledWith(mockDocument);
  });

  it('shows action menu when more button is clicked', () => {
    render(<DocumentCard document={mockDocument} />);
    
    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);
    
    expect(screen.getByText('Ver')).toBeInTheDocument();
    expect(screen.getByText('Descargar')).toBeInTheDocument();
  });
});
```

### 🎭 **E2E Tests with Playwright**

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Bienvenido')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid=email-input]', 'invalid@example.com');
    await page.fill('[data-testid=password-input]', 'wrongpassword');
    await page.click('[data-testid=login-button]');
    
    await expect(page.getByText('Error al iniciar sesión')).toBeVisible();
  });
});

test.describe('Documents', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new document', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.click('[data-testid=new-document-button]');
    
    await page.fill('[data-testid=document-title]', 'Test Document');
    await page.fill('[data-testid=document-content]', 'This is test content');
    await page.click('[data-testid=save-document-button]');
    
    await expect(page.getByText('Documento creado')).toBeVisible();
    await expect(page.getByText('Test Document')).toBeVisible();
  });
});
```

## 🚀 Deployment

### 🌐 **Vercel Deployment**

```typescript
// vercel.json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 🐳 **Docker Configuration**

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN corepack enable pnpm && pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

## 📝 Best Practices

### 🎯 **Performance Best Practices**

1. **Code Splitting**

   ```typescript
   // Dynamic imports
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />,
     ssr: false,
   });
   ```

2. **Image Optimization**

   ```typescript
   import Image from 'next/image';
   
   <Image
     src="/document.jpg"
     alt="Document"
     width={300}
     height={200}
     priority // Para imágenes above-the-fold
     placeholder="blur"
     blurDataURL="data:image/jpeg;base64,..."
   />
   ```

3. **Bundle Analysis**

   ```bash
   # Analizar bundle size
   pnpm add -D @next/bundle-analyzer
   ANALYZE=true pnpm build
   ```

### 🔐 **Security Best Practices**

1. **Environment Variables**

   ```typescript
   // Solo variables públicas con NEXT_PUBLIC_
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   
   // Validar variables de entorno
   const envSchema = z.object({
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
   });
   
   envSchema.parse(process.env);
   ```

2. **Content Security Policy**

   ```typescript
   // next.config.js
   const ContentSecurityPolicy = `
     default-src 'self';
     script-src 'self' 'unsafe-eval' 'unsafe-inline';
     style-src 'self' 'unsafe-inline';
     img-src 'self' blob: data: https:;
     connect-src 'self' https://*.supabase.co;
   `;
   
   const securityHeaders = [
     {
       key: 'Content-Security-Policy',
       value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
     },
   ];
   ```

### 🎨 **UI/UX Best Practices**

1. **Accessible Components**

   ```typescript
   // Siempre incluir labels y ARIA attributes
   <Button
     aria-label="Eliminar documento"
     aria-describedby="delete-tooltip"
   >
     <Trash2 className="h-4 w-4" />
   </Button>
   ```

2. **Loading States**

   ```typescript
   // Loading skeletons consistency
   function DocumentSkeleton() {
     return (
       <Card>
         <CardHeader>
           <Skeleton className="h-4 w-3/4" />
           <Skeleton className="h-3 w-1/2" />
         </CardHeader>
         <CardContent>
           <Skeleton className="h-20 w-full" />
         </CardContent>
       </Card>
     );
   }
   ```

3. **Error Boundaries**

   ```typescript
   // Global error handling
   function ErrorFallback({ error }: { error: Error }) {
     return (
       <div className="text-center p-8">
         <h2 className="text-lg font-semibold mb-2">
           Algo salió mal
         </h2>
         <p className="text-muted-foreground mb-4">
           {error.message}
         </p>
         <Button onClick={() => window.location.reload()}>
           Recargar página
         </Button>
       </div>
     );
   }
   ```

---

## 🎉 Conclusión

Esta documentación cubre la implementación completa del frontend de **LisaDocs** utilizando las tecnologías más modernas del ecosistema React:

### ✨ **Características Destacadas:**

- **Next.js 15.3** con Turbopack para builds súper rápidos
- **App Router** con routing file-based y layouts anidados  
- **Supabase** integration completa con real-time
- **shadcn/ui** para componentes hermosos y accesibles
- **TypeScript** end-to-end con type safety
- **React Query** para data fetching optimizado
- **Zustand** para estado global simple
- **Testing** comprehensivo con Vitest y Playwright

### 🚀 **Performance Highlights:**

- **28-83% faster builds** con Turbopack
- **Real-time updates** sin configuración compleja
- **Automatic optimization** con Next.js
- **Bundle splitting** automático
- **Image optimization** avanzada

¡Con esta arquitectura, **LisaDocs** está preparado para escalar a nivel enterprise manteniendo una developer experience increíble! 🏆⚡

---

**Referencias:**

- [Next.js 15.3 Blog Post](https://nextjs.org/blog/next-15-3)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
</rewritten_file>
