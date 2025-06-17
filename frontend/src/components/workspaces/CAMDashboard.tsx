import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Crown,
  Users,
  Download,
  Archive,
  TrendingUp,
  Calendar,
  BarChart3,
  Eye,
  Briefcase
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

// 📦 Importar componentes de documentos
import {
  DocumentList,
  DocumentUpload,
  DocumentViewer,
  DocumentStatusStats
} from '@/components/documents';

// 🪝 Importar hooks
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import type { BackendDocument } from '@/hooks/useBackendDocuments';

// 🎯 Importar tipos
import type { Document, WorkspaceType } from '@/types/document';

// 📊 Interfaz para estadísticas de CAM
interface CAMStats {
  totalDocuments: number;
  recentMeetings: number;
  totalDownloads: number;
  activeMembers: number;
  pendingApprovals: number;
}

/**
 * 🏛️ Dashboard del Workspace CAM (Consejo de la Administración Municipal)
 * 
 * Funcionalidades específicas:
 * - Vista de documentos administrativos municipales
 * - Gestión de actas y acuerdos del CAM
 * - Control de acceso según permisos de rol
 * - Estadísticas de uso y actividad
 * 
 * Reglas de visibilidad implementadas:
 * - 👑 Administradores: Ven todos los documentos del workspace
 * - 🏛️ Presidente y Vicepresidente: Ven todos los documentos del workspace
 * - 🏢 Intendente y Secretario CAM: Ven todos los documentos del workspace
 * - 👥 Otros roles: Solo ven sus propios documentos subidos (usa /my-documents)
 */
export function CAMDashboard() {
  const { user, hasRole, hasAnyRole, hasPermission } = useAuth();
  
  // 🎯 Estado local para UI
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // 🔐 Verificar permisos del usuario
  const isAdmin = hasRole('administrador');
  const canUpload = hasPermission('manage', 'cam') || hasAnyRole(['administrador', 'presidente', 'vicepresidente', 'intendente', 'secretario_cam']);
  const canArchiveOthers = hasAnyRole(['administrador', 'presidente', 'intendente']);
  const canManage = hasPermission('manage', 'cam');
  const canSeeAllDocuments = isAdmin || hasAnyRole(['presidente', 'vicepresidente', 'intendente', 'secretario_cam']);

  // 🪝 Hook para documentos - usa automáticamente /my-documents cuando corresponde
  const {
    documents,
    isLoading,
    error,
    stats,
    uploadDocument,
    downloadDocument,
    archiveDocument,
    restoreDocument,
    deleteDocument,
    updateFilters,
    changePage,
    currentPage,
    totalPages
  } = useDocuments({ 
    autoLoad: true,
    // 🔒 Si es usuario normal, solo sus documentos (usa /my-documents)
    // 🏛️ Si es admin/intendente/secretario_cam, todos los documentos del workspace
    ...(canSeeAllDocuments 
      ? { workspace: ['cam'] } 
      : { createdBy: user?.id ? [user.id] : [], workspace: ['cam'] }
    )
  });

  // ✅ Debug para verificar permisos (optimizado)
  useEffect(() => {
    console.log('🔍 CAM Documents Debug:', {
      userRole: user?.role,
      userId: user?.id,
      canSeeAllDocuments,
      totalDocuments: documents.length,
      isLoading,
      usingMyDocuments: !canSeeAllDocuments
    });
  }, [user?.role, user?.id, canSeeAllDocuments, documents.length, isLoading]);

  // 📊 Estadísticas simuladas de CAM
  const [camStats] = useState<CAMStats>({
    totalDocuments: documents.length,
    recentMeetings: 3,
    totalDownloads: 189,
    activeMembers: 12,
    pendingApprovals: 2
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
      console.log('📤 Documents uploaded to CAM:', backendDocuments);
      console.log('✅ Documents successfully uploaded to CAM workspace');
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
    if (confirm('¿Estás seguro de que quieres eliminar este documento de CAM?')) {
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
      {/* 📊 Header con estadísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            CAM
          </h1>
          <p className="text-muted-foreground">
            {canSeeAllDocuments ? 'Consejo de la Administración Municipal' : 'Mis documentos de CAM'} • 
            <Badge variant="outline" className="ml-2">{user?.role}</Badge>
          </p>
        </div>
        
        {canUpload && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Subir Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto document-upload-dialog">
              <DialogHeader>
                <DialogTitle>Subir Documento a CAM</DialogTitle>
                <DialogDescription>
                  Arrastra archivos o haz clic para seleccionar. Soporta múltiples archivos.
                </DialogDescription>
              </DialogHeader>
              <DocumentUpload 
                onUpload={handleUpload}
                allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'png']}
                maxFileSize={50}
                multiple={true}
                defaultWorkspace="cam"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>



      {/* 📄 Lista de documentos con tabs */}
      <Card>
        <CardHeader>
          <CardTitle>
            {canSeeAllDocuments ? 'Documentos de CAM' : 'Mis Documentos'}
          </CardTitle>
          <CardDescription>
            {canSeeAllDocuments 
              ? 'Gestiona todos los documentos del Consejo de la Administración Municipal'
              : 'Gestiona tus documentos personales de CAM'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 🎯 Tabs para categorizar documentos */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos ({tabStats.all})</TabsTrigger>
              <TabsTrigger value="drafts">Borradores ({tabStats.drafts})</TabsTrigger>
              <TabsTrigger value="stored">Almacenados ({tabStats.stored})</TabsTrigger>
              <TabsTrigger value="archived">Archivados ({tabStats.archived})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* 📋 Lista de documentos */}
              <div className="min-h-[400px]">
                {filteredDocuments.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'all' 
                        ? 'Aún no hay documentos. ¡Comienza subiendo tu primer archivo!' 
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
                      // Mantenemos compatibilidad pero sin filtros UI
                      const correctedFilters = {
                        ...newFilters,
                        workspace: newFilters.workspace?.map(w => w as WorkspaceType)
                      };
                      await updateFilters(correctedFilters);
                    }}
                    onView={handleView}
                    onDownload={handleDownload}
                    onArchive={handleArchive}
                    onRestore={handleRestore}
                    onDeleteSuccess={(documentId) => {
                      console.log('Document deleted successfully:', documentId);
                    }}
                    onDeleteError={(error) => {
                      console.error('Error deleting document:', error);
                    }}
                    onEdit={handleEdit}
                    onShare={handleShare}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={20}
                    totalItems={filteredDocuments.length}
                    onPageChange={changePage}
                    defaultLayout="grid"
                    showFilters={false}
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
