import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Star,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// 🎯 Tipos para navegación
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
  external?: boolean;
  description?: string;
  starred?: boolean;
  recent?: boolean;
}

interface NavigationProps {
  items: NavigationItem[];
  title?: string;
  collapsible?: boolean;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

/**
 * 🧭 Componente de navegación contextual
 */
export function Navigation({
  items,
  title,
  collapsible = true,
  className,
  onItemClick
}: NavigationProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 🔄 Toggle expansión de items
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // 🎯 Verificar si una ruta está activa
  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // 📋 Renderizar item de navegación
  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <div key={item.id} className="space-y-1">
        {/* 🎯 Item principal */}
        <div
          className={cn(
            "flex items-center justify-between rounded-lg transition-colors",
            level > 0 && "ml-4 border-l border-muted pl-4",
            active && "bg-primary/10 text-primary",
            !active && "hover:bg-muted/50"
          )}
        >
          {/* 🔗 Contenido clickeable */}
          <div className="flex-1 min-w-0">
            {item.href ? (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 p-2 rounded-lg transition-colors w-full",
                  active && "text-primary font-medium",
                  !active && "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onItemClick?.(item)}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
              >
                {/* 🎨 Icono */}
                {Icon && (
                  <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-primary")} />
                )}
                
                {/* 🏷️ Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="truncate">{item.label}</span>
                    
                    {/* 🏷️ Badges */}
                    {item.starred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                    {item.recent && <Clock className="w-3 h-3 text-green-500" />}
                    {item.external && <ExternalLink className="w-3 h-3" />}
                    
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 📝 Descripción */}
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            ) : (
              <div
                className={cn(
                  "flex items-center space-x-3 p-2 rounded-lg cursor-default",
                  "text-muted-foreground"
                )}
              >
                {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate font-medium">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 🔄 Botón de expansión */}
          {hasChildren && collapsible && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 ml-2 flex-shrink-0"
              onClick={() => toggleExpanded(item.id)}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>

        {/* 📂 Items hijos */}
        {hasChildren && (isExpanded || !collapsible) && (
          <div className="space-y-1">
            {item.children!.map((child) => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={cn("space-y-2", className)}>
      {/* 🏷️ Título */}
      {title && (
        <>
          <h3 className="px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          <Separator className="my-2" />
        </>
      )}

      {/* 📋 Items de navegación */}
      <div className="space-y-1">
        {items.map((item) => renderNavigationItem(item))}
      </div>
    </nav>
  );
}

/**
 * 🏢 Navegación específica para espacios de trabajo
 */
export function WorkspaceNavigation({ workspace }: { workspace: string }) {
  const workspaceItems: Record<string, NavigationItem[]> = {
    presidencia: [
      {
        id: 'decretos',
        label: 'Decretos',
        href: '/workspaces/presidencia/decretos',
        badge: 'Nuevo'
      },
      {
        id: 'resoluciones',
        label: 'Resoluciones',
        href: '/workspaces/presidencia/resoluciones'
      },
      {
        id: 'comunicados',
        label: 'Comunicados',
        href: '/workspaces/presidencia/comunicados'
      }
    ],
    intendencia: [
      {
        id: 'ordenanzas',
        label: 'Ordenanzas',
        href: '/workspaces/intendencia/ordenanzas'
      },
      {
        id: 'disposiciones',
        label: 'Disposiciones',
        href: '/workspaces/intendencia/disposiciones'
      }
    ],
    cam: [
      {
        id: 'actas',
        label: 'Actas CAM',
        href: '/workspaces/cam/actas'
      },
      {
        id: 'resoluciones-cam',
        label: 'Resoluciones CAM',
        href: '/workspaces/cam/resoluciones'
      }
    ],
    ampp: [
      {
        id: 'registros',
        label: 'Registros AMPP',
        href: '/workspaces/ampp/registros'
      },
      {
        id: 'certificaciones',
        label: 'Certificaciones',
        href: '/workspaces/ampp/certificaciones'
      }
    ],
    comisiones_cf: [
      {
        id: 'actas-cf',
        label: 'Actas CF',
        href: '/workspaces/comisiones/actas'
      },
      {
        id: 'informes-cf',
        label: 'Informes CF',
        href: '/workspaces/comisiones/informes'
      }
    ]
  };

  const items = workspaceItems[workspace] || [];

  return (
    <Navigation
      title={`Navegación ${workspace.replace('_', ' ')}`}
      items={items}
    />
  );
}
