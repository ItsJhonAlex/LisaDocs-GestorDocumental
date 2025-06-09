import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 🗂️ Componente para mostrar estados vacíos
 * 
 * Se usa cuando no hay datos para mostrar o cuando
 * se produce un error recuperable
 */
export function EmptyState({
  icon,
  title = "No hay datos",
  description,
  action,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const titleSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size],
      className
    )}>
      {icon && (
        <div className={cn(
          'text-muted-foreground mb-4',
          iconSizeClasses[size]
        )}>
          {icon}
        </div>
      )}

      <div className="space-y-2 max-w-md">
        <h3 className={cn(
          'font-medium text-foreground',
          titleSizeClasses[size]
        )}>
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
