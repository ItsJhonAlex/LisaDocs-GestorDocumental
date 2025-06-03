import { useState, useEffect } from 'react';
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
  DocumentFilters,
  DocumentStatusStats,
  type DocumentFiltersType
} from '@/components/documents';

import { useAuth } from '@/hooks/useAuth';

// 🎯 Tipos específicos para AMPP
interface AMPPStats {
  totalDocuments: number;
  recentAssemblies: number;
  totalDownloads: number;
  activeMembers: number;
  pendingLaws: number;
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

// 📊 Mock data específico de AMPP
const mockAMPPDocuments: Document[] = [
  {
    id: 'ampp-1',
    title: 'Acta Asamblea AMPP - Enero 2024',
    description: 'Acta de la sesión ordinaria de la Asamblea Municipal del Poder Popular',
    fileName: 'acta-ampp-enero-2024.pdf',
    fileSize: 2560000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'ampp',
    tags: ['acta', 'asamblea', 'ordinaria'],
    createdBy: 'secretario-ampp-user',
    createdByName: 'Carmen Vega (Secretaria AMPP)',
    createdAt: '2024-01-25T14:30:00Z',
    storedAt: '2024-01-25T15:00:00Z',
    fileUrl: '/uploads/ampp/acta-ampp-enero-2024.pdf'
  },
  {
    id: 'ampp-2',
    title: 'Proyecto de Ley Municipal 003-2024',
    description: 'Proyecto de ley sobre protección del medio ambiente municipal',
    fileName: 'proyecto-ley-003-2024.pdf',
    fileSize: 1792000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'ampp',
    tags: ['proyecto', 'ley', 'medio ambiente'],
    createdBy: 'diputado-user',
    createdByName: 'Luis Herrera (Diputado)',
    createdAt: '2024-01-22T11:15:00Z',
    storedAt: '2024-01-22T12:00:00Z',
    fileUrl: '/uploads/ampp/proyecto-ley-003-2024.pdf'
  },
  {
    id: 'ampp-3',
    title: 'Borrador - Dictamen Comisión Legal',
    description: 'Borrador del dictamen de la comisión legal sobre nuevas normativas',
    fileName: 'borrador-dictamen-legal.docx',
    fileSize: 684000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    status: 'draft',
    workspace: 'ampp',
    tags: ['borrador', 'dictamen', 'legal'],
    createdBy: 'current-user',
    createdByName: 'Jonathan Rodriguez',
    createdAt: '2024-01-24T16:20:00Z',
    fileUrl: '/uploads/ampp/borrador-dictamen-legal.docx'
  },
  {
    id: 'ampp-4',
    title: 'Resolución AMPP 007-2024',
    description: 'Resolución sobre aprobación del plan de desarrollo urbano',
    fileName: 'resolucion-ampp-007-2024.pdf',
    fileSize: 1280000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'ampp',
    tags: ['resolución', 'desarrollo', 'urbano'],
    createdBy: 'presidente-ampp-user',
    createdByName: 'Sandra López (Presidenta AMPP)',
    createdAt: '2024-01-20T13:45:00Z',
    storedAt: '2024-01-20T14:15:00Z',
    fileUrl: '/uploads/ampp/resolucion-ampp-007-2024.pdf'
  },
  {
    id: 'ampp-5',
    title: 'Informe Legislativo Anual 2023',
    description: 'Informe anual de actividades legislativas de la AMPP',
    fileName: 'informe-legislativo-2023.pdf',
    fileSize: 3584000,
    mimeType: 'application/pdf',
    status: 'archived',
    workspace: 'ampp',
    tags: ['informe', 'legislativo', 'anual'],
    createdBy: 'secretario-ampp-user',
    createdByName: 'Carmen Vega (Secretaria AMPP)',
    createdAt: '2023-12-28T10:00:00Z',
    storedAt: '2023-12-28T11:00:00Z',
    archivedAt: '2024-01-15T09:00:00Z',
    fileUrl: '/uploads/ampp/informe-legislativo-2023.pdf'
  }
];

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
  const { user, hasAnyRole } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(mockAMPPDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockAMPPDocuments);
  const [stats] = useState<AMPPStats>(mockAMPPStats);
  const [filters, setFilters] = useState<DocumentFiltersType>({});
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // 🎯 Permisos específicos para AMPP
  const canUpload = hasAnyRole(['administrador', 'presidente', 'vicepresidente', 'secretario_ampp']);
  const canArchiveOthers = hasAnyRole(['administrador', 'presidente', 'secretario_ampp']);
  const canManage = hasAnyRole(['administrador', 'secretario_ampp']);

