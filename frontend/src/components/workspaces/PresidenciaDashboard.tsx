import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Users, 
  TrendingUp,
  Calendar,
  Download
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
import { downloadDocumentWithCorrectName } from '@/utils/documentUtils';

// 🎯 Tipos específicos para Presidencia
interface PresidenciaStats {
  totalDocuments: number;
  recentUploads: number;
  totalDownloads: number;
  activeUsers: number;
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

// 📊 Mock data específico de Presidencia
const mockPresidenciaDocuments: Document[] = [
  {
    id: 'pres-1',
    title: 'Decreto Municipal 001-2025',
    description: 'Decreto sobre nuevas políticas administrativas municipales',
    fileName: 'decreto-municipal-001-2025.pdf',
    fileSize: 1536000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'presidencia',
    tags: ['decreto', 'políticas', 'administración'],
    createdBy: 'presidente-user',
    createdByUser: {
      id: 'presidente-user',
      fullName: 'Carlos Mendoza (Presidente)',
      email: 'presidente@lisadocs.gob.cu',
      role: 'presidente'
    },
    createdAt: '2025-01-20T14:30:00Z',
    storedAt: '2025-01-20T15:00:00Z',
    fileUrl: '/uploads/presidencia/decreto-municipal-001-2025.pdf'
  },
  {
    id: 'pres-2',
    title: 'Comunicado Oficial - Nuevas Medidas',
    description: 'Comunicado oficial sobre las nuevas medidas implementadas',
    fileName: 'comunicado-nuevas-medidas.pdf',
    fileSize: 512000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'presidencia',
    tags: ['comunicado', 'medidas', 'oficial'],
    createdBy: 'secretario-user',
    createdByUser: {
      id: 'secretario-user',
      fullName: 'Ana López (Secretaria)',
      email: 'secretaria@lisadocs.gob.cu',
      role: 'secretario_cam'
    },
    createdAt: '2025-01-18T10:15:00Z',
    storedAt: '2025-01-18T11:00:00Z',
    fileUrl: '/uploads/presidencia/comunicado-nuevas-medidas.pdf'
  },
  {
    id: 'pres-3',
    title: 'Informe Semanal de Gestión',
    description: 'Informe semanal de las actividades realizadas en presidencia',
    fileName: 'informe-semanal-gestión.docx',
    fileSize: 768000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    status: 'draft',
    workspace: 'presidencia',
    tags: ['informe', 'semanal', 'gestión'],
    createdBy: 'current-user',
    createdByUser: {
      id: 'current-user',
      fullName: 'Jonathan Rodriguez',
      email: 'jonathan@lisadocs.gob.cu',
      role: 'administrador'
    },
    createdAt: '2025-01-22T09:00:00Z',
    fileUrl: '/uploads/presidencia/informe-semanal-gestión.docx'
  },
  {
    id: 'pres-4',
    title: 'Resolución Administrativa 005-2025',
    description: 'Resolución sobre modificaciones en el organigrama municipal',
    fileName: 'resolucion-admin-005-2025.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'presidencia',
    tags: ['resolución', 'organigrama', 'administrativa'],
    createdBy: 'vicepresidente-user',
    createdByUser: {
      id: 'vicepresidente-user',
      fullName: 'María García (Vicepresidenta)',
      email: 'vicepresidenta@lisadocs.gob.cu',
      role: 'vicepresidente'
    },
    createdAt: '2025-01-15T16:45:00Z',
    storedAt: '2025-01-15T17:00:00Z',
    fileUrl: '/uploads/presidencia/resolucion-admin-005-2025.pdf'
  },
  {
    id: 'pres-5',
    title: 'Acta Reunión Presidencia - Enero',
    description: 'Acta de la reunión mensual de presidencia',
    fileName: 'acta-reunion-presidencia-enero.pdf',
    fileSize: 2048000,
    mimeType: 'application/pdf',
    status: 'archived',
    workspace: 'presidencia',
    tags: ['acta', 'reunión', 'mensual'],
    createdBy: 'presidente-user',
    createdByUser: {
      id: 'presidente-user',
      fullName: 'Carlos Mendoza (Presidente)',
      email: 'presidente@lisadocs.gob.cu',
      role: 'presidente'
    },
    createdAt: '2025-01-05T14:00:00Z',
    storedAt: '2025-01-05T15:00:00Z',
    archivedAt: '2025-01-20T10:00:00Z',
    fileUrl: '/uploads/presidencia/acta-reunion-presidencia-enero.pdf'
  }
];

const mockPresidenciaStats: PresidenciaStats = {
  totalDocuments: 5,
  recentUploads: 2,
  totalDownloads: 156,
  activeUsers: 8,
  pendingApprovals: 1
};

/**
 * 🏛️ Dashboard del Workspace de Presidencia
 * 
 * Funcionalidades específicas:
 * - Vista de documentos oficiales y comunicados
 * - Gestión de decretos y resoluciones
 * - Control de acceso según permisos de rol
 * - Estadísticas de uso y actividad
 */
export function PresidenciaDashboard() {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(mockPresidenciaDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockPresidenciaDocuments);
  const [stats] = useState<PresidenciaStats>(mockPresidenciaStats);
  const [filters, setFilters] = useState<DocumentFiltersType>({});
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // 🎯 Permisos específicos para Presidencia usando datos del backend
  const isAdmin = user?.role === 'administrador';
  const canUpload = isAdmin || hasPermission('manage', 'presidencia') || hasPermission('view', 'presidencia');
  const canArchiveOthers = isAdmin || hasPermission('archive', 'presidencia');
  const canManage = isAdmin || hasPermission('manage', 'presidencia');

  // ✅ Debug para verificar permisos
  console.log('🔍 Presidencia Permissions Debug:', {
    userRole: user?.role,
    permissions: user?.permissions,
    isAdmin,
    canUpload,
    canArchiveOthers,
    canManage,
    hasViewPresidencia: hasPermission('view', 'presidencia'),
    hasManagePresidencia: hasPermission('manage', 'presidencia'),
    hasArchivePresidencia: hasPermission('archive', 'presidencia')
  });

  // 🔄 Cargar documentos del workspace Presidencia
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        // 📡 Llamada real al backend
        const response = await fetch('/api/documents?workspace=presidencia', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar documentos');
        }

        const result = await response.json();
        const backendDocuments: BackendDocument[] = result.data.documents;

        // Convertir BackendDocument a formato local Document
        const presidenciaDocuments: Document[] = backendDocuments.map(doc => ({
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
        
        setDocuments(presidenciaDocuments);
        setFilteredDocuments(presidenciaDocuments);
      } catch (error) {
        console.error('Error loading presidencia documents:', error);
        // 🔄 Fallback a documentos mock en caso de error
        const presidenciaDocuments = mockPresidenciaDocuments.filter(doc => 
          doc.workspace === 'presidencia'
        );
        setDocuments(presidenciaDocuments);
        setFilteredDocuments(presidenciaDocuments);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // 🔍 Aplicar filtros
  useEffect(() => {
    let filtered = [...documents];

    // Filtro por tab activo
    if (activeTab === 'drafts') {
      filtered = filtered.filter(doc => doc.status === 'draft');
    } else if (activeTab === 'official') {
      filtered = filtered.filter(doc => 
        doc.status === 'stored' && 
        (doc.tags?.includes('decreto') || doc.tags?.includes('resolución') || doc.tags?.includes('comunicado'))
      );
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(doc => doc.status === 'archived');
    }

    // Aplicar filtros adicionales
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
      console.log('📤 Documents uploaded to Presidencia:', backendDocuments);
      
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
    if (!doc) return;

    try {
      console.log('Downloading Presidencia document:', doc.fileName);
      await downloadDocumentWithCorrectName(doc.fileUrl, doc.fileName);
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      // TODO: Mostrar toast de error al usuario
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
    if (confirm('¿Estás seguro de que quieres eliminar este documento de Presidencia?')) {
      try {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleEdit = (documentId: string) => {
    console.log('Edit Presidencia document:', documentId);
  };

  const handleShare = (documentId: string) => {
    console.log('Share Presidencia document:', documentId);
  };

  return (
    <div className="space-y-6">
      {/* 📊 Estadísticas de estado */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Documentos - Presidencia</CardTitle>
          <CardDescription>
            Distribución por estado de los documentos de presidencia
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

      {/* 📄 Gestión de documentos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Documentos de Presidencia</CardTitle>
              <CardDescription>
                Gestión centralizada de documentos oficiales y comunicaciones
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
                    <DialogTitle>Subir Documento a Presidencia</DialogTitle>
                    <DialogDescription>
                      Sube documentos oficiales que serán visibles según los permisos de cada rol.
                    </DialogDescription>
                  </DialogHeader>
                  <DocumentUpload 
                    onUpload={handleUpload}
                    allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']}
                    maxFileSize={50}
                    multiple={true}
                    defaultWorkspace="presidencia"
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos ({filteredDocuments.length})</TabsTrigger>
              <TabsTrigger value="official">
                Oficiales ({documents.filter(d => 
                  d.status === 'stored' && 
                  (d.tags?.includes('decreto') || d.tags?.includes('resolución') || d.tags?.includes('comunicado'))
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
                  { id: 'presidente-user', name: 'Carlos Mendoza (Presidente)' },
                  { id: 'vicepresidente-user', name: 'María García (Vicepresidenta)' },
                  { id: 'secretario-user', name: 'Ana López (Secretaria)' },
                  { id: 'current-user', name: user?.fullName || 'Usuario Actual' }
                ]}
                availableTags={['decreto', 'resolución', 'comunicado', 'informe', 'acta', 'políticas']}
              />

              <div className="min-h-[400px]">
                {filteredDocuments.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'all' 
                        ? 'No hay documentos en el workspace de Presidencia.' 
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
                    onDeleteSuccess={(documentId) => {
                      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
                    }}
                    onDeleteError={(error) => {
                      console.error('Error deleting document:', error);
                    }}
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
