import { useState } from 'react';
import { 
  List, 
  Table,
  LayoutGrid,
  Search,
  FileX
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { DocumentCard, DocumentCardSkeleton } from './DocumentCard';
import { DocumentFilters, type DocumentFilters as DocumentFiltersType } from './DocumentFilters';
import { EmptyState } from '@/components/common/EmptyState';
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
  storedAt?: string;
  archivedAt?: string;
  fileUrl: string;
}

interface DocumentListProps {
  documents?: Document[];
  isLoading?: boolean;
  error?: string;
  filters?: DocumentFiltersType;
  onFiltersChange?: (filters: DocumentFiltersType) => void;
  onView?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
  onArchive?: (documentId: string) => void;
  onRestore?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onEdit?: (documentId: string) => void;
  onShare?: (documentId: string) => void;
  className?: string;
  showFilters?: boolean;
  defaultLayout?: 'grid' | 'list' | 'table';
  // Paginación
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  // Usuarios disponibles para filtros
  availableUsers?: Array<{ id: string; name: string }>;
  availableTags?: string[];
}

/**
 * 📋 Componente de lista de documentos
 * 
 * Características:
 * - Múltiples layouts (grid, list, table)
 * - Filtros integrados
 * - Paginación
 * - Estados de carga y error
 * - Estados vacíos
 */
export function DocumentList({
  documents = [],
  isLoading = false,
  error,
  filters = {},
  onFiltersChange,
  onView,
  onDownload,
  onArchive,
  onRestore,
  onDelete,
  onEdit,
  onShare,
  className,
  showFilters = true,
  defaultLayout = 'grid',
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  availableUsers = [],
  availableTags = []
}: DocumentListProps) {
  const [layout, setLayout] = useState<'grid' | 'list' | 'table'>(defaultLayout);

  // 📊 Layout options
  const layoutOptions = [
    { value: 'grid', icon: LayoutGrid, label: 'Cuadrícula' },
    { value: 'list', icon: List, label: 'Lista' },
    { value: 'table', icon: Table, label: 'Tabla' }
  ];

  // 🎯 Renderizar controles de layout
  const renderLayoutControls = () => (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      {layoutOptions.map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.value}
            variant={layout === option.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setLayout(option.value as typeof layout)}
            className="h-8 w-8 p-0"
            title={option.label}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
    </div>
  );

  // 📊 Renderizar información de paginación
  const renderPaginationInfo = () => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    return (
      <div className="text-sm text-muted-foreground">
        {totalItems > 0 ? (
          `Mostrando ${startItem} - ${endItem} de ${totalItems} documentos`
        ) : (
          'No hay documentos para mostrar'
        )}
      </div>
    );
  };

  // 📄 Renderizar documentos según el layout
  const renderDocuments = () => {
    if (isLoading) {
      return (
        <div className={cn(
          'gap-4',
          layout === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          layout === 'list' && 'space-y-3',
          layout === 'table' && 'space-y-2'
        )}>
          {Array.from({ length: pageSize }).map((_, index) => (
            <DocumentCardSkeleton
              key={index}
              variant={layout === 'table' ? 'list' : layout === 'grid' ? 'card' : layout}
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon={<Search className="w-12 h-12" />}
          title="Error al cargar documentos"
          description={error}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </Button>
          }
        />
      );
    }

    if (documents.length === 0) {
      const hasActiveFilters = Object.keys(filters).some(key => 
        key !== 'sortBy' && key !== 'sortOrder' && filters[key as keyof DocumentFiltersType]
      );

      return (
        <EmptyState
          icon={<FileX className="w-12 h-12" />}
          title={hasActiveFilters ? "No se encontraron documentos" : "No hay documentos"}
          description={
            hasActiveFilters 
              ? "Intenta ajustar los filtros para encontrar documentos."
              : "Comienza subiendo tu primer documento al sistema."
          }
          action={
            hasActiveFilters ? (
              <Button 
                variant="outline" 
                onClick={() => onFiltersChange?.({})}
              >
                Limpiar filtros
              </Button>
            ) : (
              <Button>
                Subir documento
              </Button>
            )
          }
        />
      );
    }

    return (
      <div className={cn(
        'gap-4',
        layout === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        layout === 'list' && 'space-y-3',
        layout === 'table' && 'space-y-2'
      )}>
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            variant={layout === 'table' ? 'list' : layout === 'grid' ? 'card' : layout}
            onView={onView}
            onDownload={onDownload}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
            onEdit={onEdit}
            onShare={onShare}
          />
        ))}
      </div>
    );
  };

  // 📄 Renderizar paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              size="default"
              onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
              className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  size="default"
                  onClick={() => onPageChange?.(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext 
              size="default"
              onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
              className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* 🔍 Filtros */}
      {showFilters && onFiltersChange && (
        <DocumentFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          availableUsers={availableUsers}
          availableTags={availableTags}
        />
      )}

      {/* 📊 Header con controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Documentos</h2>
          {renderPaginationInfo()}
        </div>

        <div className="flex items-center gap-3">
          {/* 🎛️ Controles de layout */}
          {renderLayoutControls()}
        </div>
      </div>

      {/* 📄 Lista de documentos */}
      <div className="min-h-[400px]">
        {renderDocuments()}
      </div>

      {/* 📊 Paginación */}
      {documents.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="hidden sm:block">
            {renderPaginationInfo()}
          </div>
          {renderPagination()}
        </div>
      )}
    </div>
  );
}

/**
 * 📋 Versión compacta para usar en dashboards
 */
interface CompactDocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  title?: string;
  maxItems?: number;
  onViewAll?: () => void;
  onView?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
  className?: string;
}

export function CompactDocumentList({
  documents,
  isLoading = false,
  title = "Documentos Recientes",
  maxItems = 5,
  onViewAll,
  onView,
  onDownload,
  className
}: CompactDocumentListProps) {
  const displayDocuments = documents.slice(0, maxItems);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 📊 Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        {onViewAll && documents.length > maxItems && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver todos ({documents.length})
          </Button>
        )}
      </div>

      {/* 📄 Lista compacta */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: maxItems }).map((_, index) => (
            <DocumentCardSkeleton key={index} variant="compact" />
          ))
        ) : displayDocuments.length > 0 ? (
          displayDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              variant="compact"
              onView={onView}
              onDownload={onDownload}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileX className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No hay documentos recientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
