import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Users, 
  GitBranch,
  Download,
  CheckSquare
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
  DocumentFilters,
  DocumentStatusStats,
  type DocumentFiltersType
} from '@/components/documents';

import { useAuth } from '@/hooks/useAuth';
import type { BackendDocument } from '@/hooks/useBackendDocuments';

// 🎯 Tipos específicos para Comisiones CF
interface ComisionesStats {
  totalDocuments: number;
  activeCommissions: number;
  totalDownloads: number;
  activeMembers: number;
  pendingReports: number;
}

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
  createdByUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  createdAt: string;
  storedAt?: string;
  archivedAt?: string;
  fileUrl: string;
}

// 📊 Mock data específico de Comisiones CF
const mockComisionesDocuments: Document[] = [
  {
    id: 'cf-1',
    title: 'Informe CF1 - Educación y Cultura',
    description: 'Informe mensual de la Comisión de Educación y Cultura',
    fileName: 'informe-cf1-educacion-enero-2025.pdf',
    fileSize: 1792000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'comisiones_cf',
    tags: ['informe', 'cf1', 'educación', 'cultura'],
    createdBy: 'coordinador-cf1-user',
    createdByUser: {
      id: 'coordinador-cf1-user',
      fullName: 'María González',
      email: 'maria.gonzalez@cf1.gob.cu',
      role: 'cf_member'
    },
    createdAt: '2025-01-28T15:30:00Z',
    storedAt: '2025-01-28T16:00:00Z',
    fileUrl: '/uploads/comisiones_cf/informe-cf1-educacion-enero-2025.pdf'
  },
  {
    id: 'cf-2',
    title: 'Propuesta CF3 - Medio Ambiente',
    description: 'Propuesta de mejoras ambientales para el municipio',
    fileName: 'propuesta-cf3-medio-ambiente.pdf',
    fileSize: 2048000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'comisiones_cf',
    tags: ['propuesta', 'cf3', 'medio ambiente'],
    createdBy: 'coordinador-cf3-user',
    createdByUser: {
      id: 'coordinador-cf3-user',
      fullName: 'Carlos Pérez',
      email: 'carlos.perez@cf3.gob.cu',
      role: 'cf_member'
    },
    createdAt: '2025-01-25T11:20:00Z',
    storedAt: '2025-01-25T12:00:00Z',
    fileUrl: '/uploads/comisiones_cf/propuesta-cf3-medio-ambiente.pdf'
  },
  {
    id: 'cf-3',
    title: 'Borrador - Acta CF5 Deportes',
    description: 'Borrador del acta de la reunión de la Comisión de Deportes',
    fileName: 'borrador-acta-cf5-deportes.docx',
    fileSize: 512000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    status: 'draft',
    workspace: 'comisiones_cf',
    tags: ['borrador', 'acta', 'cf5', 'deportes'],
    createdBy: 'current-user',
    createdByUser: {
      id: 'current-user',
      fullName: 'Jonathan Rodriguez',
      email: 'jonathan.rodriguez@cf5.gob.cu',
      role: 'cf_member'
    },
    createdAt: '2025-01-30T09:15:00Z',
    fileUrl: '/uploads/comisiones_cf/borrador-acta-cf5-deportes.docx'
  },
  {
    id: 'cf-4',
    title: 'Dictamen CF2 - Salud Pública',
    description: 'Dictamen sobre mejoras en el sistema de salud municipal',
    fileName: 'dictamen-cf2-salud-publica.pdf',
    fileSize: 1536000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'comisiones_cf',
    tags: ['dictamen', 'cf2', 'salud', 'pública'],
    createdBy: 'medico-user',
    createdByUser: {
      id: 'medico-user',
      fullName: 'Dr. Antonio Silva',
      email: 'antonio.silva@cf2.gob.cu',
      role: 'cf_member'
    },
    createdAt: '2025-01-22T14:45:00Z',
    storedAt: '2025-01-22T15:30:00Z',
    fileUrl: '/uploads/comisiones_cf/dictamen-cf2-salud-publica.pdf'
  },
  {
    id: 'cf-5',
    title: 'Memoria CF4 - Servicios Públicos 2023',
    description: 'Memoria anual de la Comisión de Servicios Públicos',
    fileName: 'memoria-cf4-servicios-2023.pdf',
    fileSize: 3840000,
    mimeType: 'application/pdf',
    status: 'archived',
    workspace: 'comisiones_cf',
    tags: ['memoria', 'cf4', 'servicios', 'públicos'],
    createdBy: 'ingeniero-user',
    createdByUser: {
      id: 'ingeniero-user',
      fullName: 'Ing. Laura Díaz',
      email: 'laura.diaz@cf4.gob.cu',
      role: 'cf_member'
    },
    createdAt: '2023-12-20T16:00:00Z',
    storedAt: '2023-12-20T17:00:00Z',
    archivedAt: '2025-01-10T09:00:00Z',
    fileUrl: '/uploads/comisiones_cf/memoria-cf4-servicios-2023.pdf'
  }
];

