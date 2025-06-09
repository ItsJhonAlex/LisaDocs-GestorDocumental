import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Users, 
  Download,
  BookOpen,
  Gavel
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  DocumentList,
  DocumentUpload,
  DocumentViewer,
  DocumentStatusStats
} from '@/components/documents';

// 🪝 Importar nuestro hook personalizado  
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';

// 🎯 Importar tipos
import type { Document, UploadFile } from '@/types/document';

// 🎯 Tipos específicos para AMPP
interface AMPPStats {
  totalDocuments: number;
  recentAssemblies: number;
  totalDownloads: number;
  activeMembers: number;
  pendingLaws: number;
}

const mockAMPPStats: AMPPStats = {
  totalDocuments: 5,
  recentAssemblies: 2,
  totalDownloads: 134,
  activeMembers: 25,
  pendingLaws: 3
};

/**
 * 🏛️ Dashboard del Workspace AMPP (Asamblea Municipal del Poder Popular)
 * 
 * Funcionalidades específicas:
 * - Gestión de actas de asambleas
 * - Proyectos de ley y resoluciones
 * - Dictámenes y documentos legislativos
 * - Control de acceso según permisos de secretario AMPP
 */
export function AMPPDashboard() {
  const { user, hasPermission } = useAuth();
  
  // 🪝 Usar nuestro hook personalizado con filtros de workspace
  const {
    documents,
    filters,
    error,
    stats,
    isLoading,
    currentPage,
    totalPages,
    uploadDocument,
    uploadMultipleDocuments,
    deleteDocument,
    archiveDocument,
    restoreDocument,
    downloadDocument,
    updateFilters,
    changePage
  } = useDocuments({ 
    workspace: 'ampp', // Filtrar solo documentos de AMPP
    autoLoad: true 
  });

  // 🎯 Estado local para UI
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [localStats] = useState<AMPPStats>(mockAMPPStats);

  // 🎯 Permisos específicos para AMPP usando datos del backend
  const isAdmin = user?.role === 'administrador';
  const canUpload = isAdmin || hasPermission('manage', 'ampp') || hasPermission('view', 'ampp');
  const canArchiveOthers = isAdmin || hasPermission('archive', 'ampp');
  const canManage = isAdmin || hasPermission('manage', 'ampp');

  // 🔍 Documentos filtrados por tab
  const getFilteredDocuments = () => {
    switch (activeTab) {
      case 'assemblies':
        return documents.filter(doc => 
          doc.tags?.includes('acta') || doc.tags?.includes('asamblea')
        );
      case 'laws':
        return documents.filter(doc => 
          doc.tags?.includes('proyecto') || doc.tags?.includes('ley') || doc.tags?.includes('resolución')
        );
      case 'drafts':
        return documents.filter(doc => doc.status === 'draft');
      case 'archived':
        return documents.filter(doc => doc.status === 'archived');
      default:
        return documents;
    }
  };

  const filteredDocuments = getFilteredDocuments();

  // 🎯 Gestores de eventos
  const handleUpload = async (files: UploadFile[]) => {
    try {
      if (files.length === 1) {
        await uploadDocument(files[0]);
      } else {
        await uploadMultipleDocuments(files);
      }
      setIsUploadOpen(false);
    } catch (error) {
      console.error('Error uploading files to AMPP:', error);
    }
  };

  const handleView = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      setSelectedDocument(doc);
      setIsViewerOpen(true);
    }
  };

  const handleDownload = async (documentId: string) => {
    await downloadDocument(documentId);
  };

  const handleArchive = async (documentId: string) => {
    await archiveDocument(documentId);
  };

  const handleRestore = async (documentId: string) => {
    await restoreDocument(documentId);
  };

  const handleDelete = async (documentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este documento de la AMPP?')) {
      await deleteDocument(documentId);
    }
  };

  const handleEdit = (documentId: string) => {
    console.log('Edit AMPP document:', documentId);
  };

  const handleShare = (documentId: string) => {
    console.log('Share AMPP document:', documentId);
  };

  // 📊 Calcular estadísticas del tab actual
  const getTabStats = () => {
    return {
      all: documents.length,
      assemblies: documents.filter(d => 
        d.tags?.includes('acta') || d.tags?.includes('asamblea')
      ).length,
      laws: documents.filter(d => 
        d.tags?.includes('proyecto') || d.tags?.includes('ley') || d.tags?.includes('resolución')
      ).length,
      drafts: documents.filter(d => d.status === 'draft').length,
      archived: documents.filter(d => d.status === 'archived').length
    };
  };

  const tabStats = getTabStats();

  return (
    <div className="space-y-6">
      {/* 📊 Estadísticas del AMPP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              En AMPP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asambleas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.recentAssemblies}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descargas</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diputados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leyes Pendientes</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.pendingLaws}</div>
            <p className="text-xs text-muted-foreground">
              En trámite
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📊 Estadísticas de estado */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de Documentos - AMPP</CardTitle>
            <CardDescription>
              Distribución por estado de los documentos de la Asamblea Municipal del Poder Popular
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentStatusStats 
              stats={{
                draft: stats.byStatus?.draft || 0,
                stored: stats.byStatus?.stored || 0,
                archived: stats.byStatus?.archived || 0
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* 📄 Gestión de documentos AMPP */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Documentos de la AMPP</CardTitle>
              <CardDescription>
                Actas, proyectos de ley, resoluciones y documentos legislativos
              </CardDescription>
            </div>
            
            {canUpload && (
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Subir Documento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Subir Documento a la AMPP</DialogTitle>
                    <DialogDescription>
                      Sube documentos de la Asamblea Municipal del Poder Popular.
                    </DialogDescription>
                  </DialogHeader>
                  <DocumentUpload 
                    onUpload={handleUpload}
                    allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']}
                    maxFileSize={50}
                    multiple={true}
                    defaultWorkspace="ampp"
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todos ({tabStats.all})</TabsTrigger>
              <TabsTrigger value="assemblies">
                Asambleas ({tabStats.assemblies})
              </TabsTrigger>
              <TabsTrigger value="laws">
                Legislativos ({tabStats.laws})
              </TabsTrigger>
              <TabsTrigger value="drafts">Borradores ({tabStats.drafts})</TabsTrigger>
              <TabsTrigger value="archived">Archivados ({tabStats.archived})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="min-h-[400px]">
                {filteredDocuments.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'all' 
                        ? 'No hay documentos en el workspace de la AMPP.' 
                        : `No hay documentos en la categoría "${activeTab}".`
                      }
                    </p>
                    {canUpload && (
                      <Button 
                        onClick={() => setIsUploadOpen(true)}
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Subir primer documento
                      </Button>
                    )}
                  </div>
                ) : (
                                  <DocumentList
                  documents={filteredDocuments}
                  isLoading={isLoading}
                  error={error}
                  filters={{}}
                  onFiltersChange={async (newFilters) => {
                    // Convert component filters to hook filters
                    const hookFilters: Partial<import('@/types/document').DocumentFilters> = {};
                    if (newFilters.search) hookFilters.search = newFilters.search;
                    await updateFilters(hookFilters);
                  }}
                  onView={handleView}
                  onDownload={handleDownload}
                  onArchive={canArchiveOthers ? handleArchive : undefined}
                  onRestore={canArchiveOthers ? handleRestore : undefined}
                  onDelete={canManage ? handleDelete : undefined}
                  onEdit={handleEdit}
                  onShare={handleShare}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={20}
                  totalItems={filteredDocuments.length}
                  onPageChange={changePage}
                  defaultLayout="grid"
                  showFilters={true}
                />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 👁️ Visualizador de documentos */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onDownload={handleDownload}
        onShare={handleShare}
      />
    </div>
  );
}
