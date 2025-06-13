import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Archive, 
  Clock, 
  Download
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// 📦 Importar todos nuestros componentes de documentos
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
import type { Document } from '@/types/document';
import type { BackendDocument } from '@/hooks/useBackendDocuments';

/**
 * 📄 Página principal de gestión de documentos
 * 
 * Dashboard personalizado según el rol del usuario con:
 * - Vista de documentos accesibles según permisos
 * - Estadísticas personalizadas
 * - Subida de documentos
 * - Filtros y búsqueda avanzada
 */
export function DocumentsPage() {
  const { user } = useAuth();
  
  // 🪝 Usar nuestro hook personalizado
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
  } = useDocuments({ autoLoad: true });

  // 🎯 Estado local para UI
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // 🎯 Datos del usuario con fallbacks seguros
  const userRole = user?.role || 'usuario';

  // 🎯 Mapear roles a workspaces (valores exactos del backend)
  const getUserWorkspace = (role: string): string => {
    switch (role) {
      case 'administrador':
      case 'presidente':
      case 'vicepresidente':
        return 'presidencia';
      case 'secretario_cam':
        return 'cam';
      case 'secretario_ampp':
        return 'ampp';
      case 'intendente':
        return 'intendencia';
      case 'secretario_cf':
      case 'cf_member':
        return 'comisiones_cf';
      default:
        return 'presidencia'; // Fallback seguro
    }
  };

  const userWorkspace = getUserWorkspace(userRole);
  
  // 🐛 Debug - verificar valores
  console.log('🎯 Debug workspace mapping:', {
    userRole,
    userWorkspace,
    user: user?.role
  });

  // 🔍 Documentos filtrados por tab
  const getFilteredDocuments = () => {
    switch (activeTab) {
      case 'drafts':
        return documents.filter(doc => doc.status === 'draft');
      case 'archived':
        return documents.filter(doc => doc.status === 'archived');
      case 'stored':
        return documents.filter(doc => doc.status === 'stored');
      default:
        return documents;
    }
  };

  const filteredDocuments = getFilteredDocuments();

  // 🎯 Gestores de eventos
  const handleUpload = async (backendDocuments: BackendDocument[]) => {
    try {
      console.log('📤 Documents uploaded to personal space:', backendDocuments);
      
      // Los documentos ya están subidos al backend a través del hook useBackendDocuments
      // El hook useDocuments se actualizará automáticamente
      console.log('✅ Documents successfully uploaded to personal workspace');
      setIsUploadOpen(false);
    } catch (error) {
      console.error('❌ Error handling uploaded documents:', error);
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
    if (confirm('¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.')) {
      await deleteDocument(documentId);
    }
  };

  const handleEdit = (documentId: string) => {
    console.log('Edit document:', documentId);
    // TODO: Implementar navegación a página de edición
  };

  const handleShare = (documentId: string) => {
    console.log('Share document:', documentId);
    // TODO: Implementar funcionalidad de compartir
  };

  // 📊 Calcular estadísticas del tab actual
  const getTabStats = () => {
    return {
      all: documents.length,
      drafts: documents.filter(d => d.status === 'draft').length,
      stored: documents.filter(d => d.status === 'stored').length,
      archived: documents.filter(d => d.status === 'archived').length
    };
  };

  const tabStats = getTabStats();

  return (
    <div className="space-y-6">
      {/* 📊 Header con información del usuario */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mis Documentos
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus documentos personales • 
            <Badge variant="outline" className="ml-2">{userRole}</Badge>
          </p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto document-upload-dialog">
            <DialogHeader>
              <DialogTitle>Subir Nuevos Documentos</DialogTitle>
              <DialogDescription>
                Arrastra archivos o haz clic para seleccionar. Soporta múltiples archivos.
                {userWorkspace && (
                  <>
                    <br />
                    <Badge variant="outline" className="mt-2">
                      Workspace: {userWorkspace}
                    </Badge>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DocumentUpload 
              onUpload={handleUpload}
              allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'png']}
              maxFileSize={50}
              multiple={true}
              defaultWorkspace={userWorkspace as any}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 📊 Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.all}</div>
            <p className="text-xs text-muted-foreground">
              Total de documentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.drafts}</div>
            <p className="text-xs text-muted-foreground">
              Pendientes de finalizar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.stored}</div>
            <p className="text-xs text-muted-foreground">
              Listos para compartir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archivados</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabStats.archived}</div>
            <p className="text-xs text-muted-foreground">
              Documentos históricos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📄 Lista de documentos con tabs y filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Documentos</CardTitle>
          <CardDescription>
            Gestiona y organiza todos tus documentos personales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 🎯 Tabs para categorizar documentos */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos ({tabStats.all})</TabsTrigger>
              <TabsTrigger value="drafts">Borradores ({tabStats.drafts})</TabsTrigger>
              <TabsTrigger value="stored">Finalizados ({tabStats.stored})</TabsTrigger>
              <TabsTrigger value="archived">Archivados ({tabStats.archived})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* 📋 Lista de documentos */}
              <div className="min-h-[400px]">
                {filteredDocuments.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes documentos</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'all' 
                        ? 'Aún no has creado ningún documento. ¡Comienza subiendo tu primer archivo!' 
                        : `No tienes documentos en la categoría "${activeTab}".`
                      }
                    </p>
                    <Button 
                      onClick={() => setIsUploadOpen(true)}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Subir mi primer documento
                    </Button>
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
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
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
