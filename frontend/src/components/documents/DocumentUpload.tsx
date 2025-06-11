import { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  FileSpreadsheet,
  File,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// 🎯 Importar tipos del backend y documento
import type { WorkspaceType, BackendDocument } from '@/hooks/useBackendDocuments';
import type { DocumentType, createDocumentTags } from '@/types/document';
import { DocumentTypeSelector } from './DocumentTypeSelector';

// 🎯 Tipos para el upload interno
interface UploadFileState {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

interface DocumentUploadProps {
  onUpload?: (documents: BackendDocument[]) => Promise<void>;
  className?: string;
  maxFiles?: number;
  maxFileSize?: number; // en MB
  allowedTypes?: string[];
  defaultWorkspace?: WorkspaceType;
  multiple?: boolean;
}

/**
 * 📤 Componente para subir documentos
 * 
 * Características:
 * - Drag & drop
 * - Múltiples archivos
 * - Validación de tipos y tamaños
 * - Vista previa
 * - Metadatos (título, descripción, workspace, tags)
 * - Progreso de subida
 */
export function DocumentUpload({
  onUpload,
  className,
  maxFiles = 5,
  maxFileSize = 50, // 50MB por defecto
  allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'png', 'jpeg'],
  defaultWorkspace,
  multiple = true
}: DocumentUploadProps) {
  const { user } = useAuth();
  const [uploadFiles, setUploadFiles] = useState<UploadFileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  
  // 📝 Metadatos del archivo actual
  const [fileMetadata, setFileMetadata] = useState<{
    title: string;
    description: string;
    workspace: WorkspaceType;
    documentType?: DocumentType;
    tags: string[];
  }>({
    title: '',
    description: '',
    workspace: defaultWorkspace || (user?.workspace as WorkspaceType) || 'presidencia',
    documentType: undefined,
    tags: []
  });

  // 🔄 Actualizar workspace cuando cambie defaultWorkspace
  useEffect(() => {
    console.log('🔍 DocumentUpload initialized with:', {
      defaultWorkspace,
      user_workspace: user?.workspace,
      initial_fileMetadata_workspace: fileMetadata.workspace
    });

    if (defaultWorkspace) {
      setFileMetadata(prev => ({
        ...prev,
        workspace: defaultWorkspace
      }));
    }
  }, [defaultWorkspace]);

  // 🐛 Debug effect para ver cambios en fileMetadata
  useEffect(() => {
    console.log('🔍 fileMetadata changed:', fileMetadata);
  }, [fileMetadata]);

  // 🎯 Workspaces disponibles (coinciden con el enum del backend)
  const workspaces: Array<{ value: WorkspaceType; label: string }> = [
    { value: 'presidencia', label: 'Presidencia' },
    { value: 'cam', label: 'CAM' },
    { value: 'ampp', label: 'AMPP' },
    { value: 'intendencia', label: 'Intendencia' },
    { value: 'comisiones_cf', label: 'Comisiones CF' }
  ];

  // 🎨 Obtener icono del tipo de archivo
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['pdf'].includes(extension || '')) return <FileText className="w-8 h-8 text-red-500" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return <Image className="w-8 h-8 text-blue-500" />;
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  // 📏 Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ✅ Validar archivo
  const validateFile = useCallback((file: File): string | null => {
    // Verificar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `El archivo es muy grande. Máximo ${maxFileSize}MB permitido.`;
    }

    // Verificar tipo
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedTypes.includes(extension)) {
      return `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`;
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  // 📄 Manejar archivos seleccionados
  const handleFilesAccepted = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFileState[] = acceptedFiles.map((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      const error = validateFile(file);
      
      // Crear preview para imágenes
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      return {
        file,
        id,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined,
        preview
      };
    });

    setUploadFiles(prev => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, maxFiles); // Limitar número de archivos
    });
  }, [maxFiles, validateFile]);

  // 🗑️ Remover archivo
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // 🎛️ Configurar dropzone (simulado sin react-dropzone)
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFilesAccepted(Array.from(files));
    }
  };

  // 📤 Función para subir un archivo individual al backend
  const uploadSingleFile = async (
    file: File,
    metadata: {
      title: string;
      description?: string;
      workspace: WorkspaceType;
      documentType?: DocumentType;
      tags: string[];
    },
    onProgress?: (progress: number) => void
  ): Promise<BackendDocument> => {
    const formData = new FormData();
    
    // Adjuntar archivo
    formData.append('file', file);
    
    // Adjuntar metadatos según el formato del backend
    console.log('📤 Uploading with metadata:', {
      title: metadata.title,
      description: metadata.description,
      workspace: metadata.workspace,
      workspaceType: typeof metadata.workspace,
      tags: metadata.tags
    });
    
    // 🐛 Debug FormData - Verificar valores antes de agregar
    console.log('🔍 Metadata values before FormData:', {
      title: metadata.title,
      titleType: typeof metadata.title,
      titleValid: !!metadata.title,
      description: metadata.description,
      workspace: metadata.workspace,
      workspaceType: typeof metadata.workspace,
      workspaceValid: !!metadata.workspace,
      tags: metadata.tags
    });

    // ⚠️ Validar que tenemos los campos requeridos
    if (!metadata.title) {
      throw new Error('Title is required but is missing');
    }
    if (!metadata.workspace) {
      throw new Error('Workspace is required but is missing');
    }

    // ✅ Agregar campos con validación
    formData.append('title', metadata.title);
    if (metadata.description && metadata.description.trim()) {
      formData.append('description', metadata.description);
    }
    formData.append('workspace', metadata.workspace);
    
    // 🎯 Combinar tipo de documento + tags adicionales
    const finalTags = metadata.documentType 
      ? [metadata.documentType, ...metadata.tags]
      : metadata.tags;
    
    if (finalTags.length > 0) {
      formData.append('tags', finalTags.join(','));
    }
    
    // 🐛 Verificar que los datos se agregaron correctamente
    console.log('📋 FormData entries after appending:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value} (${typeof value})`);
    }

    // Hacer petición al backend
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      // Intentar parsear JSON solo si el content-type es JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (jsonError) {
          // Si falla el parsing JSON, usar el mensaje de status HTTP
          console.warn('Failed to parse error response as JSON:', jsonError);
        }
      } else {
        // Si no es JSON, intentar leer como texto
        try {
          const errorText = await response.text();
          if (errorText.trim()) {
            errorMessage = errorText;
          }
        } catch (textError) {
          console.warn('Failed to read error response as text:', textError);
        }
      }
      
      throw new Error(errorMessage);
    }

    // Parsear respuesta exitosa
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('El servidor no devolvió una respuesta JSON válida');
    }

    try {
      const result = await response.json();
      return result.data;
    } catch (jsonError) {
      throw new Error('Error al procesar la respuesta del servidor: respuesta JSON inválida');
    }
  };

  // 🚀 Procesar subida
  const handleUpload = async () => {
    if (!onUpload || uploadFiles.length === 0) return;

    const validFiles = uploadFiles.filter(f => f.status !== 'error');
    if (validFiles.length === 0) return;

    setIsUploading(true);
    const uploadedDocuments: BackendDocument[] = [];

    try {
      // 📤 Subir archivos uno por uno según el formato del backend
      for (let i = 0; i < validFiles.length; i++) {
        const uploadFile = validFiles[i];
        
        // Actualizar progreso
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          )
        );

        try {
          // 🐛 Debug el estado actual de fileMetadata antes del upload
          console.log('🔍 Current fileMetadata state:', {
            fileMetadata,
            uploadFiles_length: uploadFiles.length,
            defaultWorkspace,
            user_workspace: user?.workspace
          });

          const metadata = {
            title: uploadFiles.length === 1 
              ? (fileMetadata.title || uploadFile.file.name.replace(/\.[^/.]+$/, ''))
              : uploadFile.file.name.replace(/\.[^/.]+$/, ''),
            description: uploadFiles.length === 1 ? fileMetadata.description : undefined,
            workspace: fileMetadata.workspace as WorkspaceType,
            documentType: uploadFiles.length === 1 ? fileMetadata.documentType : undefined,
            tags: uploadFiles.length === 1 ? fileMetadata.tags : []
          };

          console.log('🔍 Generated metadata for upload:', metadata);

          const document = await uploadSingleFile(uploadFile.file, metadata,
            (progress) => {
              setUploadFiles(prev => 
                prev.map(f => 
                  f.id === uploadFile.id 
                    ? { ...f, progress }
                    : f
                )
              );
            }
          );

          uploadedDocuments.push(document);
          
          // Marcar como exitoso
          setUploadFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          );
        } catch (error) {
          // Marcar como error
          setUploadFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Error desconocido' }
                : f
            )
          );
        }
      }

      // ✅ Solo llamar onUpload si hay documentos subidos exitosamente
      if (uploadedDocuments.length > 0) {
        await onUpload(uploadedDocuments);
        
        // Limpiar archivos después de subida exitosa
        setUploadFiles([]);
        setFileMetadata({
          title: '',
          description: '',
          workspace: defaultWorkspace || (user?.workspace as WorkspaceType) || 'presidencia',
          documentType: undefined,
          tags: []
        });
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
      setShowMetadataModal(false);
    }
  };

  // 🎯 Abrir modal de metadatos
  const openMetadataModal = () => {
    console.log('🔍 Opening metadata modal:', {
      uploadFiles_length: uploadFiles.length,
      current_fileMetadata: fileMetadata,
      first_file_name: uploadFiles[0]?.file.name,
      defaultWorkspace,
      user_workspace: user?.workspace
    });

    if (uploadFiles.length === 1) {
      const newTitle = uploadFiles[0].file.name.replace(/\.[^/.]+$/, '');
      console.log('🔍 Setting title for single file:', newTitle);
      
      setFileMetadata(prev => ({
        ...prev,
        title: newTitle
      }));
    }
    setShowMetadataModal(true);
  };

  const validFiles = uploadFiles.filter(f => f.status !== 'error');
  const hasErrors = uploadFiles.some(f => f.status === 'error');

  return (
    <div className={cn('space-y-4', className)}>
      {/* 📤 Zona de drop */}
      <Card className={cn(
        'border-2 border-dashed transition-colors bg-card',
        isUploading && 'pointer-events-none opacity-50'
      )}>
        <CardContent className="p-8 bg-card">
          <div className="text-center cursor-pointer">
            <input 
              type="file"
              multiple={multiple}
              onChange={handleFileInput}
              accept={allowedTypes.map(type => `.${type}`).join(',')}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    Haz clic para seleccionar archivos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tipos permitidos: {allowedTypes.join(', ')} • Máximo {maxFileSize}MB por archivo
                  </p>
                  {multiple && (
                    <p className="text-xs text-muted-foreground">
                      Máximo {maxFiles} archivos a la vez
                    </p>
                  )}
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 📄 Lista de archivos */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              Archivos seleccionados ({uploadFiles.length})
            </h4>
            {validFiles.length > 0 && !isUploading && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadFiles([])}
                >
                  Limpiar todo
                </Button>
                <Dialog open={showMetadataModal} onOpenChange={setShowMetadataModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={openMetadataModal}>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir archivos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="document-upload-dialog">
                    <DialogHeader>
                      <DialogTitle>Configurar documento</DialogTitle>
                      <DialogDescription>
                        {uploadFiles.length === 1 
                          ? 'Configura los detalles del documento antes de subirlo.'
                          : `Configuración para ${validFiles.length} archivos.`
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* 📝 Título (solo para archivo único) */}
                      {uploadFiles.length === 1 && (
                        <div className="space-y-2">
                          <Label htmlFor="title">Título del documento</Label>
                          <Input
                            id="title"
                            value={fileMetadata.title}
                            onChange={(e) => setFileMetadata(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Nombre del documento"
                          />
                        </div>
                      )}

                      {/* 📝 Descripción */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Textarea
                          id="description"
                          value={fileMetadata.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFileMetadata(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descripción del documento..."
                          rows={3}
                        />
                      </div>

                      {/* 🏢 Workspace */}
                      <div className="space-y-2">
                        <Label htmlFor="workspace">Espacio de trabajo</Label>
                        <Select
                          value={fileMetadata.workspace}
                          onValueChange={(value: WorkspaceType) => setFileMetadata(prev => ({ ...prev, workspace: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-solid border shadow-lg">
                            {workspaces.map((workspace) => (
                              <SelectItem key={workspace.value} value={workspace.value} className="bg-solid hover:bg-accent text-foreground">
                                {workspace.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 📄 Tipo de Documento */}
                      <DocumentTypeSelector
                        workspace={fileMetadata.workspace}
                        value={fileMetadata.documentType}
                        onValueChange={(type) => setFileMetadata(prev => ({ ...prev, documentType: type }))}
                        showDescription={true}
                        showRetentionInfo={true}
                      />

                      {/* 🏷️ Tags adicionales */}
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags adicionales (opcional)</Label>
                        <Input
                          id="tags"
                          value={fileMetadata.tags.join(', ')}
                          onChange={(e) => {
                            const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                            setFileMetadata(prev => ({ ...prev, tags }));
                          }}
                          placeholder="Etiqueta1, Etiqueta2, Etiqueta3..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Separar por comas. El tipo de documento se agrega automáticamente.
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowMetadataModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Subir {validFiles.length} archivo{validFiles.length > 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* 📋 Lista de archivos */}
          <div className="space-y-2">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                {/* 🎨 Preview/Icono */}
                <div className="flex-shrink-0">
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(uploadFile.file.name)
                  )}
                </div>

                {/* 📝 Información del archivo */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadFile.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadFile.file.size)}
                  </p>
                  
                  {/* ⚠️ Error */}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {uploadFile.error}
                    </p>
                  )}

                  {/* ✅ Éxito */}
                  {uploadFile.status === 'success' && (
                    <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3" />
                      Subido correctamente
                    </p>
                  )}

                  {/* 📊 Progreso */}
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={uploadFile.progress} className="h-1" />
                    </div>
                  )}
                </div>

                {/* 🎯 Estado y acciones */}
                <div className="flex items-center gap-2">
                  {uploadFile.status === 'pending' && (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                  {uploadFile.status === 'uploading' && (
                    <Badge variant="default">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      {uploadFile.progress}%
                    </Badge>
                  )}
                  {uploadFile.status === 'success' && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Listo
                    </Badge>
                  )}
                  {uploadFile.status === 'error' && (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Error
                    </Badge>
                  )}

                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ⚠️ Mensaje de errores */}
          {hasErrors && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                Algunos archivos tienen errores. Corrígelos antes de continuar.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
