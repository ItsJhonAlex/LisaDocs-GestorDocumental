import { 
  Home, 
  FileText, 
  Users, 
  Building, 
  Settings, 
  Shield, 
  Bell,
  BarChart3,
  Archive,
  UserCheck,
  Briefcase,
  Scale,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';

// 🎯 Tipos para navegación
interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  roles?: string[]; // Roles que pueden ver este item
  workspaces?: string[]; // Espacios de trabajo específicos
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
  roles?: string[]; // Roles que pueden ver todo el grupo
}

export function Sidebar() {
  const location = useLocation();
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useUIStore(state => state.toggleSidebarCollapsed);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  
  const { user, hasRole, hasWorkspaceAccess, hasAnyRole } = useAuth();
  const { navigateWithLoading } = useNavigation();

  // 🎯 Configuración de navegación
  const navigationGroups: NavigationGroup[] = [
    {
      label: 'Principal',
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: Home,
        },
        {
          label: 'Documentos',
          href: '/documents',
          icon: FileText,
        },
      ],
    },
    {
      label: 'Espacios de Trabajo',
      items: [
        {
          label: 'Presidencia',
          href: '/workspaces/presidencia',
          icon: Crown,
          workspaces: ['presidencia'],
        },
        {
          label: 'Intendencia',
          href: '/workspaces/intendencia',
          icon: Building,
          workspaces: ['intendencia'],
        },
        {
          label: 'CAM',
          href: '/workspaces/cam',
          icon: Briefcase,
          workspaces: ['cam'],
        },
        {
          label: 'AMPP',
          href: '/workspaces/ampp',
          icon: UserCheck,
          workspaces: ['ampp'],
        },
        {
          label: 'Comisiones CF',
          href: '/workspaces/comisiones',
          icon: Scale,
          workspaces: ['comisiones_cf'],
        },
      ],
    },
    {
      label: 'Gestión',
      roles: ['administrador', 'presidente', 'vicepresidente'],
      items: [
        {
          label: 'Usuarios',
          href: '/users',
          icon: Users,
          roles: ['administrador', 'presidente'],
        },
        {
          label: 'Reportes',
          href: '/reports',
          icon: BarChart3,
          roles: ['administrador', 'presidente', 'vicepresidente'],
        },
        {
          label: 'Archivo',
          href: '/archive',
          icon: Archive,
          roles: ['administrador', 'presidente', 'vicepresidente'],
        },
      ],
    },
    {
      label: 'Sistema',
      roles: ['administrador'],
      items: [
        {
          label: 'Administración',
          href: '/admin',
          icon: Shield,
          roles: ['administrador'],
        },
        {
          label: 'Configuración',
          href: '/settings',
          icon: Settings,
          roles: ['administrador'],
        },
        {
          label: 'Notificaciones',
          href: '/notifications',
          icon: Bell,
          roles: ['administrador'],
        },
      ],
    },
  ];

  // 🎯 Verificar si un item debe mostrarse
  const shouldShowItem = (item: NavigationItem): boolean => {
    // Verificar roles
    if (item.roles && !hasAnyRole(item.roles)) {
      return false;
    }

    // Verificar espacios de trabajo
    if (item.workspaces && !item.workspaces.some(ws => hasWorkspaceAccess(ws))) {
      // Los administradores pueden ver todos los espacios
      if (!hasRole('administrador')) {
        return false;
      }
    }

    return true;
  };

  // 🎯 Verificar si un grupo debe mostrarse
  const shouldShowGroup = (group: NavigationGroup): boolean => {
    // Verificar roles del grupo
    if (group.roles && !hasAnyRole(group.roles)) {
      return false;
    }

    // Verificar si al menos un item del grupo es visible
    return group.items.some(shouldShowItem);
  };

  // 🎯 Verificar si una ruta está activa
  const isActiveRoute = (href: string): boolean => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* 🗂️ Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-background border-r transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64",
          "w-64" // Ancho en móvil
        )}
      >
        <div className="flex h-full flex-col">
          {/* 🏷️ Header del sidebar */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">L</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg">LisaDocs</span>
                  <span className="text-xs text-muted-foreground">v1.0.0</span>
                </div>
              </div>
            )}
            
            {/* 🔄 Botón de colapsar (solo desktop) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarCollapsed}
              className="hidden lg:flex"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 👤 Info del usuario */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-medium text-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 🧭 Navegación */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            {navigationGroups.map((group) => {
              if (!shouldShowGroup(group)) return null;

              const visibleItems = group.items.filter(shouldShowItem);
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.label}>
                  {/* 🏷️ Label del grupo */}
                  {!sidebarCollapsed && (
                    <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </h3>
                  )}

                  {/* 📋 Items del grupo */}
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = isActiveRoute(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            // Usar navegación con loading
                            navigateWithLoading(item.href);
                            
                            // Cerrar sidebar en móvil al navegar
                            if (window.innerWidth < 1024) {
                              setSidebarOpen(false);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            "hover:bg-muted/50",
                            isActive 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground",
                            sidebarCollapsed && "justify-center px-2"
                          )}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className={cn("flex-shrink-0", sidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                          
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1">{item.label}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* 🔄 Separador entre grupos */}
                  {!sidebarCollapsed && (
                    <Separator className="my-4" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
