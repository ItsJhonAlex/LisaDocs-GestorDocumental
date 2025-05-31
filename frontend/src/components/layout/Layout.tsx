import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';

// 🎨 Props del Layout
interface LayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  const { isAuthenticated, requireAuth } = useAuth();

  // 🔒 Verificar autenticación
  useEffect(() => {
    if (!requireAuth()) return;
  }, [requireAuth]);

  // 📱 Cerrar sidebar en móvil cuando se hace clic fuera
  const handleOverlayClick = () => {
    if (window.innerWidth < 1024) { // lg breakpoint
      setSidebarOpen(false);
    }
  };

  // 📱 Manejar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  if (!isAuthenticated) {
    return null; // El hook useAuth se encarga de redirigir
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* 📱 Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* 🗂️ Sidebar */}
      <Sidebar />

      {/* 🏠 Contenido principal */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          "lg:ml-0", // En desktop, el margen se maneja con el sidebar
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        {/* 📊 Header */}
        <Header />

        {/* 🍞 Breadcrumbs */}
        <div className="border-b bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumbs />
          </div>
        </div>

        {/* 📄 Área de contenido */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Contenido dinámico */}
            {children || <Outlet />}
          </div>
        </main>

        {/* 🦶 Footer opcional */}
        <footer className="border-t bg-muted/50 mt-auto">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
              <p>
                © 2024 LisaDocs - Sistema de Gestión Documental
              </p>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <span>Versión 1.0.0</span>
                <span>•</span>
                <span>
                  Desarrollado por{' '}
                  <a
                    href="https://github.com/ItsJhonAlex"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Jonathan Rodriguez
                  </a>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// 🎯 Layout específico para páginas de autenticación
export function AuthLayout({ children, className }: LayoutProps) {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
      "dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900",
      className
    )}>
      {/* 🎨 Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* 📱 Contenido */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        {children}
      </div>

      {/* 🏷️ Branding sutil */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
        LisaDocs v1.0.0
      </div>
    </div>
  );
}

// 🎯 Layout específico para páginas de error
export function ErrorLayout({ children, className }: LayoutProps) {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      "bg-background",
      className
    )}>
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        {children}
      </div>
    </div>
  );
}

// 🎯 Layout específico para el dashboard
export function DashboardLayout({ children, className }: LayoutProps) {
  return (
    <Layout className={className}>
      <div className="space-y-6">
        {/* 🎯 Header del dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Vista general del sistema de gestión documental
            </p>
          </div>
        </div>

        {/* 📊 Contenido del dashboard */}
        {children}
      </div>
    </Layout>
  );
}

export default Layout;
