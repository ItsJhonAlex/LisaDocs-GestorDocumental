import { FileText, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* 📊 Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Gestiona y organiza todos los documentos del sistema
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {/* 🔍 Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* 📄 Placeholder de contenido */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>Página de Documentos</CardTitle>
          <CardDescription>
            Esta página está en desarrollo. Aquí podrás gestionar todos los documentos del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Funcionalidades próximas:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1">📤 Subida de archivos</h4>
                <p className="text-muted-foreground">Drag & drop, múltiples formatos</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1">🔍 Búsqueda avanzada</h4>
                <p className="text-muted-foreground">Filtros por fecha, tipo, etiquetas</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1">👁️ Vista previa</h4>
                <p className="text-muted-foreground">PDFs, imágenes, documentos</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-1">🏷️ Gestión de metadatos</h4>
                <p className="text-muted-foreground">Etiquetas, descripciones, categorías</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
