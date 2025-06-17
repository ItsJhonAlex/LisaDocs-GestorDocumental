import { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  FileX,
  Loader2,
  Eye,
  X,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

import { DocumentStatus } from './DocumentStatus';
import { cn } from '@/lib/utils';

// 🎯 Tipos para el documento
interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'draft' | 'stored' | 'archived';
  workspace: string;
  tags?: string[];
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  fileUrl: string;
}

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (documentId: string) => void;
  className?: string;
}

/**
 * 👁️ Componente visualizador de documentos simplificado
 * 
 * Características:
 * - Vista previa básica de documentos
 * - Abrir en nueva pestaña
 * - Descargar documento
 * - Cerrar visor
 */
export function DocumentViewer({
  document,
  isOpen,
  onClose,
  onDownload,
  className
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  // 🎯 Resetear estado cuando cambia el documento
  useEffect(() => {
    if (document) {
      setIsLoading(true);
      setError(null);
      setViewUrl(null);
      
      // 🔗 Generar URL de visualización temporal
      const generateViewUrl = async () => {
        try {
          const { generateViewUrl: getViewUrl } = await import('@/utils/documentUtils');
          const tempUrl = await getViewUrl(document.id);
          setViewUrl(tempUrl);
        } catch (err) {
          console.error('❌ Error generating view URL:', err);
          setError('Error al generar URL de visualización');
          setIsLoading(false);
        }
      };
      
      generateViewUrl();
    }
  }, [document]);

  // 📄 Determinar el tipo de documento
  const getDocumentType = useCallback((mimeType: string) => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('text')) return 'text';
    return 'unknown';
  }, []);

  // 🎨 Formatear tamaño de archivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // 🔗 Abrir en nueva pestaña
  const handleOpenInNewTab = useCallback(() => {
    if (viewUrl) {
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    }
  }, [viewUrl]);

  // 📄 Renderizar contenido según el tipo
  const renderDocumentContent = () => {
    if (!document || !viewUrl) return null;

    const documentType = getDocumentType(document.mimeType);

    switch (documentType) {
      case 'pdf':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              src={viewUrl}
              className="w-full h-full border-0"
              style={{ minHeight: '500px' }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setError('Error al cargar el documento PDF');
                setIsLoading(false);
              }}
              title={document.title}
            />
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <img
              src={viewUrl}
              alt={document.title}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setError('Error al cargar la imagen');
                setIsLoading(false);
              }}
            />
          </div>
        );

      case 'text':
        return (
          <div className="w-full h-full overflow-auto p-6">
            <iframe
              src={viewUrl}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setError('Error al cargar el documento de texto');
                setIsLoading(false);
              }}
              title={document.title}
            />
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <FileX className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-medium mb-2">Vista previa no disponible</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Este tipo de archivo no se puede previsualizar en el navegador.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => onDownload?.(document.id)}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar archivo
                  </Button>
                  {viewUrl && (
                    <Button variant="outline" onClick={handleOpenInNewTab}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir en nueva pestaña
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // 🎛️ Barra de herramientas simplificada
  const renderToolbar = () => (
    <div className="flex items-center justify-between p-3 border-b bg-muted/50">
      {/* 📄 Información del documento */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{document?.title}</h3>
          <DocumentStatus status={document?.status || 'draft'} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground">
          {document?.fileName} • {document && formatFileSize(document.fileSize)}
        </p>
      </div>

      {/* 🎯 Acciones simplificadas */}
      <div className="flex items-center gap-2">
        {viewUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Nueva pestaña
          </Button>
        )}
        
        {onDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(document?.id || '')}
            title="Descargar"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          title="Cerrar"
        >
          <X className="w-4 h-4 mr-2" />
          Cerrar
        </Button>
      </div>
    </div>
  );

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          'max-w-5xl w-full h-[85vh] p-0 gap-0',
          className
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full">
          {/* 🎛️ Barra de herramientas */}
          {renderToolbar()}

          {/* 📄 Contenido del documento */}
          <div className="flex-1 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Cargando documento...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center space-y-4">
                  <FileX className="w-16 h-16 mx-auto text-destructive" />
                  <div>
                    <h3 className="font-medium mb-2">Error al cargar</h3>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      Intentar de nuevo
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!error && renderDocumentContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 📄 Componente compacto para previsualización rápida
 */
interface QuickPreviewProps {
  document: Document;
  className?: string;
  height?: number;
}

export function DocumentQuickPreview({ 
  document, 
  className, 
  height = 200 
}: QuickPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const documentType = document.mimeType.includes('pdf') ? 'pdf' 
    : document.mimeType.includes('image') ? 'image' 
    : 'unknown';

  // 🔗 Generar URL de visualización al montar el componente
  useEffect(() => {
    const generateViewUrl = async () => {
      try {
        const { generateViewUrl: getViewUrl } = await import('@/utils/documentUtils');
        const tempUrl = await getViewUrl(document.id);
        setViewUrl(tempUrl);
      } catch (err) {
        console.error('❌ Error generating view URL for preview:', err);
        setError('Error al cargar');
        setIsLoading(false);
      }
    };
    
    generateViewUrl();
  }, [document.id]);

  const renderPreview = () => {
    if (!viewUrl) return null;

    switch (documentType) {
      case 'image':
        return (
          <img
            src={viewUrl}
            alt={document.title}
            className="w-full h-full object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Error al cargar');
              setIsLoading(false);
            }}
          />
        );

      case 'pdf':
        return (
          <iframe
            src={`${viewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Error al cargar');
              setIsLoading(false);
            }}
            title={document.title}
          />
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Vista previa no disponible</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className={cn('relative rounded-lg overflow-hidden border', className)}
      style={{ height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <FileX className="w-6 h-6 mx-auto mb-1 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        </div>
      )}

      {renderPreview()}
    </div>
  );
}
