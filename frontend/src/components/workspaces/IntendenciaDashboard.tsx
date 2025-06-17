import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Building,
  Download,
  Briefcase,
  MapPin
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

import { useAuth } from '@/hooks/useAuth';
import type { BackendDocument } from '@/hooks/useBackendDocuments';
import { downloadDocumentWithCorrectName } from '@/utils/documentUtils';

// 🎯 Tipos específicos para Intendencia
interface IntendenciaStats {
  totalDocuments: number;
  administrativeActions: number;
  totalDownloads: number;
  activeDepartments: number;
  pendingPermits: number;
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

// 📊 Mock data específico de Intendencia
const mockIntendenciaDocuments: Document[] = [
  {
    id: 'int-1',
    title: 'Plan de Desarrollo Urbano 2025',
    description: 'Plan estratégico de desarrollo urbano para el municipio',
    fileName: 'plan-desarrollo-urbano-2025.pdf',
    fileSize: 4096000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'intendencia',
    tags: ['plan', 'desarrollo', 'urbano'],
    createdBy: 'intendente-user',
    createdByUser: {
      id: 'intendente-user',
      fullName: 'Roberto Castro (Intendente)',
      email: 'intendente@lisadocs.gob.cu',
      role: 'intendente'
    },
    createdAt: '2025-01-18T11:30:00Z',
    storedAt: '2025-01-18T12:00:00Z',
    fileUrl: '/uploads/intendencia/plan-desarrollo-urbano-2025.pdf'
  },
  {
    id: 'int-2',
    title: 'Informe de Gestión Municipal - Enero',
    description: 'Informe mensual de las actividades de gestión municipal',
    fileName: 'informe-gestion-enero-2025.pdf',
    fileSize: 1856000,
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'intendencia',
    tags: ['informe', 'gestión', 'mensual'],
    createdBy: 'coordinador-user',
    createdByUser: {
      id: 'coordinador-user',
      fullName: 'Patricia Morales (Coordinadora)',
      email: 'coordinadora@lisadocs.gob.cu',
      role: 'coordinador'
    },
    createdAt: '2025-01-30T16:45:00Z',
    storedAt: '2025-01-30T17:15:00Z',
    fileUrl: '/uploads/intendencia/informe-gestion-enero-2025.pdf'
  },
  {
    id: 'int-3',
    title: 'Borrador - Propuesta Mejoras Vialidad',
    description: 'Propuesta de mejoras en la infraestructura vial del municipio',
    fileName: 'borrador-mejoras-vialidad.docx',
    fileSize: 892000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    status: 'draft',
    workspace: 'intendencia',
    tags: ['borrador', 'vialidad', 'infraestructura'],
    createdBy: 'current-user',
    createdByUser: {
      id: 'current-user',
      fullName: 'Jonathan Rodriguez',
      email: 'jonathan@lisadocs.gob.cu',
      role: 'administrador'
    },
    createdAt: '2025-01-25T14:20:00Z',
    fileUrl: '/uploads/intendencia/borrador-mejoras-vialidad.docx'
  },
  {
    id: 'int-4',
    title: 'Registro de Permisos de Construcción',
    description: 'Registro de permisos otorgados para construcciones municipales',
    fileName: 'registro-permisos-construccion.xlsx',
    fileSize: 1152000,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    status: 'stored',
    workspace: 'intendencia',
    tags: ['permisos', 'construcción', 'registro'],
    createdBy: 'arquitecto-user',
    createdByUser: {
      id: 'arquitecto-user',
      fullName: 'Fernando Ruiz (Arquitecto Municipal)',
      email: 'arquitecto@lisadocs.gob.cu',
      role: 'arquitecto'
    },
    createdAt: '2025-01-22T10:30:00Z',
    storedAt: '2025-01-22T11:00:00Z',
    fileUrl: '/uploads/intendencia/registro-permisos-construccion.xlsx'
  },
  {
    id: 'int-5',
    title: 'Memoria Anual Intendencia 2023',
    description: 'Memoria de actividades de la intendencia durante 2023',
    fileName: 'memoria-anual-intendencia-2023.pdf',
    fileSize: 5120000,
    mimeType: 'application/pdf',
    status: 'archived',
    workspace: 'intendencia',
    tags: ['memoria', 'anual', 'actividades'],
    createdBy: 'intendente-user',
    createdByUser: {
      id: 'intendente-user',
      fullName: 'Roberto Castro (Intendente)',
      email: 'intendente@lisadocs.gob.cu',
      role: 'intendente'
    },
    createdAt: '2023-12-30T15:00:00Z',
    storedAt: '2023-12-30T16:00:00Z',
    archivedAt: '2025-01-15T08:00:00Z',
    fileUrl: '/uploads/intendencia/memoria-anual-intendencia-2023.pdf'
  }
];

const mockIntendenciaStats: IntendenciaStats = {
  totalDocuments: 5,
  administrativeActions: 8,
  totalDownloads: 67,
  activeDepartments: 6,
  pendingPermits: 4
};

/**
 * 🏛️ Dashboard del Workspace Intendencia
 * 
 * Funcionalidades específicas:
 * - Gestión de planes de desarrollo
 * - Informes de gestión municipal
 * - Permisos y licencias
 * - Control de acceso según permisos de intendente
 */
export function IntendenciaDashboard() {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(mockIntendenciaDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockIntendenciaDocuments);
  const [stats] = useState<IntendenciaStats>(mockIntendenciaStats);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // 🎯 Permisos específicos para Intendencia usando datos del backend
  const isAdmin = user?.role === 'administrador';
  const canUpload = isAdmin || hasPermission('manage', 'intendencia') || hasPermission('view', 'intendencia');
  const canArchiveOthers = isAdmin || hasPermission('archive', 'intendencia');
  const canManage = isAdmin || hasPermission('manage', 'intendencia');

  // ✅ Debug para verificar permisos
  console.log('🔍 Intendencia Permissions Debug:', {
    userRole: user?.role,
    permissions: user?.permissions,
    isAdmin,
    canUpload,
    canArchiveOthers,
    canManage,
    hasViewIntendencia: hasPermission('view', 'intendencia'),
    hasManageIntendencia: hasPermission('manage', 'intendencia'),
    hasArchiveIntendencia: hasPermission('archive', 'intendencia')
  });

  // 🔄 Cargar documentos del workspace Intendencia
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        // 📡 Llamada real al backend
        const response = await fetch('/api/documents?workspace=intendencia', {
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
        const intendenciaDocuments: Document[] = backendDocuments.map(doc => ({
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
        
        setDocuments(intendenciaDocuments);
        setFilteredDocuments(intendenciaDocuments);
      } catch (error) {
        console.error('Error loading intendencia documents:', error);
        // 🔄 Fallback a documentos mock en caso de error
        const intendenciaDocuments = mockIntendenciaDocuments.filter(doc => 
          doc.workspace === 'intendencia'
        );
        setDocuments(intendenciaDocuments);
        setFilteredDocuments(intendenciaDocuments);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // 🔍 Aplicar filtros por tab (sin filtros UI)
  useEffect(() => {
    let filtered = [...documents];

    if (activeTab === 'plans') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('plan') || doc.tags?.includes('desarrollo')
      );
    } else if (activeTab === 'permits') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('permisos') || doc.tags?.includes('construcción') || doc.tags?.includes('licencias')
      );
    } else if (activeTab === 'reports') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('informe') || doc.tags?.includes('gestión')
      );
    } else if (activeTab === 'drafts') {
      filtered = filtered.filter(doc => doc.status === 'draft');
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(doc => doc.status === 'archived');
    }

    setFilteredDocuments(filtered);
    setCurrentPage(1);
  }, [documents, activeTab]);

