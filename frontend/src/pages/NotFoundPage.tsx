import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorLayout } from '@/components/layout/Layout';

export function NotFoundPage() {
  return (
    <ErrorLayout>
      <div className="space-y-6">
        {/* 🎭 Icono y título */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <FileQuestion className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">¡Página no encontrada!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
          </p>
        </div>

        {/* 🎯 Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Link>
          </Button>
          
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver Atrás
          </Button>
        </div>

        {/* 🔍 Sugerencias */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-3 flex items-center">
            <Search className="w-4 h-4 mr-2" />
            ¿Qué puedes hacer?
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Verifica que la URL esté escrita correctamente</li>
            <li>• Regresa al dashboard y navega desde allí</li>
            <li>• Usa el menú de navegación para encontrar lo que buscas</li>
            <li>• Contacta al administrador si el problema persiste</li>
          </ul>
        </div>

        {/* 🏷️ Enlaces útiles */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground text-center mb-3">
            Enlaces útiles:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="link" size="sm" asChild>
              <Link to="/documents">Documentos</Link>
            </Button>
            <Button variant="link" size="sm" asChild>
              <Link to="/workspaces">Espacios de Trabajo</Link>
            </Button>
            <Button variant="link" size="sm" asChild>
              <Link to="/profile">Mi Perfil</Link>
            </Button>
          </div>
        </div>
      </div>
    </ErrorLayout>
  );
}
