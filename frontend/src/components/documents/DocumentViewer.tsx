import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize, 
  Minimize, 
  ChevronLeft, 
  ChevronRight,
  Home,
  FileX,
  Loader2,
  Eye,
  X,
  Share,
  Printer
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

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
  onShare?: (documentId: string) => void;
  onPrint?: (documentId: string) => void;
  className?: string;
}

/**
 * 👁️ Componente visualizador de documentos
 * 
 * Características:
 * - Soporte para PDFs, imágenes, y otros tipos
 * - Controles de zoom y rotación
 * - Modo pantalla completa
 * - Navegación entre páginas (PDFs)
 * - Descarga e impresión
 */
export function DocumentViewer({
  document,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onPrint,
  className
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 🎯 Resetear estado cuando cambia el documento
  useEffect(() => {
    if (document) {
      setZoom(100);
      setRotation(0);
      setCurrentPage(1);
      setTotalPages(1);
      setIsLoading(true);
      setError(null);
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

  // 🔍 Controles de zoom
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 25, 300)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 25, 25)), []);
  const handleZoomReset = useCallback(() => setZoom(100), []);

  // 🔄 Control de rotación
  const handleRotate = useCallback(() => setRotation(prev => (prev + 90) % 360), []);

  // 📄 Navegación de páginas
  const handlePrevPage = useCallback(() => setCurrentPage(prev => Math.max(prev - 1, 1)), []);
  const handleNextPage = useCallback(() => setCurrentPage(prev => Math.min(prev + 1, totalPages)), [totalPages]);

  // 🖥️ Modo pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (!globalThis.document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      globalThis.document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ⌨️ Atajos de teclado
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isOpen || !document) return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleZoomReset();
          break;
        case 'r':
          e.preventDefault();
          handleRotate();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextPage();
          break;
      }
    };

    globalThis.document.addEventListener('keydown', handleKeydown);
    return () => globalThis.document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, isFullscreen, onClose, document, handleZoomIn, handleZoomOut, handleZoomReset, handleRotate, handlePrevPage, handleNextPage, toggleFullscreen]);

  // 📄 Renderizar contenido según el tipo
  const renderDocumentContent = () => {
    if (!document) return null;

    const documentType = getDocumentType(document.mimeType);

    switch (documentType) {
      case 'pdf':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              src={`${document.fileUrl}#page=${currentPage}&zoom=${zoom}`}
              className="w-full h-full border-0"
              style={{
                transform: `rotate(${rotation}deg)`,
                minHeight: '500px'
              }}
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
              src={document.fileUrl}
              alt={document.title}
              className="max-w-none"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
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
              src={document.fileUrl}
              className="w-full h-full border-0 bg-white"
              style={{
                fontSize: `${zoom}%`,
                transform: `rotate(${rotation}deg)`
              }}
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
                <Button onClick={() => onDownload?.(document.id)}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar archivo
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  // 🎛️ Barra de herramientas
  const renderToolbar = () => (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
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

      {/* 🔍 Controles de zoom */}
      <div className="flex items-center gap-1 border rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 25}
          className="h-7 w-7 p-0"
          title="Alejar (Ctrl+-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        
        <div className="px-2 text-sm font-medium min-w-[50px] text-center">
          {zoom}%
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 300}
          className="h-7 w-7 p-0"
          title="Acercar (Ctrl++)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        
        <Separator orientation="vertical" className="h-4" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomReset}
          className="h-7 px-2"
          title="Tamaño original (Ctrl+0)"
        >
          <Home className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* 🔄 Rotación */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRotate}
        className="h-7 w-7 p-0"
        title="Rotar (R)"
      >
        <RotateCw className="w-3.5 h-3.5" />
      </Button>

      {/* 📄 Navegación de páginas (solo para PDFs) */}
      {document && getDocumentType(document.mimeType) === 'pdf' && totalPages > 1 && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="h-7 w-7 p-0"
              title="Página anterior (←)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            
            <div className="px-2 text-sm">
              {currentPage} / {totalPages}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="h-7 w-7 p-0"
              title="Página siguiente (→)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </>
      )}

      <Separator orientation="vertical" className="h-4" />

      {/* 🎯 Acciones */}
      <div className="flex items-center gap-1">
        {onDownload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(document?.id || '')}
            className="h-7 w-7 p-0"
            title="Descargar"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        )}
        
        {onShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShare(document?.id || '')}
            className="h-7 w-7 p-0"
            title="Compartir"
          >
            <Share className="w-3.5 h-3.5" />
          </Button>
        )}
        
        {onPrint && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPrint(document?.id || '')}
            className="h-7 w-7 p-0"
            title="Imprimir"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="h-7 w-7 p-0"
          title="Pantalla completa"
        >
          {isFullscreen ? (
            <Minimize className="w-3.5 h-3.5" />
          ) : (
            <Maximize className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          'max-w-6xl w-full h-[90vh] p-0 gap-0',
          className
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div ref={viewerRef} className="flex flex-col h-full">
          {/* 🎛️ Barra de herramientas */}
          {renderToolbar()}

          {/* 📄 Contenido del documento */}
          <div ref={contentRef} className="flex-1 relative overflow-hidden">
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

          {/* 📊 Footer con atajos */}
          <div className="p-2 border-t bg-muted/50">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Zoom: +/- • Pantalla completa: F11</span>
                <span>Rotar: R • Navegar: ←/→</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 px-2"
              >
                <X className="w-3 h-3 mr-1" />
                Cerrar
              </Button>
            </div>
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

  const documentType = document.mimeType.includes('pdf') ? 'pdf' 
    : document.mimeType.includes('image') ? 'image' 
    : 'unknown';

  const renderPreview = () => {
    switch (documentType) {
      case 'image':
        return (
          <img
            src={document.fileUrl}
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
            src={`${document.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
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