  // 🎯 Gestores de eventos
  const handleUpload = async (backendDocuments: BackendDocument[]) => {
    try {
      console.log('📤 Documents uploaded to Intendencia:', backendDocuments);
      
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
        fileUrl: `/api/documents/${doc.id}/download` // URL del backend
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
      console.log('Downloading Intendencia document:', doc.fileName);
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



  const handleEdit = (documentId: string) => {
    console.log('Edit Intendencia document:', documentId);
  };

  const handleShare = (documentId: string) => {
    console.log('Share Intendencia document:', documentId);
  };

  return (
    <div className="space-y-6">


      {/* 📄 Gestión de documentos Intendencia */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Documentos de Intendencia</CardTitle>
              <CardDescription>
                Planes de desarrollo, informes de gestión, permisos y documentos administrativos
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
                    <DialogTitle>Subir Documento a Intendencia</DialogTitle>
                    <DialogDescription>
                      Sube documentos administrativos y de gestión municipal.
                    </DialogDescription>
                  </DialogHeader>
                  <DocumentUpload 
                    onUpload={handleUpload}
                    allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']}
                    maxFileSize={50}
                    multiple={true}
                    defaultWorkspace="intendencia"
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
              <TabsTrigger value="plans">
                Planes ({documents.filter(d => 
                  d.tags?.includes('plan') || d.tags?.includes('desarrollo')
                ).length})
              </TabsTrigger>
              <TabsTrigger value="permits">
                Permisos ({documents.filter(d => 
                  d.tags?.includes('permisos') || d.tags?.includes('construcción')
                ).length})
              </TabsTrigger>
              <TabsTrigger value="reports">
                Informes ({documents.filter(d => 
                  d.tags?.includes('informe') || d.tags?.includes('gestión')
                ).length})
              </TabsTrigger>
              <TabsTrigger value="drafts">Borradores ({documents.filter(d => d.status === 'draft').length})</TabsTrigger>
              <TabsTrigger value="archived">Archivados ({documents.filter(d => d.status === 'archived').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="min-h-[400px]">
                {filteredDocuments.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'all' 
                        ? 'No hay documentos en el workspace de Intendencia.' 
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
                    filters={{}}
                    onFiltersChange={() => {
                      // Sin filtros UI - función vacía para compatibilidad
                    }}
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
