import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// 🎯 Tipos para el spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'dots' | 'pulse' | 'spin';
}

/**
 * 🔄 Componente de loading spinner reutilizable
 */
export function LoadingSpinner({
  size = 'md',
  className,
  text,
  fullScreen = false,
  variant = 'default'
}: LoadingSpinnerProps) {
  // 📏 Tamaños del spinner
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // 🎨 Renderizar spinner según variante
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner size={size} />;
      case 'pulse':
        return <PulseSpinner size={size} />;
      case 'spin':
        return <SpinSpinner size={size} />;
      default:
        return (
          <Loader2 
            className={cn(
              'animate-spin text-primary',
              sizeClasses[size],
              className
            )}
          />
        );
    }
  };

  // 🖥️ Renderizar en pantalla completa
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center space-y-4">
          {renderSpinner()}
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 📦 Renderizar inline
  return (
    <div className="flex items-center justify-center space-x-2">
      {renderSpinner()}
      {text && (
        <span className="text-sm text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  );
}

/**
 * ⚫ Spinner de puntos
 */
function DotsSpinner({ size }: { size: LoadingSpinnerProps['size'] }) {
  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
    xl: 'w-3 h-3'
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary rounded-full animate-pulse',
            dotSize[size || 'md']
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 💓 Spinner de pulso
 */
function PulseSpinner({ size }: { size: LoadingSpinnerProps['size'] }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div
      className={cn(
        'bg-primary rounded-full animate-pulse',
        sizeClasses[size || 'md']
      )}
    />
  );
}

/**
 * 🌪️ Spinner personalizado giratorio
 */
function SpinSpinner({ size }: { size: LoadingSpinnerProps['size'] }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-4'
  };

  return (
    <div
      className={cn(
        'border-primary border-t-transparent rounded-full animate-spin',
        sizeClasses[size || 'md']
      )}
    />
  );
}

/**
 * 📄 Spinner para overlays de contenido
 */
export function ContentSpinner({ 
  text = "Cargando...",
  className 
}: { 
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 space-y-4", className)}>
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}

/**
 * 🎯 Spinner inline para botones
 */
export function ButtonSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <LoadingSpinner 
      size={size} 
      className="text-current" 
    />
  );
}

/**
 * 📊 Spinner para páginas completas
 */
export function PageSpinner({ text = "Cargando página..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <LoadingSpinner size="xl" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Por favor espera</h3>
          <p className="text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 🏗️ Skeleton loader para contenido
 */
export function SkeletonLoader({ 
  lines = 3,
  className 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          {i === lines - 1 && (
            <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
          )}
        </div>
      ))}
    </div>
  );
}
