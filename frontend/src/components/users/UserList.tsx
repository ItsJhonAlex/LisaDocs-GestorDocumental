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
  // 🎣 Hooks - usar límite inicial más pequeño para pruebas
  const {
    users,
    loading,
    pagination,
    filters,
    error,
    updateFilters,
    changePage,
    deleteUser,
    canCreateUser,
    canEditUser,
    canDeleteUser,
    canChangePassword,
    refresh,
    exportUsers
  } = useUsers({ limit: 10 }); // 🔥 Empezar con límite pequeño

  // 🔍 Debug UserList
  console.log('👥 UserList - Users:', users);
  console.log('👥 UserList - Loading:', loading);
  console.log('👥 UserList - Error:', error);
  console.log('👥 UserList - Pagination:', pagination);

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
      {/* 🚨 Mostrar errores de conexión */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive font-semibold">Error de Conexión</CardTitle>
            <CardDescription className="text-destructive/80">
              No se pudo conectar con el servidor backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive/90 mb-4 font-medium">{error}</p>
            <Button 
              variant="outline" 
              onClick={refresh}
              disabled={loading}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Reintentar Conexión
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 🎛️ Barra de herramientas */}
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground">Gestión de Usuarios</CardTitle>
              <CardDescription className="text-muted-foreground">
                {pagination.total} usuarios registrados en el sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="bg-background border text-foreground hover:bg-accent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              {canCreateUser() && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 bg-card">
          {/* 🔍 Búsqueda y filtros */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 bg-background border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-background border text-foreground hover:bg-accent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-background border text-foreground hover:bg-accent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover border shadow-lg">
                  <DropdownMenuItem 
                    onClick={() => exportUsers('csv')}
                    className="bg-popover hover:bg-accent text-popover-foreground cursor-pointer"
                  >
                    Exportar como CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => exportUsers('excel')}
                    className="bg-popover hover:bg-accent text-popover-foreground cursor-pointer"
                  >
                    Exportar como Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 📊 Panel de filtros expandible */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30 border-border">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rol</label>
                <Select
                  value={filters.role || 'all'}
                  onValueChange={(value) => handleFilterChange('role', value)}
                >
                  <SelectTrigger className="bg-background border text-foreground">
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    <SelectItem value="all" className="bg-popover hover:bg-accent text-popover-foreground">
                      Todos los roles
                    </SelectItem>
                    {ROLE_OPTIONS.map(role => (
                      <SelectItem 
                        key={role.value} 
                        value={role.value}
                        className="bg-popover hover:bg-accent text-popover-foreground"
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Workspace</label>
                <Select
                  value={filters.workspace || 'all'}
                  onValueChange={(value) => handleFilterChange('workspace', value)}
                >
                  <SelectTrigger className="bg-background border text-foreground">
                    <SelectValue placeholder="Todos los workspaces" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    <SelectItem value="all" className="bg-popover hover:bg-accent text-popover-foreground">
                      Todos los workspaces
                    </SelectItem>
                    {WORKSPACE_OPTIONS.map(workspace => (
                      <SelectItem 
                        key={workspace.value} 
                        value={workspace.value}
                        className="bg-popover hover:bg-accent text-popover-foreground"
                      >
                        {workspace.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Estado</label>
                <Select
                  value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                  onValueChange={(value) => handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')}
                >
                  <SelectTrigger className="bg-background border text-foreground">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    <SelectItem value="all" className="bg-popover hover:bg-accent text-popover-foreground">
                      Todos
                    </SelectItem>
                    <SelectItem value="true" className="bg-popover hover:bg-accent text-popover-foreground">
                      Activos
                    </SelectItem>
                    <SelectItem value="false" className="bg-popover hover:bg-accent text-popover-foreground">
                      Inactivos
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Elementos por página</label>
                <Select
                  value={filters.limit?.toString() || '10'}
                  onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                >
                  <SelectTrigger className="bg-background border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    <SelectItem value="10" className="bg-popover hover:bg-accent text-popover-foreground">10</SelectItem>
                    <SelectItem value="25" className="bg-popover hover:bg-accent text-popover-foreground">25</SelectItem>
                    <SelectItem value="50" className="bg-popover hover:bg-accent text-popover-foreground">50</SelectItem>
                    <SelectItem value="100" className="bg-popover hover:bg-accent text-popover-foreground">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 🎯 Acciones por lotes */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <span className="text-sm font-medium text-foreground">
                {selectedUsers.length} usuario(s) seleccionado(s)
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                  className="bg-background border text-foreground hover:bg-accent"
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
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar seleccionados
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 📋 Tabla de usuarios */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-0 bg-card">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center space-x-2 text-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="font-medium">Cargando usuarios...</span>
                </div>
              </div>
            )}
            
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-foreground font-semibold">Usuario</TableHead>
                  <TableHead className="text-foreground font-semibold">Rol</TableHead>
                  <TableHead className="text-foreground font-semibold">Workspace</TableHead>
                  <TableHead className="text-foreground font-semibold">Estado</TableHead>
                  <TableHead className="text-foreground font-semibold">Último acceso</TableHead>
                  <TableHead className="w-20 text-foreground font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-background">
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <UserX className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground font-medium">
                          {loading ? 'Cargando usuarios...' : 'No se encontraron usuarios'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {getInitials(user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {renderRoleBadge(user.role)}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary/80 text-secondary-foreground">
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
                          <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {user.lastLoginAt ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {new Date(user.lastLoginAt).toLocaleDateString('es-ES')}
                                </TooltipTrigger>
                                <TooltipContent className="bg-popover border text-popover-foreground">
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border shadow-lg">
                            <DropdownMenuItem 
                              onClick={() => setViewingUser(user)}
                              className="bg-popover hover:bg-accent text-popover-foreground cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            
                            {canEditUser(user) && (
                              <DropdownMenuItem 
                                onClick={() => setEditingUser(user)}
                                className="bg-popover hover:bg-accent text-popover-foreground cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            
                            {canChangePassword(user) && (
                              <DropdownMenuItem className="bg-popover hover:bg-accent text-popover-foreground cursor-pointer">
                                <Key className="h-4 w-4 mr-2" />
                                Cambiar contraseña
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem className="bg-popover hover:bg-accent text-popover-foreground cursor-pointer">
                              <Mail className="h-4 w-4 mr-2" />
                              Reenviar verificación
                            </DropdownMenuItem>
                            
                            {canDeleteUser(user) && (
                              <>
                                <DropdownMenuSeparator className="bg-border" />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      className="text-destructive focus:text-destructive hover:bg-destructive/10 cursor-pointer"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar usuario
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-background border shadow-lg">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-foreground">¿Eliminar usuario?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-muted-foreground">
                                        Esta acción eliminará permanentemente al usuario <strong className="text-foreground">{user.fullName}</strong> 
                                        y todos sus datos asociados. Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-background border text-foreground hover:bg-accent">
                                        Cancelar
                                      </AlertDialogCancel>
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
        <Card className="border bg-card shadow-sm">
          <CardContent className="flex items-center justify-between p-4 bg-card">
            <div className="text-sm text-muted-foreground">
              Mostrando {startItem} - {endItem} de {pagination.total} usuarios
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="bg-background border text-foreground hover:bg-accent disabled:opacity-50"
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
                      className={`w-8 h-8 p-0 ${
                        page === currentPage 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-background border text-foreground hover:bg-accent"
                      }`}
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
                className="bg-background border text-foreground hover:bg-accent disabled:opacity-50"
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
