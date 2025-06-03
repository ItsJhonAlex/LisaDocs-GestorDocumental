import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Clock, Star } from 'lucide-react';
import type { NavigationItem } from '@/components/layout/Navigation';
import { useUIStore } from '@/store/uiStore';

// 🍞 Tipo para breadcrumb items
interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

/**
 * 🧭 Hook para manejar navegación con loading
 */
export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const setNavigating = useUIStore(state => state.setNavigating);
  const isNavigating = useUIStore(state => state.isNavigating);

  // 🚀 Navegar con loading automático
  const navigateWithLoading = async (to: string, options?: { replace?: boolean; delay?: number }) => {
    try {
      setNavigating(true);
      
      // Delay opcional para mostrar el loading (útil para transiciones muy rápidas)
      if (options?.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
      
      navigate(to, { replace: options?.replace });
      
      // Simular tiempo de carga mínimo para mejor UX
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setNavigating(false);
    }
  };

  // 🔄 Detectar cambios de ruta para limpiar el loading
  useEffect(() => {
    // Timeout para asegurar que el loading se quita después de la navegación
    const timer = setTimeout(() => {
      setNavigating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname, setNavigating]);

  return {
    navigateWithLoading,
    isNavigating,
    currentPath: location.pathname,
    goBack: () => window.history.back(),
    goHome: () => navigateWithLoading('/dashboard'),
  };
}

/**
 * 🍞 Hook para generar breadcrumbs automáticamente
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // 🏠 Si estamos en dashboard o raíz, no mostrar breadcrumbs
  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
    return [];
  }
  
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      isLast: false
    }
  ];

  // 🎯 Mapeo de rutas a nombres legibles
  const routeNames: Record<string, string> = {
    documents: 'Documentos',
    users: 'Usuarios',
    admin: 'Administración',
    settings: 'Configuración',
    reports: 'Reportes',
    archive: 'Archivo',
    notifications: 'Notificaciones',
    workspaces: 'Espacios de Trabajo',
    presidencia: 'Presidencia',
    cam: 'CAM',
    ampp: 'AMPP',
    intendencia: 'Intendencia',
    comisiones: 'Comisiones CF',
  };

  let currentPath = '';
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // 🎯 Solo agregar si no es 'dashboard' (ya lo tenemos)
    if (segment !== 'dashboard') {
      breadcrumbs.push({
        label: routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
        isLast
      });
    }
  });

  return breadcrumbs;
}

/**
 * 🌟 Hook para navegación favorita/reciente
 */
export function useFavoriteNavigation() {
  // Obtener favoritos y recientes del localStorage
  const getFavorites = (): NavigationItem[] => {
    try {
      const stored = localStorage.getItem('lisadocs-favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const getRecent = (): NavigationItem[] => {
    try {
      const stored = localStorage.getItem('lisadocs-recent');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // 🌟 Agregar a favoritos
  const addToFavorites = (item: Omit<NavigationItem, 'starred'>) => {
    const favorites = getFavorites();
    const newItem: NavigationItem = { ...item, starred: true };
    
    if (!favorites.find(fav => fav.href === item.href)) {
      const updated = [newItem, ...favorites].slice(0, 10); // Máximo 10 favoritos
      localStorage.setItem('lisadocs-favorites', JSON.stringify(updated));
    }
  };

  // 🗑️ Remover de favoritos
  const removeFromFavorites = (href: string) => {
    const favorites = getFavorites();
    const updated = favorites.filter(fav => fav.href !== href);
    localStorage.setItem('lisadocs-favorites', JSON.stringify(updated));
  };

  // ⏰ Agregar a recientes
  const addToRecent = (item: Omit<NavigationItem, 'recent'>) => {
    const recent = getRecent();
    const newItem: NavigationItem = { ...item, recent: true };
    
    // Remover si ya existe y agregarlo al principio
    const filtered = recent.filter(rec => rec.href !== item.href);
    const updated = [newItem, ...filtered].slice(0, 5); // Máximo 5 recientes
    localStorage.setItem('lisadocs-recent', JSON.stringify(updated));
  };

  return {
    favorites: getFavorites(),
    recent: getRecent(),
    addToFavorites,
    removeFromFavorites,
    addToRecent,
  };
}

/**
 * 🎯 Hook para navegación contextual
 */
export function useContextualNavigation() {
  const location = useLocation();
  const { navigateWithLoading } = useNavigation();

  // 🔍 Obtener navegación contextual basada en la ruta actual
  const getContextualItems = (): NavigationItem[] => {
    const path = location.pathname;
    
    if (path.startsWith('/documents')) {
      return [
        {
          id: 'upload',
          label: 'Subir Documento',
          href: '/documents/upload',
          icon: Star,
          description: 'Subir nuevos documentos'
        },
        {
          id: 'search',
          label: 'Búsqueda Avanzada',
          href: '/documents/search',
          icon: Clock,
          description: 'Buscar documentos con filtros'
        }
      ];
    }

    if (path.startsWith('/users')) {
      return [
        {
          id: 'add-user',
          label: 'Nuevo Usuario',
          href: '/users/create',
          icon: Star,
          description: 'Crear nuevo usuario'
        }
      ];
    }

    return [];
  };

  // 🚀 Navegar a acción contextual
  const navigateToAction = (actionId: string) => {
    const items = getContextualItems();
    const item = items.find(i => i.id === actionId);
    
    if (item?.href) {
      navigateWithLoading(item.href);
    }
  };

  return {
    contextualItems: getContextualItems(),
    navigateToAction,
  };
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