import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

// 🎯 Tipo para breadcrumb item
interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

// 🗺️ Mapeo de rutas a labels legibles
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  documents: 'Documentos',
  users: 'Usuarios',
  admin: 'Administración',
  settings: 'Configuración',
  notifications: 'Notificaciones',
  reports: 'Reportes',
  archive: 'Archivo',
  profile: 'Mi Perfil',
  workspaces: 'Espacios de Trabajo',
  presidencia: 'Presidencia',
  intendencia: 'Intendencia',
  cam: 'CAM',
  ampp: 'AMPP',
  comisiones: 'Comisiones CF',
  // Documentos específicos
  upload: 'Subir Documento',
  view: 'Ver Documento',
  edit: 'Editar Documento',
  // Usuarios específicos
  create: 'Crear Usuario',
  // Configuraciones
  general: 'General',
  security: 'Seguridad',
  permissions: 'Permisos',
  audit: 'Auditoría',
};

export function Breadcrumbs() {
  const location = useLocation();
  
  // 🍞 Generar breadcrumbs desde la ruta actual
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // 🏠 Siempre empezar con Home/Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
    });
    
    // 🛣️ Si estamos en dashboard, no agregar más
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      breadcrumbs[0].isActive = true;
      return breadcrumbs;
    }
    
    // 🗂️ Construir breadcrumbs paso a paso
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // 🎯 Obtener label apropiado
      let label = routeLabels[segment] || segment;
      
      // 🎨 Casos especiales para rutas anidadas
      if (segment === 'workspaces' && pathSegments[index + 1]) {
        // Para espacios de trabajo, no mostrar "workspaces" sino directamente el espacio
        return;
      }
      
      if (pathSegments[index - 1] === 'workspaces') {
        label = routeLabels[segment] || segment;
      }
      
      // 🆔 Si es un ID (usualmente UUIDs o números), intentar obtener un label más descriptivo
      if (isUUID(segment) || isNumeric(segment)) {
        // TODO: Aquí podríamos hacer una lookup para obtener el nombre real
        // Por ejemplo, para un documento podríamos obtener su nombre
        if (pathSegments[index - 1] === 'documents') {
          label = 'Documento';
        } else if (pathSegments[index - 1] === 'users') {
          label = 'Usuario';
        } else {
          label = 'Detalle';
        }
      }
      
      // 🎯 Capitalizar primera letra si no está en el mapeo
      if (!routeLabels[segment] && !isUUID(segment) && !isNumeric(segment)) {
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        isActive: isLast,
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // 🎯 Si solo hay un breadcrumb (Dashboard), no mostrar nada
  if (breadcrumbs.length <= 1 && breadcrumbs[0]?.isActive) {
    return null;
  }
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {/* 🔗 Link o texto */}
            {item.href ? (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center space-x-1 hover:text-foreground transition-colors",
                  "text-muted-foreground"
                )}
              >
                {/* 🏠 Icono home para el primer item */}
                {index === 0 && <Home className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className={cn(
                "flex items-center space-x-1",
                item.isActive ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {/* 🏠 Icono home para el primer item */}
                {index === 0 && <Home className="w-4 h-4" />}
                <span>{item.label}</span>
              </span>
            )}
            
            {/* ➡️ Separador */}
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// 🛠️ Utilidades para verificar tipos de segmentos
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

// 🎯 Breadcrumb personalizable para casos especiales
interface CustomBreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export function CustomBreadcrumbs({ items, className }: CustomBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-sm", className)}>
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">
                {item.label}
              </span>
            )}
            
            {index < items.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
