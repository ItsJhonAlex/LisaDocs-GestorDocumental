import React, { useState } from 'react';
import { 
  Shield, 
  Check, 
  X, 
  Settings,
  Users,
  Eye,
  Download,
  Upload,
  Trash2,
  Edit,
  Lock,
  Unlock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 🎯 Tipos para la matriz de permisos
interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'documents' | 'users' | 'workspaces' | 'system';
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  permissions: string[];
  isSystemRole: boolean;
}

// 📋 Permisos disponibles en el sistema
const availablePermissions: Permission[] = [
  // Documentos
  {
    id: 'view_documents',
    name: 'Ver documentos',
    description: 'Puede visualizar documentos en su workspace',
    category: 'documents'
  },
  {
    id: 'upload_documents',
    name: 'Subir documentos',
    description: 'Puede subir nuevos documentos',
    category: 'documents'
  },
  {
    id: 'download_documents',
    name: 'Descargar documentos',
    description: 'Puede descargar documentos',
    category: 'documents'
  },
  {
    id: 'edit_documents',
    name: 'Editar documentos',
    description: 'Puede modificar metadatos de documentos',
    category: 'documents'
  },
  {
    id: 'delete_documents',
    name: 'Eliminar documentos',
    description: 'Puede eliminar documentos del sistema',
    category: 'documents'
  },
  {
    id: 'archive_documents',
    name: 'Archivar documentos',
    description: 'Puede archivar/desarchivar documentos',
    category: 'documents'
  },
  
  // Usuarios
  {
    id: 'view_users',
    name: 'Ver usuarios',
    description: 'Puede ver la lista de usuarios',
    category: 'users'
  },
  {
    id: 'create_users',
    name: 'Crear usuarios',
    description: 'Puede crear nuevos usuarios',
    category: 'users'
  },
  {
    id: 'edit_users',
    name: 'Editar usuarios',
    description: 'Puede modificar datos de usuarios',
    category: 'users'
  },
  {
    id: 'delete_users',
    name: 'Eliminar usuarios',
    description: 'Puede eliminar usuarios del sistema',
    category: 'users'
  },
  
  // Workspaces
  {
    id: 'access_presidencia',
    name: 'Acceso Presidencia',
    description: 'Puede acceder al workspace de Presidencia',
    category: 'workspaces'
  },
  {
    id: 'access_cam',
    name: 'Acceso CAM',
    description: 'Puede acceder al workspace de CAM',
    category: 'workspaces'
  },
  {
    id: 'access_ampp',
    name: 'Acceso AMPP',
    description: 'Puede acceder al workspace de AMPP',
    category: 'workspaces'
  },
  {
    id: 'access_intendencia',
    name: 'Acceso Intendencia',
    description: 'Puede acceder al workspace de Intendencia',
    category: 'workspaces'
  },
  {
    id: 'access_comisiones',
    name: 'Acceso Comisiones',
    description: 'Puede acceder al workspace de Comisiones',
    category: 'workspaces'
  },
  
  // Sistema
  {
    id: 'admin_panel',
    name: 'Panel Admin',
    description: 'Puede acceder al panel de administración',
    category: 'system'
  },
  {
    id: 'view_audit_log',
    name: 'Log de Auditoría',
    description: 'Puede ver el log de auditoría',
    category: 'system'
  },
  {
    id: 'system_settings',
    name: 'Configuración',
    description: 'Puede modificar configuraciones del sistema',
    category: 'system'
  }
];

// 👥 Roles del sistema
const systemRoles: Role[] = [
  {
    id: 'administrador',
    name: 'administrador',
    displayName: 'Administrador',
    description: 'Control total del sistema',
    color: 'bg-red-500',
    permissions: availablePermissions.map(p => p.id), // Todos los permisos
    isSystemRole: true
  },
  {
    id: 'presidente',
    name: 'presidente',
    displayName: 'Presidente',
    description: 'Acceso a todos los workspaces y gestión de usuarios',
    color: 'bg-purple-500',
    permissions: [
      'view_documents', 'upload_documents', 'download_documents', 'edit_documents', 'archive_documents',
      'view_users', 'create_users', 'edit_users',
      'access_presidencia', 'access_cam', 'access_ampp', 'access_intendencia', 'access_comisiones',
      'admin_panel', 'view_audit_log'
    ],
    isSystemRole: true
  },
  {
    id: 'vicepresidente',
    name: 'vicepresidente',
    displayName: 'Vicepresidente',
    description: 'Acceso a múltiples workspaces',
    color: 'bg-blue-500',
    permissions: [
      'view_documents', 'upload_documents', 'download_documents', 'edit_documents',
      'access_presidencia', 'access_cam', 'access_ampp', 'access_intendencia'
    ],
    isSystemRole: true
  },
  {
    id: 'secretario_cam',
    name: 'secretario_cam',
    displayName: 'Secretario CAM',
    description: 'Gestión del workspace CAM',
    color: 'bg-green-500',
    permissions: [
      'view_documents', 'upload_documents', 'download_documents', 'edit_documents', 'archive_documents',
      'access_cam', 'access_presidencia'
    ],
    isSystemRole: true
  },
  {
    id: 'secretario_ampp',
    name: 'secretario_ampp',
    displayName: 'Secretario AMPP',
    description: 'Gestión del workspace AMPP',
    color: 'bg-yellow-500',
    permissions: [
      'view_documents', 'upload_documents', 'download_documents', 'edit_documents', 'archive_documents',
      'access_ampp', 'access_presidencia'
    ],
    isSystemRole: true
  },
  {
    id: 'intendente',
    name: 'intendente',
    displayName: 'Intendente',
    description: 'Gestión del workspace Intendencia',
    color: 'bg-orange-500',
    permissions: [
      'view_documents', 'upload_documents', 'download_documents', 'edit_documents', 'archive_documents',
      'access_intendencia', 'access_presidencia'
    ],
    isSystemRole: true
  },
  {
    id: 'secretario_cf',
    name: 'secretario_cf',
    displayName: 'Secretario CF',
    description: 'Gestión de comisiones de trabajo',
    color: 'bg-pink-500',
    permissions: [
      'view_documents', 'upload_documents', 'download_documents', 'edit_documents', 'archive_documents',
      'access_comisiones', 'access_presidencia'
    ],
    isSystemRole: true
  },
  {
    id: 'cf_member',
    name: 'cf_member',
    displayName: 'Miembro CF',
    description: 'Acceso básico a comisiones',
    color: 'bg-gray-500',
    permissions: [
      'view_documents', 'download_documents',
      'access_comisiones'
    ],
    isSystemRole: true
  }
];

