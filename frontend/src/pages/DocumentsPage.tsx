import { useState, useEffect } from 'react';
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
  DocumentFilters,
  DocumentStatusStats,
  type DocumentFiltersType
} from '@/components/documents';

import { useAuth } from '@/hooks/useAuth';

// 🎯 Tipos para el dashboard
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

// 📊 Mock data - en producción vendría del backend
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Acta Reunión CAM - Enero 2024',
    description: 'Acta de la reunión ordinaria del Consejo de Administración Municipal',
    fileName: 'acta-cam-enero-2024.pdf',
    fileSize: 2048576, // 2MB
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'presidencia',
    tags: ['acta', 'reunión', 'ordinaria'],
    createdBy: 'current-user',
    createdByName: 'Jonathan Rodriguez',
    createdAt: '2024-01-15T10:30:00Z',
    storedAt: '2024-01-15T11:00:00Z',
    fileUrl: '/uploads/cam/acta-cam-enero-2024.pdf'
  },
  {
    id: '2',
    title: 'Informe Presupuestario Q4 2023',
    description: 'Informe detallado del cierre presupuestario del cuarto trimestre',
    fileName: 'informe-presupuesto-q4-2023.xlsx',
    fileSize: 1536000, // 1.5MB
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    status: 'stored',
    workspace: 'presidencia',
    tags: ['informe', 'presupuesto', 'financiero'],
    createdBy: 'current-user',
    createdByName: 'Jonathan Rodriguez',
    createdAt: '2024-01-10T14:20:00Z',
    storedAt: '2024-01-10T15:00:00Z',
    fileUrl: '/uploads/presidencia/informe-presupuesto-q4-2023.xlsx'
  },
  {
    id: '3',
    title: 'Borrador - Propuesta Nueva Ordenanza',
    description: 'Borrador de propuesta para nueva ordenanza municipal',
    fileName: 'borrador-ordenanza-2024.docx',
    fileSize: 512000, // 500KB
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    status: 'draft',
    workspace: 'presidencia',
    tags: ['borrador', 'ordenanza', 'propuesta'],
    createdBy: 'current-user',
    createdByName: 'Jonathan Rodriguez',
    createdAt: '2024-01-20T09:15:00Z',
    fileUrl: '/uploads/presidencia/borrador-ordenanza-2024.docx'
  },
  {
    id: '4',
    title: 'Resolución Municipal 001-2024',
    description: 'Resolución sobre nuevas políticas administrativas',
    fileName: 'resolucion-001-2024.pdf',
    fileSize: 1024000, // 1MB
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: 'presidencia',
    tags: ['resolución', 'políticas', 'administración'],
    createdBy: 'current-user',
    createdByName: 'Jonathan Rodriguez',
    createdAt: '2024-01-18T16:30:00Z',
    storedAt: '2024-01-18T17:00:00Z',
    fileUrl: '/uploads/presidencia/resolucion-001-2024.pdf'
  },
  {
    id: '5',
    title: 'Acta Asamblea General Diciembre 2023',
    description: 'Acta de la asamblea general de fin de año',
    fileName: 'acta-asamblea-dic-2023.pdf',
    fileSize: 3072000, // 3MB
    mimeType: 'application/pdf',
    status: 'archived',
    workspace: 'presidencia',
    tags: ['acta', 'asamblea', 'general'],
    createdBy: 'current-user',
    createdByName: 'Jonathan Rodriguez',
    createdAt: '2023-12-20T14:20:00Z',
    storedAt: '2023-12-20T15:00:00Z',
    archivedAt: '2024-01-15T10:00:00Z',
    fileUrl: '/uploads/presidencia/acta-asamblea-dic-2023.pdf'
  }
];

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
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(mockDocuments);
  const [filters, setFilters] = useState<DocumentFiltersType>({});
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // 🎯 Datos específicos del usuario
  const userName = user?.name || 'Usuario';
  const userRole = user?.role || 'usuario';

  // 🔄 Cargar documentos - en producción sería una llamada al API
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        // Simular llamada API con delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 🎯 SOLO mostrar documentos del usuario logueado
        // Los documentos de workspaces se verán en sus secciones específicas
        const userDocuments = mockDocuments.filter(doc => {
          return doc.createdBy === 'current-user';
        });
        
        console.log('📄 Documentos del usuario:', userDocuments);
        console.log('👤 Usuario actual:', user?.name);
        
        setDocuments(userDocuments);
        setFilteredDocuments(userDocuments);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Solo cargar documentos si tenemos usuario
    if (user) {
      loadDocuments();
    }
  }, [user]); // Incluir user en dependencias

  // 🔍 Aplicar filtros
  useEffect(() => {
    let filtered = [...documents];

    // Filtro por tab activo
    if (activeTab === 'own') {
      filtered = filtered.filter(doc => doc.createdBy === 'current-user');
    } else if (activeTab === 'drafts') {
      filtered = filtered.filter(doc => doc.status === 'draft');
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

    if (filters.workspace?.length) {
      filtered = filtered.filter(doc => filters.workspace!.includes(doc.workspace));
    }

    setFilteredDocuments(filtered);
    setCurrentPage(1); // Reset pagination
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
      // Simular upload al backend
      console.log('Uploading files:', files);
      
      // En producción: llamada al API
      // const uploadedDocs = await uploadDocuments(files);
      
      // Mock: agregar documentos subidos
      const newDocs: Document[] = files.map((fileData, index) => ({
        id: `new-${Date.now()}-${index}`,
        title: fileData.title,
        description: fileData.description,
        fileName: fileData.file.name,
        fileSize: fileData.file.size,
        mimeType: fileData.file.type,
        status: 'draft' as const,
        workspace: fileData.workspace,
        tags: fileData.tags || [],
        createdBy: 'current-user',
        createdByName: userName,
        createdAt: new Date().toISOString(),
        fileUrl: `/uploads/${fileData.workspace}/${fileData.file.name}`
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
      // En producción: llamada al API para download
      console.log('Downloading document:', doc.fileName);
      // Simular descarga
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      link.click();
    }
  };

  const handleArchive = async (documentId: string) => {
    try {
      // En producción: llamada al API
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
      // En producción: llamada al API
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
    if (confirm('¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.')) {
      try {
        // En producción: llamada al API
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleEdit = (documentId: string) => {
    console.log('Edit document:', documentId);
    // Implementar navegación a página de edición
  };

  const handleShare = (documentId: string) => {
    console.log('Share document:', documentId);
    // Implementar funcionalidad de compartir
  };

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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subir Nuevos Documentos</DialogTitle>
              <DialogDescription>
                Arrastra archivos o haz clic para seleccionar. Soporta múltiples archivos.
              </DialogDescription>
            </DialogHeader>
            <DocumentUpload 
              onUpload={handleUpload}
              allowedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'png']}
              maxFileSize={50}
              multiple={true}
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
            <div className="text-2xl font-bold">{documents.length}</div>
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
            <div className="text-2xl font-bold">{documents.filter(d => d.status === 'draft').length}</div>
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
            <div className="text-2xl font-bold">{documents.filter(d => d.status === 'stored').length}</div>
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
            <div className="text-2xl font-bold">{documents.filter(d => d.status === 'archived').length}</div>
            <p className="text-xs text-muted-foreground">
              Documentos históricos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📊 Estadísticas de estado de documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de mis Documentos</CardTitle>
          <CardDescription>
            Distribución de tus documentos por estado actual
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
              <TabsTrigger value="all">Todos ({filteredDocuments.length})</TabsTrigger>
              <TabsTrigger value="own">Míos ({documents.filter(d => d.createdBy === 'current-user').length})</TabsTrigger>
              <TabsTrigger value="drafts">Borradores ({documents.filter(d => d.status === 'draft').length})</TabsTrigger>
              <TabsTrigger value="archived">Archivados ({documents.filter(d => d.status === 'archived').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* 🔍 Filtros */}
              <DocumentFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableUsers={[
                  { id: 'user1', name: 'María González' },
                  { id: 'user2', name: 'Carlos Pérez' },
                  { id: 'current-user', name: userName }
                ]}
                availableTags={['acta', 'informe', 'ordenanza', 'reunión', 'presupuesto']}
              />

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
                    filters={filters}
                    onFiltersChange={setFilters}
                    onView={handleView}
                    onDownload={handleDownload}
                    onArchive={handleArchive}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onShare={handleShare}
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredDocuments.length / 20)}
                    pageSize={20}
                    totalItems={filteredDocuments.length}
                    onPageChange={setCurrentPage}
                    defaultLayout="grid"
                    showFilters={false} // Ya tenemos filtros arriba
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
