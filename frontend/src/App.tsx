import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 📱 Componentes principales
import { Layout } from '@/components/layout/Layout';

// 📄 Páginas
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { UsersPage } from '@/pages/UsersPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { WorkspacesPage } from '@/pages/WorkspacesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';

// 🔒 Componentes de protección
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

/**
 * 🎯 Componente principal de la aplicación LisaDocs
 */
export function App() {
  return (
    <Router>
      <Routes>
        {/* 🚪 Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* 🏠 Ruta raíz redirige al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 🔒 Rutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/documents/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route index element={<DocumentsPage />} />
                {/* TODO: Agregar rutas específicas de documentos */}
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/users/*" element={
          <ProtectedRoute requiredRole={['administrador', 'presidente']}>
            <Layout>
              <Routes>
                <Route index element={<UsersPage />} />
                {/* TODO: Agregar rutas específicas de usuarios */}
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 🏢 Rutas de espacios de trabajo */}
        <Route path="/workspaces/:workspace" element={
          <ProtectedRoute>
            <WorkspacesPage />
          </ProtectedRoute>
        } />
        
        {/* 🔄 Redirección automática al primer workspace disponible */}
        <Route path="/workspaces" element={<Navigate to="/workspaces/presidencia" replace />} />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute requiredRole="administrador">
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/*" element={
          <ProtectedRoute requiredRole="administrador">
            <Layout>
              <Routes>
                {/* TODO: Agregar rutas de administración */}
                <Route path="*" element={<div>Panel de administración</div>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute requiredRole={['administrador', 'presidente', 'vicepresidente']}>
            <Layout>
              <div>Reportes</div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/archive" element={
          <ProtectedRoute requiredRole={['administrador', 'presidente', 'vicepresidente']}>
            <Layout>
              <div>Archivo de documentos</div>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/notifications" element={
          <ProtectedRoute requiredRole="administrador">
            <Layout>
              <div>Gestión de notificaciones</div>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 🚫 Página 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