  // ✅ Debug para verificar permisos
  console.log('🔍 AMPP Permissions Debug:', {
    userRole: user?.role,
    canUpload,
    canArchiveOthers,
    canManage,
    hasAdminRole: hasAnyRole(['administrador'])
  });

  // 🔄 Cargar documentos del workspace AMPP
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const amppDocuments = mockAMPPDocuments.filter(doc => 
          doc.workspace === 'ampp'
        );
        
        setDocuments(amppDocuments);
        setFilteredDocuments(amppDocuments);
      } catch (error) {
        console.error('Error loading AMPP documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // 🔍 Aplicar filtros
  useEffect(() => {
    let filtered = [...documents];

    if (activeTab === 'assemblies') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('acta') || doc.tags?.includes('asamblea')
      );
    } else if (activeTab === 'laws') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('proyecto') || doc.tags?.includes('ley') || doc.tags?.includes('resolución')
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
      console.log('Uploading files to AMPP:', files);
      
      const newDocs: Document[] = files.map((fileData, index) => ({
        id: `ampp-new-${Date.now()}-${index}`,
        title: fileData.title,
        description: fileData.description,
        fileName: fileData.file.name,
        fileSize: fileData.file.size,
        mimeType: fileData.file.type,
        status: 'draft' as const,
        workspace: 'ampp',
        tags: fileData.tags || [],
        createdBy: 'current-user',
        createdByName: user?.fullName || 'Usuario',
        createdAt: new Date().toISOString(),
        fileUrl: `/uploads/ampp/${fileData.file.name}`
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
      console.log('Downloading AMPP document:', doc.fileName);
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
    if (confirm('¿Estás seguro de que quieres eliminar este documento de la AMPP?')) {
      try {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleEdit = (documentId: string) => {
    console.log('Edit AMPP document:', documentId);
  };

  const handleShare = (documentId: string) => {
    console.log('Share AMPP document:', documentId);
  };

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
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
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
            <div className="text-2xl font-bold">{stats.recentAssemblies}</div>
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
            <CardTitle className="text-sm font-medium">Diputados</CardTitle>
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
            <CardTitle className="text-sm font-medium">Leyes Pendientes</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLaws}</div>
            <p className="text-xs text-muted-foreground">
              En trámite
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📊 Estadísticas de estado */}
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
              draft: documents.filter(d => d.status === 'draft').length,
              stored: documents.filter(d => d.status === 'stored').length,
              archived: documents.filter(d => d.status === 'archived').length
            }}
          />
        </CardContent>
      </Card>

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
              <TabsTrigger value="all">Todos ({filteredDocuments.length})</TabsTrigger>
              <TabsTrigger value="assemblies">
                Asambleas ({documents.filter(d => 
                  d.tags?.includes('acta') || d.tags?.includes('asamblea')
                ).length})
              </TabsTrigger>
              <TabsTrigger value="laws">
                Legislativos ({documents.filter(d => 
                  d.tags?.includes('proyecto') || d.tags?.includes('ley') || d.tags?.includes('resolución')
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
                  { id: 'secretario-ampp-user', name: 'Carmen Vega (Secretaria AMPP)' },
                  { id: 'presidente-ampp-user', name: 'Sandra López (Presidenta AMPP)' },
                  { id: 'diputado-user', name: 'Luis Herrera (Diputado)' },
                  { id: 'current-user', name: user?.fullName || 'Usuario Actual' }
                ]}
                availableTags={['acta', 'asamblea', 'proyecto', 'ley', 'resolución', 'dictamen']}
              />

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