const mockComisionesStats: ComisionesStats = {
  totalDocuments: 5,
  activeCommissions: 8,
  totalDownloads: 92,
  activeMembers: 32,
  pendingReports: 3
};

/**
 * 🏛️ Dashboard del Workspace Comisiones CF (CF1-CF8)
 * 
 * Funcionalidades específicas:
 * - Gestión de informes de comisiones
 * - Actas y dictámenes especializados
 * - Propuestas y memorias
 * - Control de acceso según permisos de miembros CF
 */
export function ComisionesDashboard() {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(mockComisionesDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockComisionesDocuments);
  const [stats] = useState<ComisionesStats>(mockComisionesStats);
  const [filters, setFilters] = useState<DocumentFiltersType>({});
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // 🎯 Permisos específicos para Comisiones CF usando datos del backend
  const isAdmin = user?.role === 'administrador';
  const canUpload = isAdmin || hasPermission('manage', 'comisiones_cf') || hasPermission('view', 'comisiones_cf');
  const canArchiveOthers = isAdmin || hasPermission('archive', 'comisiones_cf');
  const canManage = isAdmin || hasPermission('manage', 'comisiones_cf');

  // ✅ Debug para verificar permisos
  console.log('🔍 Comisiones CF Permissions Debug:', {
    userRole: user?.role,
    permissions: user?.permissions,
    isAdmin,
    canUpload,
    canArchiveOthers,
    canManage,
    hasViewComisiones: hasPermission('view', 'comisiones_cf'),
    hasManageComisiones: hasPermission('manage', 'comisiones_cf'),
    hasArchiveComisiones: hasPermission('archive', 'comisiones_cf')
  });

  // 🔄 Cargar documentos del workspace Comisiones CF
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const comisionesDocuments = mockComisionesDocuments.filter(doc => 
          doc.workspace === 'comisiones_cf'
        );
        
        setDocuments(comisionesDocuments);
        setFilteredDocuments(comisionesDocuments);
      } catch (error) {
        console.error('Error loading Comisiones documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // 🔍 Aplicar filtros
  useEffect(() => {
    let filtered = [...documents];

    if (activeTab === 'reports') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('informe') || doc.tags?.includes('dictamen')
      );
    } else if (activeTab === 'cf1-cf4') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('cf1') || doc.tags?.includes('cf2') || 
        doc.tags?.includes('cf3') || doc.tags?.includes('cf4')
      );
    } else if (activeTab === 'cf5-cf8') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('cf5') || doc.tags?.includes('cf6') || 
        doc.tags?.includes('cf7') || doc.tags?.includes('cf8')
      );
    } else if (activeTab === 'drafts') {
      filtered = filtered.filter(doc => doc.status === 'draft');
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(doc => doc.status === 'archived');
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.description?.toLowerCase().includes(searchTerm) ||
        doc.fileName.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status?.length) {
      filtered = filtered.filter(doc => filters.status!.includes(doc.status));
    }

    setFilteredDocuments(filtered);
    setCurrentPage(1);
  }, [documents, filters, activeTab]);

  // 🎯 Gestores de eventos
  const handleUpload = async (backendDocuments: BackendDocument[]) => {
    try {
      console.log('📤 Documents uploaded to Comisiones CF:', backendDocuments);
      
      // Convertir BackendDocument a formato local Document
      const newDocs: Document[] = backendDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: doc.status,
        workspace: doc.workspace,
        tags: doc.tags || [],
        createdBy: doc.createdByUser.id,
        createdByUser: doc.createdByUser,
        createdAt: doc.createdAt,
        fileUrl: `/api/documents/${doc.id}/download`
      }));

      setDocuments(prev => [...newDocs, ...prev]);
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
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      console.log('Downloading Comisiones document:', doc.fileName);
      try {
        // 📥 Usar función que extrae nombre correcto del backend
        const { downloadDocumentWithCorrectName } = await import('@/utils/documentUtils');
        await downloadDocumentWithCorrectName(doc.fileUrl, doc.fileName);
      } catch (error) {
        console.error('❌ Error downloading document:', error);
        // Fallback a descarga directa si falla
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = doc.fileName;
        link.click();
      }
    }
  };

  const handleArchive = async (documentId: string) => {
    try {
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'archived' as const, archivedAt: new Date().toISOString() }
          : doc
      ));
    } catch (error) {
      console.error('Error archiving document:', error);
    }
  };

  const handleRestore = async (documentId: string) => {
    try {
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'stored' as const, archivedAt: undefined }
          : doc
      ));
    } catch (error) {
      console.error('Error restoring document:', error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este documento de las Comisiones?')) {
      try {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleEdit = (documentId: string) => {
    console.log('Edit Comisiones document:', documentId);
  };

  const handleShare = (documentId: string) => {
    console.log('Share Comisiones document:', documentId);
  };

  return (
    <div className="space-y-6">
      {/* 📊 Estadísticas de Comisiones CF */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              En Comisiones CF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCommissions}</div>
            <p className="text-xs text-muted-foreground">
              Activas CF1-CF8
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descargas</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Informes</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              Pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📊 Estadísticas de estado */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Documentos - Comisiones CF</CardTitle>
          <CardDescription>
            Distribución por estado de los documentos de las Comisiones de Trabajo CF1-CF8
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentStatusStats 
            stats={{
              draft: documents.filter(d => d.status === 'draft').length,
              stored: documents.filter(d => d.status === 'stored').length,
              archived: documents.filter(d => d.status === 'archived').length
            }}
          />
        </CardContent>
      </Card>

      {/* 📄 Gestión de documentos Comisiones */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Documentos de las Comisiones CF</CardTitle>
              <CardDescription>
                Informes, actas, dictámenes y documentos especializados de las Comisiones CF1-CF8
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto document-upload-dialog">
                  <DialogHeader>
                    <DialogTitle>Subir Documento a Comisiones CF</DialogTitle>
                    <DialogDescription>
                      Sube documentos de las Comisiones de Trabajo especializadas.
                    </DialogDescription>
                  </DialogHeader>
                  <DocumentUpload 
                    onUpload={handleUpload}
                    allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']}
                    maxFileSize={50}
                    multiple={true}
                    defaultWorkspace="comisiones_cf"
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Todos ({filteredDocuments.length})</TabsTrigger>
              <TabsTrigger value="reports">
                Informes ({documents.filter(d => 
                  d.tags?.includes('informe') || d.tags?.includes('dictamen')
                ).length})
              </TabsTrigger>
              <TabsTrigger value="cf1-cf4">
                CF1-CF4 ({documents.filter(d => 
                  d.tags?.includes('cf1') || d.tags?.includes('cf2') || 
                  d.tags?.includes('cf3') || d.tags?.includes('cf4')
                ).length})
              </TabsTrigger>
              <TabsTrigger value="cf5-cf8">
                CF5-CF8 ({documents.filter(d => 
                  d.tags?.includes('cf5') || d.tags?.includes('cf6') || 
                  d.tags?.includes('cf7') || d.tags?.includes('cf8')
                ).length})
              </TabsTrigger>
              <TabsTrigger value="drafts">Borradores ({documents.filter(d => d.status === 'draft').length})</TabsTrigger>
              <TabsTrigger value="archived">Archivados ({documents.filter(d => d.status === 'archived').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <DocumentFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableUsers={[
                  { id: 'coordinador-cf1-user', name: 'María González (Coordinadora CF1)' },
                  { id: 'coordinador-cf3-user', name: 'Carlos Pérez (Coordinador CF3)' },
                  { id: 'medico-user', name: 'Dr. Antonio Silva (CF2)' },
                  { id: 'ingeniero-user', name: 'Ing. Laura Díaz (CF4)' },
                  { id: 'current-user', name: user?.fullName || 'Usuario Actual' }
                ]}
                availableTags={['informe', 'acta', 'dictamen', 'propuesta', 'memoria', 'cf1', 'cf2', 'cf3', 'cf4', 'cf5', 'cf6', 'cf7', 'cf8']}
              />

              <div className="min-h-[400px]">
                {filteredDocuments.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'all' 
                        ? 'No hay documentos en el workspace de Comisiones CF.' 
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
                    filters={filters}
                    onFiltersChange={setFilters}
                    onView={handleView}
                    onDownload={handleDownload}
                    onArchive={canArchiveOthers ? handleArchive : undefined}
                    onRestore={canArchiveOthers ? handleRestore : undefined}
                    onDeleteSuccess={canManage ? (id) => handleDelete(id) : undefined}
                    onDeleteError={canManage ? (error) => console.error('Delete error:', error) : undefined}
                    onEdit={handleEdit}
                    onShare={handleShare}
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredDocuments.length / 20)}
                    pageSize={20}
                    totalItems={filteredDocuments.length}
                    onPageChange={setCurrentPage}
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
