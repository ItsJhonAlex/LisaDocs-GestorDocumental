import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Users, 
  Download,
  BookOpen,
  CheckCircle
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

// 🎯 Tipos específicos para CAM
interface CAMStats {
  totalDocuments: number;
  recentMeetings: number;
  totalDownloads: number;
  activeMembers: number;
  pendingApprovals: number;
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
  createdByName?: string;
  createdAt: string;
  storedAt?: string;
  archivedAt?: string;
  fileUrl: string;
}

// 📊 Mock data específico de CAM
const mockCAMDocuments: Document[] = [
  {
    id: 'cam-1',
    title: 'Acta Reunión CAM - Enero 2024',
    description: 'Acta de la reunión ordinaria del Consejo de Administración Municipal',
    fileName: 'acta-cam-enero-2024.pdf',
    fileSize: 2048576,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'cam',
    tags: ['acta', 'reunión', 'ordinaria'],
    createdBy: 'secretario-cam-user',
    createdByName: 'Elena Rodríguez (Secretaria CAM)',
    createdAt: '2024-01-15T10:30:00Z',
    storedAt: '2024-01-15T11:00:00Z',
    fileUrl: '/uploads/cam/acta-cam-enero-2024.pdf'
  },
  {
    id: 'cam-2',
    title: 'Informe Presupuestario Q4 2023',
    description: 'Informe detallado del cierre presupuestario del cuarto trimestre',
    fileName: 'informe-presupuesto-q4-2023.xlsx',
    fileSize: 1536000,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    status: 'stored',
    workspace: 'cam',
    tags: ['informe', 'presupuesto', 'financiero'],
    createdBy: 'tesorero-user',
    createdByName: 'Roberto Díaz (Tesorero)',
    createdAt: '2024-01-10T14:20:00Z',
    storedAt: '2024-01-10T15:00:00Z',
    fileUrl: '/uploads/cam/informe-presupuesto-q4-2023.xlsx'
  },
  {
    id: 'cam-3',
    title: 'Borrador - Ordenanza Municipal Tránsito',
    description: 'Borrador de nueva ordenanza para el tránsito municipal',
    fileName: 'borrador-ordenanza-transito.docx',
    fileSize: 512000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    status: 'draft',
    workspace: 'cam',
    tags: ['borrador', 'ordenanza', 'tránsito'],
    createdBy: 'current-user',
    createdByName: 'Jonathan Rodriguez',
    createdAt: '2024-01-20T09:15:00Z',
    fileUrl: '/uploads/cam/borrador-ordenanza-transito.docx'
  },
  {
    id: 'cam-4',
    title: 'Resolución CAM 002-2024',
    description: 'Resolución sobre aprobación de proyectos de infraestructura',
    fileName: 'resolucion-cam-002-2024.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'cam',
    tags: ['resolución', 'infraestructura', 'proyectos'],
    createdBy: 'presidente-cam-user',
    createdByName: 'Miguel Torres (Presidente CAM)',
    createdAt: '2024-01-18T16:30:00Z',
    storedAt: '2024-01-18T17:00:00Z',
    fileUrl: '/uploads/cam/resolucion-cam-002-2024.pdf'
  },
  {
    id: 'cam-5',
    title: 'Memoria Anual CAM 2023',
    description: 'Memoria de actividades del CAM durante el año 2023',
    fileName: 'memoria-anual-cam-2023.pdf',
    fileSize: 3072000,
    mimeType: 'application/pdf',
    status: 'archived',
    workspace: 'cam',
    tags: ['memoria', 'anual', 'actividades'],
    createdBy: 'secretario-cam-user',
    createdByName: 'Elena Rodríguez (Secretaria CAM)',
    createdAt: '2023-12-20T14:20:00Z',
    storedAt: '2023-12-20T15:00:00Z',
    archivedAt: '2024-01-15T10:00:00Z',
    fileUrl: '/uploads/cam/memoria-anual-cam-2023.pdf'
  }
];

const mockCAMStats: CAMStats = {
  totalDocuments: 5,
  recentMeetings: 3,
  totalDownloads: 89,
  activeMembers: 12,
  pendingApprovals: 2
};

/**
 * 🏛️ Dashboard del Workspace CAM (Consejo de Administración Municipal)
 * 
 * Funcionalidades específicas:
 * - Gestión de actas de reuniones
 * - Informes financieros y presupuestarios
 * - Resoluciones y ordenanzas
 * - Control de acceso según permisos de secretario CAM
 */
