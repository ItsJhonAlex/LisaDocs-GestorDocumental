import { FileText, Clock, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface DocumentStatusStatsProps {
  stats: {
    draft: number;
    stored: number;
    archived: number;
  };
  className?: string;
}

/**
 * 📊 Componente de estadísticas de estado de documentos
 * 
 * Muestra una visualización clara de la distribución de documentos
 * por estado con barras de progreso y porcentajes.
 */
export function DocumentStatusStats({ stats, className }: DocumentStatusStatsProps) {
  const total = stats.draft + stats.stored + stats.archived;
  
  if (total === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No hay documentos disponibles</p>
      </div>
    );
  }

  const draftPercentage = Math.round((stats.draft / total) * 100);
  const storedPercentage = Math.round((stats.stored / total) * 100);
  const archivedPercentage = Math.round((stats.archived / total) * 100);

  const statusConfig = [
    {
      key: 'draft',
      label: 'Borradores',
      value: stats.draft,
      percentage: draftPercentage,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      icon: Clock,
      description: 'Documentos en proceso de edición'
    },
    {
      key: 'stored',
      label: 'Almacenados',
      value: stats.stored,
      percentage: storedPercentage,
      color: 'bg-green-500',
      lightColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: FileText,
      description: 'Documentos finalizados y publicados'
    },
    {
      key: 'archived',
      label: 'Archivados',
      value: stats.archived,
      percentage: archivedPercentage,
      color: 'bg-gray-500',
      lightColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      icon: Archive,
      description: 'Documentos archivados para referencia histórica'
    }
  ];

  return (
    <div className={className}>
      {/* 📊 Barra de progreso general */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Distribución total</h4>
          <span className="text-sm text-muted-foreground">{total} documentos</span>
        </div>
        
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          {/* Segmento de borradores */}
          <div 
            className="absolute left-0 top-0 h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${draftPercentage}%` }}
          />
          {/* Segmento de almacenados */}
          <div 
            className="absolute top-0 h-full bg-green-500 transition-all duration-500"
            style={{ 
              left: `${draftPercentage}%`,
              width: `${storedPercentage}%` 
            }}
          />
          {/* Segmento de archivados */}
          <div 
            className="absolute right-0 top-0 h-full bg-gray-500 transition-all duration-500"
            style={{ width: `${archivedPercentage}%` }}
          />
        </div>
      </div>

      {/* 📋 Detalles por estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusConfig.map((status) => {
          const Icon = status.icon;
          
          return (
            <Card key={status.key} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${status.lightColor}`}>
                    <Icon className={`w-5 h-5 ${status.textColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {status.label}
                      </p>
                      <Badge variant="secondary" className="ml-2">
                        {status.percentage}%
                      </Badge>
                    </div>
                    
                    <p className="text-2xl font-bold mb-1">
                      {status.value}
                    </p>
                    
                    <Progress 
                      value={status.percentage} 
                      className="h-2 mb-2"
                    />
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {status.description}
                    </p>
                  </div>
                </div>

                {/* Indicador de color en la esquina */}
                <div 
                  className={`absolute top-0 right-0 w-1 h-full ${status.color}`}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 📈 Información adicional */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-orange-600">{draftPercentage}%</p>
            <p className="text-xs text-muted-foreground">En borrador</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-green-600">{storedPercentage}%</p>
            <p className="text-xs text-muted-foreground">Publicados</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-600">{archivedPercentage}%</p>
            <p className="text-xs text-muted-foreground">Archivados</p>
          </div>
        </div>
      </div>
    </div>
  );
} 