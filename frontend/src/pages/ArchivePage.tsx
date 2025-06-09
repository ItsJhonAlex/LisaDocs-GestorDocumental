import { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  Download, 
  Eye, 
  RotateCcw,
  Trash2,
  Calendar,
  FileText,
  Filter,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';

// 🗂️ Tipos para documentos archivados
interface ArchivedDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  workspace: string;
  archivedBy: string;
  archivedByName: string;
  archivedAt: string;
  originalCreatedAt: string;
  tags?: string[];
  reason?: string;
}

// 📊 Mock data para archivos
const mockArchivedDocuments: ArchivedDocument[] = [
  {
    id: 'arch-1',
    title: 'Acta CAM - Diciembre 2022',
    fileName: 'acta-cam-dic-2022.pdf',
    fileSize: 2048576,
    mimeType: 'application/pdf',
    workspace: 'cam',
    archivedBy: 'admin-user',
    archivedByName: 'Jonathan Rodriguez',
    archivedAt: '2023-12-31T23:59:00Z',
    originalCreatedAt: '2022-12-15T10:30:00Z',
    tags: ['acta', 'histórico'],
    reason: 'Archivo por antigüedad'
  },
  {
    id: 'arch-2',
    title: 'Presupuesto Municipal 2022',
    fileName: 'presupuesto-2022.xlsx',
    fileSize: 4096000,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    workspace: 'presidencia',
    archivedBy: 'admin-user',
    archivedByName: 'Jonathan Rodriguez',
    archivedAt: '2023-01-15T09:00:00Z',
    originalCreatedAt: '2022-01-10T14:20:00Z',
    tags: ['presupuesto', 'financiero'],
    reason: 'Archivo anual'
  },
  {
    id: 'arch-3',
    title: 'Ordenanza Municipal Obsoleta',
    fileName: 'ordenanza-obsoleta-2021.docx',
    fileSize: 512000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    workspace: 'presidencia',
    archivedBy: 'admin-user',
    archivedByName: 'Jonathan Rodriguez',
    archivedAt: '2023-06-01T16:45:00Z',
    originalCreatedAt: '2021-03-20T11:15:00Z',
    tags: ['ordenanza', 'obsoleto'],
    reason: 'Reemplazada por nueva ordenanza'
  }
];

/**
 * 🗂️ Página de Archivo de Documentos
 * 
 * Gestión de documentos archivados para:
 * - Administradores
 * - Presidentes 
 * - Vicepresidentes
 */
export function ArchivePage() {
  const { hasAnyRole } = useAuth();
  const [documents, setDocuments] = useState<ArchivedDocument[]>(mockArchivedDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<ArchivedDocument[]>(mockArchivedDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🛡️ Verificar permisos de acceso
  const canAccess = hasAnyRole(['administrador', 'presidente', 'vicepresidente']);

  // 🔍 Aplicar filtros
  useEffect(() => {
    let filtered = [...documents];

    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(search) ||
        doc.fileName.toLowerCase().includes(search) ||
        doc.workspace.toLowerCase().includes(search) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Filtro por workspace
    if (selectedWorkspace !== 'all') {
      filtered = filtered.filter(doc => doc.workspace === selectedWorkspace);
    }

    // Filtro por rango de tiempo
    if (selectedTimeRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (selectedTimeRange) {
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        case '2years':
          cutoffDate.setFullYear(now.getFullYear() - 2);
          break;
      }
      
      filtered = filtered.filter(doc => new Date(doc.archivedAt) >= cutoffDate);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedWorkspace, selectedTimeRange]);

  // 🚫 Si no tiene permisos, mostrar mensaje de acceso restringido
  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Acceso Restringido</CardTitle>
            <CardDescription>
              Solo administradores, presidentes y vicepresidentes pueden acceder al archivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Si necesitas acceso a esta funcionalidad, contacta con el administrador del sistema.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p><strong>Roles con acceso:</strong></p>
              <p>• Administrador</p>
              <p>• Presidente</p>
              <p>• Vicepresidente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 📱 Funciones para manejar acciones
  const handleRestore = async (documentId: string) => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Restoring document:', documentId);
      // En producción: hacer llamada al API
    } catch (error) {
      console.error('Error restoring document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermanentDelete = async (documentId: string) => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      console.log('Permanently deleted document:', documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (documentId: string) => {
    console.log('Downloading archived document:', documentId);
    // Implementar descarga
  };

  const handleView = (documentId: string) => {
    console.log('Viewing archived document:', documentId);
    // Implementar visualización
  };

  // 🎨 Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 🎨 Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ✅ Mostrar la página de archivo
  return (
    <div className="space-y-6">
      {/* 🎯 Header de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archivo de Documentos</h1>
          <p className="text-muted-foreground">
            Gestiona documentos archivados y históricos del sistema
          </p>
        </div>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          {filteredDocuments.length} documentos archivados
        </Badge>
      </div>

      {/* 🔍 Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar en Archivo</CardTitle>
          <CardDescription>
            Encuentra documentos archivados usando filtros avanzados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger>
                <SelectValue placeholder="Workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los workspaces</SelectItem>
                <SelectItem value="presidencia">Presidencia</SelectItem>
                <SelectItem value="cam">CAM</SelectItem>
                <SelectItem value="ampp">AMPP</SelectItem>
                <SelectItem value="intendencia">Intendencia</SelectItem>
                <SelectItem value="comisiones_cf">Comisiones CF</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="1year">Último año</SelectItem>
                <SelectItem value="2years">Últimos 2 años</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📊 Estadísticas del archivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Archivados</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              Documentos en archivo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(doc => {
                const archivedDate = new Date(doc.archivedAt);
                const now = new Date();
                return archivedDate.getMonth() === now.getMonth() && 
                       archivedDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Archivados recientemente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamaño Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((sum, doc) => sum + doc.fileSize, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Espacio utilizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(documents.map(doc => doc.workspace)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Con documentos archivados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📋 Lista de documentos archivados */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Archivados</CardTitle>
          <CardDescription>
            Gestiona documentos históricos y archivados del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay documentos archivados</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedWorkspace !== 'all' || selectedTimeRange !== 'all'
                  ? 'No se encontraron documentos que coincidan con los filtros.'
                  : 'No hay documentos archivados en el sistema.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <div 
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium truncate">{document.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {document.workspace}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        {document.fileName} • {formatFileSize(document.fileSize)}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Archivado: {formatDate(document.archivedAt)}</span>
                        <span>por {document.archivedByName}</span>
                        {document.reason && <span>• {document.reason}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(document.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(document.id)}
                      disabled={isLoading}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePermanentDelete(document.id)}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 