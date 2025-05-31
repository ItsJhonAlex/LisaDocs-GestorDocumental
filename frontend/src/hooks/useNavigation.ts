import { useLocation } from 'react-router-dom';
import { Clock, Star, Bookmark } from 'lucide-react';
import type { NavigationItem } from '@/components/layout/Navigation';

// 🍞 Tipo para breadcrumb items
interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

/**
 * 🏗️ Hook para construir navegación contextual
 */
export function useContextualNavigation() {
  const location = useLocation();

  // 🎯 Generar navegación basada en la ruta actual
  const getContextualItems = (): NavigationItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: NavigationItem[] = [];

    // 📄 Navegación para documentos
    if (pathSegments[0] === 'documents') {
      items.push(
        {
          id: 'recent-docs',
          label: 'Documentos Recientes',
          href: '/documents/recent',
          icon: Clock,
          recent: true
        },
        {
          id: 'starred-docs',
          label: 'Documentos Favoritos',
          href: '/documents/starred',
          icon: Star,
          starred: true
        },
        {
          id: 'my-uploads',
          label: 'Mis Subidas',
          href: '/documents/my-uploads',
          icon: Bookmark
        }
      );
    }

    // 👥 Navegación para usuarios
    if (pathSegments[0] === 'users') {
      items.push(
        {
          id: 'active-users',
          label: 'Usuarios Activos',
          href: '/users/active',
          badge: 'Online'
        },
        {
          id: 'pending-users',
          label: 'Solicitudes Pendientes',
          href: '/users/pending',
          badge: 3
        }
      );
    }

    // 🏢 Navegación para espacios de trabajo
    if (pathSegments[0] === 'workspaces' && pathSegments[1]) {
      const workspace = pathSegments[1];
      items.push(
        {
          id: 'workspace-overview',
          label: 'Vista General',
          href: `/workspaces/${workspace}`,
          description: `Dashboard de ${workspace}`
        },
        {
          id: 'workspace-documents',
          label: 'Documentos',
          href: `/workspaces/${workspace}/documents`,
          badge: 'Nuevo'
        },
        {
          id: 'workspace-reports',
          label: 'Reportes',
          href: `/workspaces/${workspace}/reports`
        }
      );
    }

    // ⚙️ Navegación para administración
    if (pathSegments[0] === 'admin') {
      items.push(
        {
          id: 'system-health',
          label: 'Estado del Sistema',
          href: '/admin/health',
          badge: 'OK'
        },
        {
          id: 'audit-logs',
          label: 'Logs de Auditoría',
          href: '/admin/audit'
        },
        {
          id: 'backup-restore',
          label: 'Respaldo y Restauración',
          href: '/admin/backup'
        }
      );
    }

    return items;
  };

  return { getContextualItems };
}

/**
 * 🗺️ Hook para obtener breadcrumbs inteligentes
 */
export function useSmartBreadcrumbs() {
  const location = useLocation();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Mapeo de rutas a nombres amigables
    const routeNames: Record<string, string> = {
      dashboard: 'Dashboard',
      documents: 'Documentos',
      users: 'Usuarios',
      workspaces: 'Espacios de Trabajo',
      admin: 'Administración',
      settings: 'Configuración',
      reports: 'Reportes',
      profile: 'Mi Perfil',
      // Espacios específicos
      presidencia: 'Presidencia',
      intendencia: 'Intendencia',
      cam: 'CAM',
      ampp: 'AMPP',
      comisiones: 'Comisiones CF'
    };

    // Construir breadcrumbs
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        label: routeNames[segment] || segment,
        href: currentPath,
        isLast: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  return { getBreadcrumbs };
}

/**
 * 🎯 Hook para navegación por roles
 */
export function useRoleBasedNavigation() {
  const getNavigationByRole = (userRole: string): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard'
      },
      {
        id: 'documents',
        label: 'Mis Documentos',
        href: '/documents'
      }
    ];

    // Items adicionales por rol
    const roleBasedItems: Record<string, NavigationItem[]> = {
      administrador: [
        {
          id: 'all-users',
          label: 'Gestión de Usuarios',
          href: '/users',
          badge: 'Admin'
        },
        {
          id: 'system-admin',
          label: 'Administración',
          href: '/admin',
          badge: 'Sistema'
        }
      ],
      presidente: [
        {
          id: 'presidency-workspace',
          label: 'Presidencia',
          href: '/workspaces/presidencia'
        },
        {
          id: 'user-management',
          label: 'Usuarios',
          href: '/users'
        }
      ],
      vicepresidente: [
        {
          id: 'reports-access',
          label: 'Reportes',
          href: '/reports'
        }
      ]
    };

    return [...baseItems, ...(roleBasedItems[userRole] || [])];
  };

  return { getNavigationByRole };
} 