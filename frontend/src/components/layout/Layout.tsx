import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// 🎨 Props del Layout
interface LayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  const isNavigating = useUIStore(state => state.isNavigating); // Estado de navegación
  const { isAuthenticated } = useAuth();

  // 🔒 Verificar autenticación
  useEffect(() => {
    // En producción: redirigir a login si no está autenticado
    if (!isAuthenticated) {
      // window.location.href = '/login';
    }
  }, [isAuthenticated]);

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
      {/* 🔄 Loading overlay para navegación */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoadingSpinner 
              size="lg" 
              variant="dots"
              className="text-primary" 
            />
            <p className="text-sm text-muted-foreground animate-pulse">
              Cargando página...
            </p>
          </div>
        </div>
      )}

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
      "bg-background",
      className
    )}>
      {/* 🎨 Elementos decorativos sutiles */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Patrón de puntos sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] [background-size:16px_16px]" />
        
        {/* Cards decorativos sutiles */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-muted/20 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-muted/30 rounded-xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 left-10 w-16 h-40 bg-muted/15 rounded-xl rotate-45 blur-sm" />
        <div className="absolute top-1/3 right-16 w-20 h-20 bg-muted/25 rounded-full blur-sm" />
      </div>

      {/* 📱 Contenido */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        {/* 🎨 Card de fondo para el contenido */}
        <div className="bg-card border border-border rounded-lg shadow-lg backdrop-blur-sm">
          {children}
        </div>
      </div>

      {/* 🏷️ Branding sutil */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full border border-border">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span>LisaDocs v1.0.0 - Sistema de Gestión Documental</span>
        </div>
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
