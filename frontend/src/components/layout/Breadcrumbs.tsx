import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useBreadcrumbs, useNavigation } from '@/hooks/useNavigation';

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

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const breadcrumbs = useBreadcrumbs();
  const { navigateWithLoading } = useNavigation();

  // 🏠 No mostrar breadcrumbs en la página de inicio
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
            )}
            
            {item.isLast ? (
              <span className="font-medium text-foreground">
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => navigateWithLoading(item.href)}
                className="text-muted-foreground hover:text-foreground transition-colors hover:underline"
              >
                {item.label}
              </button>
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
