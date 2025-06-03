import { useState, useCallback } from 'react';
// import { useDropzone } from 'react-dropzone';
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

// 🎯 Tipos para el upload
interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

interface DocumentUploadProps {
  onUpload?: (files: Array<{
    file: File;
    title: string;
    description?: string;
    workspace: string;
    tags?: string[];
  }>) => Promise<void>;
  className?: string;
  maxFiles?: number;
  maxFileSize?: number; // en MB
  allowedTypes?: string[];
  defaultWorkspace?: string;
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
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  
  // 📝 Metadatos del archivo actual
  const [fileMetadata, setFileMetadata] = useState<{
    title: string;
    description: string;
    workspace: string;
    tags: string[];
  }>({
    title: '',
    description: '',
    workspace: defaultWorkspace || user?.workspaces?.[0] || 'presidencia',
    tags: []
  });

  // 🎯 Workspaces disponibles
  const workspaces = [
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
    const newFiles: UploadFile[] = acceptedFiles.map((file) => {
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

  // 🚀 Procesar subida
  const handleUpload = async () => {
    if (!onUpload || uploadFiles.length === 0) return;

    const validFiles = uploadFiles.filter(f => f.status !== 'error');
    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Si solo hay un archivo, usar los metadatos del modal
      if (validFiles.length === 1) {
        const uploadData = [{
          file: validFiles[0].file,
          title: fileMetadata.title || validFiles[0].file.name,
          description: fileMetadata.description,
          workspace: fileMetadata.workspace,
          tags: fileMetadata.tags
        }];

        await onUpload(uploadData);
      } else {
        // Para múltiples archivos, usar nombres de archivo como títulos
        const uploadData = validFiles.map(uploadFile => ({
          file: uploadFile.file,
          title: uploadFile.file.name,
          description: '',
          workspace: fileMetadata.workspace,
          tags: []
        }));

        await onUpload(uploadData);
      }

      // Limpiar archivos después de subida exitosa
      setUploadFiles([]);
      setFileMetadata({
        title: '',
        description: '',
        workspace: defaultWorkspace || user?.workspaces?.[0] || 'presidencia',
        tags: []
      });
      
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
      setShowMetadataModal(false);
    }
  };

  // 🎯 Abrir modal de metadatos
  const openMetadataModal = () => {
    if (uploadFiles.length === 1) {
      setFileMetadata(prev => ({
        ...prev,
        title: uploadFiles[0].file.name.replace(/\.[^/.]+$/, '') // Quitar extensión
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
        'border-2 border-dashed transition-colors',
        isUploading && 'pointer-events-none opacity-50'
      )}>
        <CardContent className="p-8">
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
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
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
                  <DialogContent>
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
                          onValueChange={(value) => setFileMetadata(prev => ({ ...prev, workspace: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {workspaces.map((workspace) => (
                              <SelectItem key={workspace.value} value={workspace.value}>
                                {workspace.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                className="flex items-center gap-3 p-3 border rounded-lg"
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
