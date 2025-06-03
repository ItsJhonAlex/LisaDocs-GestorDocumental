import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Key,
  Mail,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUsers } from '@/hooks/useUsers';
import type { User, UserRole, WorkspaceType } from '@/types/auth';
import { CreateUserDialog } from './CreateUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { UserDetailsDialog } from './UserDetailsDialog';

// 🎨 Constantes y utilidades
const ROLE_COLORS: Record<UserRole, string> = {
  administrador: 'bg-purple-100 text-purple-800',
  presidente: 'bg-blue-100 text-blue-800',
  vicepresidente: 'bg-indigo-100 text-indigo-800',
  secretario_cam: 'bg-green-100 text-green-800',
  secretario_ampp: 'bg-yellow-100 text-yellow-800',
  secretario_cf: 'bg-orange-100 text-orange-800',
  intendente: 'bg-red-100 text-red-800',
  cf_member: 'bg-gray-100 text-gray-800'
};

// 🎨 Opciones de roles para selectores
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'presidente', label: 'Presidente' },
  { value: 'vicepresidente', label: 'Vicepresidente' },
  { value: 'secretario_cam', label: 'Secretario CAM' },
  { value: 'secretario_ampp', label: 'Secretario AMPP' },
  { value: 'secretario_cf', label: 'Secretario CF' },
  { value: 'intendente', label: 'Intendente' },
  { value: 'cf_member', label: 'Miembro CF' }
];

// 🏢 Opciones de workspaces para selectores
const WORKSPACE_OPTIONS: { value: WorkspaceType; label: string }[] = [
  { value: 'presidencia', label: 'Presidencia' },
  { value: 'intendencia', label: 'Intendencia' },
  { value: 'cam', label: 'Cámara de Comercio' },
  { value: 'ampp', label: 'Asociación de Municipios' },
  { value: 'comisiones_cf', label: 'Comisiones de Fiscalización' }
];

/**
 * 📋 Lista de Usuarios
 * 
 * Componente principal para mostrar y gestionar usuarios:
 * - Tabla con información de usuarios
 * - Filtros y búsqueda en tiempo real
 * - Paginación
 * - Acciones CRUD
 * - Estados de carga optimizados
 */
export function UserList() {
  // 🎣 Hooks
  const {
    users,
    loading,
    pagination,
    filters,
    updateFilters,
    changePage,
    deleteUser,
    canCreateUser,
    canEditUser,
    canDeleteUser,
    canChangePassword,
    refresh,
    exportUsers
  } = useUsers();

  // 🎯 Estado local
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // 🔍 Manejar búsqueda con debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateFilters({ search: query || undefined, offset: 0 });
  };

  // 🔧 Manejar filtros
  const handleFilterChange = (key: string, value: string | boolean | number | undefined) => {
    updateFilters({ [key]: value === 'all' ? undefined : value, offset: 0 });
  };

  // ✅ Manejar selección de usuarios
  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map(u => u.id) : []);
  };

  // 🗑️ Manejar eliminación
  const handleDeleteUser = async (user: User) => {
    const success = await deleteUser(user.id);
    if (success) {
      setSelectedUsers(prev => prev.filter(id => id !== user.id));
    }
  };

  // 📄 Calcular paginación
  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.page || 1;
  const startItem = ((currentPage - 1) * pagination.limit) + 1;
  const endItem = Math.min(currentPage * pagination.limit, pagination.total);

  // 🎨 Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 🎨 Renderizar badge de rol
  const renderRoleBadge = (role: UserRole) => {
    const roleConfig = ROLE_OPTIONS.find(r => r.value === role);
    return (
      <Badge variant="outline" className={ROLE_COLORS[role]}>
        {roleConfig?.label || role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 🎛️ Barra de herramientas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                {pagination.total} usuarios registrados en el sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              {canCreateUser() && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 🔍 Búsqueda y filtros */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportUsers('csv')}>
                    Exportar como CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportUsers('excel')}>
                    Exportar como Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 📊 Panel de filtros expandible */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <Select
                  value={filters.role || 'all'}
                  onValueChange={(value) => handleFilterChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {ROLE_OPTIONS.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace</label>
                <Select
                  value={filters.workspace || 'all'}
                  onValueChange={(value) => handleFilterChange('workspace', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los workspaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los workspaces</SelectItem>
                    {WORKSPACE_OPTIONS.map(workspace => (
                      <SelectItem key={workspace.value} value={workspace.value}>
                        {workspace.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                  onValueChange={(value) => handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Activos</SelectItem>
                    <SelectItem value="false">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Elementos por página</label>
                <Select
                  value={filters.limit?.toString() || '10'}
                  onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 🎯 Acciones por lotes */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <span className="text-sm font-medium">
                {selectedUsers.length} usuario(s) seleccionado(s)
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  Cancelar selección
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!selectedUsers.every(id => {
                    const user = users.find(u => u.id === id);
                    return user && canDeleteUser(user);
                  })}
                >
                  Eliminar seleccionados
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 📋 Tabla de usuarios */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <UserX className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {loading ? 'Cargando usuarios...' : 'No se encontraron usuarios'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {renderRoleBadge(user.role)}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="secondary">
                          {WORKSPACE_OPTIONS.find(w => w.value === user.workspace)?.label || user.workspace}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.isActive ? (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-600" />
                          )}
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLoginAt ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {new Date(user.lastLoginAt).toLocaleDateString('es-ES')}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {new Date(user.lastLoginAt).toLocaleString('es-ES')}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground">Nunca</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            
                            {canEditUser(user) && (
                              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            
                            {canChangePassword(user) && (
                              <DropdownMenuItem>
                                <Key className="h-4 w-4 mr-2" />
                                Cambiar contraseña
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Reenviar verificación
                            </DropdownMenuItem>
                            
                            {canDeleteUser(user) && (
                              <>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      className="text-destructive focus:text-destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar usuario
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción eliminará permanentemente al usuario <strong>{user.fullName}</strong> 
                                        y todos sus datos asociados. Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 📄 Paginación */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startItem} - {endItem} de {pagination.total} usuarios
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => changePage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔲 Dialogs */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      
      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
        />
      )}
      
      {viewingUser && (
        <UserDetailsDialog
          open={!!viewingUser}
          onOpenChange={(open) => !open && setViewingUser(null)}
          user={viewingUser}
        />
      )}
    </div>
  );
}