/**
 * 🛡️ Componente de Matriz de Permisos
 * 
 * Gestiona los roles y permisos del sistema:
 * - Visualización de matriz de permisos por rol
 * - Modificación de permisos (solo administradores)
 * - Creación de roles personalizados
 */
export function PermissionMatrix() {
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('matrix');

  // 🎨 Función para obtener el ícono de un permiso
  const getPermissionIcon = (permissionId: string) => {
    if (permissionId.includes('view')) return <Eye className="w-4 h-4" />;
    if (permissionId.includes('upload')) return <Upload className="w-4 h-4" />;
    if (permissionId.includes('download')) return <Download className="w-4 h-4" />;
    if (permissionId.includes('edit')) return <Edit className="w-4 h-4" />;
    if (permissionId.includes('delete')) return <Trash2 className="w-4 h-4" />;
    if (permissionId.includes('access')) return <Unlock className="w-4 h-4" />;
    if (permissionId.includes('admin')) return <Shield className="w-4 h-4" />;
    if (permissionId.includes('users')) return <Users className="w-4 h-4" />;
    return <Settings className="w-4 h-4" />;
  };

  // 📊 Agrupar permisos por categoría
  const groupedPermissions = availablePermissions.reduce((groups, permission) => {
    const category = permission.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  // 🎨 Obtener título de categoría
  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'documents': return 'Documentos';
      case 'users': return 'Usuarios';
      case 'workspaces': return 'Espacios de Trabajo';
      case 'system': return 'Sistema';
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      {/* 🎯 Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Matriz de Permisos</CardTitle>
              <CardDescription>
                Gestiona los permisos y accesos por rol en el sistema
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Modo edición:</span>
              <Switch 
                checked={editMode} 
                onCheckedChange={setEditMode}
                disabled={true} // Solo para mostrar, en producción permitiría edición
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Matriz de Permisos</TabsTrigger>
          <TabsTrigger value="roles">Gestión de Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          {/* 📊 Matriz de permisos */}
          <Card>
            <CardHeader>
              <CardTitle>Permisos por Rol</CardTitle>
              <CardDescription>
                Visualización completa de permisos asignados a cada rol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Permiso</th>
                      {systemRoles.map((role) => (
                        <th key={role.id} className="text-center p-2 min-w-[100px]">
                          <div className="flex flex-col items-center space-y-1">
                            <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                            <span className="text-xs font-medium">{role.displayName}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <React.Fragment key={category}>
                        <tr>
                          <td colSpan={systemRoles.length + 1} className="p-3 bg-muted/50 font-medium">
                            {getCategoryTitle(category)}
                          </td>
                        </tr>
                        {permissions.map((permission) => (
                          <tr key={permission.id} className="border-b hover:bg-muted/25">
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                {getPermissionIcon(permission.id)}
                                <div>
                                  <div className="font-medium text-sm">{permission.name}</div>
                                  <div className="text-xs text-muted-foreground">{permission.description}</div>
                                </div>
                              </div>
                            </td>
                            {systemRoles.map((role) => (
                              <td key={`${role.id}-${permission.id}`} className="p-3 text-center">
                                {role.permissions.includes(permission.id) ? (
                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                                    <Check className="w-4 h-4 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                                    <X className="w-4 h-4 text-red-600" />
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          {/* 👥 Gestión de roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemRoles.map((role) => (
              <Card key={role.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${role.color}`}></div>
                      <CardTitle className="text-lg">{role.displayName}</CardTitle>
                    </div>
                    {role.isSystemRole && (
                      <Badge variant="outline">
                        <Lock className="w-3 h-3 mr-1" />
                        Sistema
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Permisos asignados:</span>
                      <span className="font-medium">{role.permissions.length}</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => {
                        const categoryPermissions = permissions.filter(p => role.permissions.includes(p.id));
                        if (categoryPermissions.length === 0) return null;
                        
                        return (
                          <div key={category} className="text-xs">
                            <span className="font-medium">{getCategoryTitle(category)}:</span>
                            <span className="text-muted-foreground ml-1">
                              {categoryPermissions.length}/{permissions.length}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