export function CAMDashboard() {
  const { user, hasAnyRole } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(mockCAMDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockCAMDocuments);
  const [stats] = useState<CAMStats>(mockCAMStats);
  const [filters, setFilters] = useState<DocumentFiltersType>({});
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // 🎯 Permisos específicos para CAM
  const canUpload = hasAnyRole(['administrador', 'presidente', 'secretario_cam']);
  const canArchiveOthers = hasAnyRole(['administrador', 'presidente', 'secretario_cam']);
  const canManage = hasAnyRole(['administrador', 'secretario_cam']);

  // ✅ Debug para verificar permisos
  console.log('🔍 CAM Permissions Debug:', {
    userRole: user?.role,
    canUpload,
    canArchiveOthers,
    canManage,
    hasAdminRole: hasAnyRole(['administrador'])
  });

  // 🔄 Cargar documentos del workspace CAM
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const camDocuments = mockCAMDocuments.filter(doc => 
          doc.workspace === 'cam'
        );
        
        setDocuments(camDocuments);
        setFilteredDocuments(camDocuments);
      } catch (error) {
        console.error('Error loading CAM documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // 🔍 Aplicar filtros
  useEffect(() => {
    let filtered = [...documents];

    if (activeTab === 'meetings') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('acta') || doc.tags?.includes('reunión')
      );
    } else if (activeTab === 'financial') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('presupuesto') || doc.tags?.includes('financiero') || doc.tags?.includes('informe')
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
  const handleUpload = async (files: Array<{
    file: File;
    title: string;
    description?: string;
    workspace: string;
    tags?: string[];
  }>) => {
    try {
      console.log('Uploading files to CAM:', files);
      
      const newDocs: Document[] = files.map((fileData, index) => ({
        id: `cam-new-${Date.now()}-${index}`,
        title: fileData.title,
        description: fileData.description,
        fileName: fileData.file.name,
        fileSize: fileData.file.size,
        mimeType: fileData.file.type,
        status: 'draft' as const,
        workspace: 'cam',
        tags: fileData.tags || [],
        createdBy: 'current-user',
        createdByName: user?.fullName || 'Usuario',
        createdAt: new Date().toISOString(),
        fileUrl: `/uploads/cam/${fileData.file.name}`
      }));

      setDocuments(prev => [...newDocs, ...prev]);
      setIsUploadOpen(false);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleView = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      setSelectedDocument(doc);
      setIsViewerOpen(true);
    }
  };

  const handleDownload = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      console.log('Downloading CAM document:', doc.fileName);
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      link.click();
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
    if (confirm('¿Estás seguro de que quieres eliminar este documento del CAM?')) {
      try {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleEdit = (documentId: string) => {
    console.log('Edit CAM document:', documentId);
  };

  const handleShare = (documentId: string) => {
    console.log('Share CAM document:', documentId);
  };

  return (
    <div className="space-y-6">
      {/* 📊 Estadísticas del CAM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              En CAM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reuniones</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentMeetings}</div>
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
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Por aprobar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📊 Estadísticas de estado */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Documentos - CAM</CardTitle>
          <CardDescription>
            Distribución por estado de los documentos del Consejo de Administración Municipal
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

      {/* 📄 Gestión de documentos CAM */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Documentos del CAM</CardTitle>
              <CardDescription>
                Actas, resoluciones, informes y documentos del Consejo de Administración Municipal
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
                    <DialogTitle>Subir Documento al CAM</DialogTitle>
                    <DialogDescription>
                      Sube documentos del Consejo de Administración Municipal.
                    </DialogDescription>
                  </DialogHeader>
                  <DocumentUpload 
                    onUpload={handleUpload}
                    allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']}
                    maxFileSize={50}
                    multiple={true}
                    defaultWorkspace="cam"
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todos ({filteredDocuments.length})</TabsTrigger>
              <TabsTrigger value="meetings">
                Reuniones ({documents.filter(d => 
                  d.tags?.includes('acta') || d.tags?.includes('reunión')
                ).length})
              </TabsTrigger>
              <TabsTrigger value="financial">
                Financieros ({documents.filter(d => 
                  d.tags?.includes('presupuesto') || d.tags?.includes('financiero') || d.tags?.includes('informe')
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
                  { id: 'secretario-cam-user', name: 'Elena Rodríguez (Secretaria CAM)' },
                  { id: 'presidente-cam-user', name: 'Miguel Torres (Presidente CAM)' },
                  { id: 'tesorero-user', name: 'Roberto Díaz (Tesorero)' },
                  { id: 'current-user', name: user?.fullName || 'Usuario Actual' }
                ]}
                availableTags={['acta', 'reunión', 'informe', 'presupuesto', 'resolución', 'ordenanza']}
              />

              <div className="min-h-[400px]">
                {filteredDocuments.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'all' 
                        ? 'No hay documentos en el workspace del CAM.' 
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
                    onDelete={canManage ? handleDelete : undefined}
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
