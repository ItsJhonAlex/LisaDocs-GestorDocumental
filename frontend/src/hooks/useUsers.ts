import { useState, useEffect, useCallback, useRef } from 'react';
import { userService, type UserFilters, type CreateUserData, type UpdateUserData, type UserStats } from '../services/userService';
import type { User } from '../types/auth';
import type { ApiError } from '../types/api';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * 🎣 Hook para Gestión de Usuarios
 * 
 * Proporciona estado y funciones para manejar usuarios:
 * - Lista de usuarios con filtros y paginación
 * - CRUD operations
 * - Estados de carga y error
 * - Funciones optimizadas para UI
 */
export const useUsers = (initialFilters: UserFilters = {}) => {
  // 📊 Estado principal
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  
  // 📄 Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialFilters.limit || 10,
    total: 0,
    totalPages: 0
  });

  // 🔍 Filtros
  const [filters, setFilters] = useState<UserFilters>(initialFilters);

  // ⚡ Estados de acciones específicas
  const [actionLoading, setActionLoading] = useState({
    create: false,
    update: {} as Record<string, boolean>,
    delete: {} as Record<string, boolean>
  });

  // 🎣 Hook de autenticación
  const { user: currentUser } = useAuth();

  // 📝 Ref para acceder a los filtros actuales sin dependencias
  const filtersRef = useRef(filters);
  
  // Actualizar la ref cada vez que cambien los filtros
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * 📋 Cargar lista de usuarios
   */
  const loadUsers = useCallback(async (customFilters?: UserFilters) => {
    console.log('🔄 LoadUsers llamado con filtros:', customFilters || filtersRef.current);
    setLoading(true);
    setError(null);
    
    try {
      // Usar filtros personalizados o los actuales
      const appliedFilters = customFilters || filtersRef.current;
      console.log('📤 Enviando request con filtros:', appliedFilters);
      
      const response = await userService.getUsers(appliedFilters);
      console.log('📥 Respuesta del backend:', response);
      
      setUsers(response.users);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages
      });
      
      console.log('✅ Usuarios cargados:', response.users.length);
      
      // Actualizar filtros si se proporcionaron personalizados
      if (customFilters) {
        setFilters(customFilters);
      }
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Error al cargar usuarios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // 🔥 Sin dependencias para evitar recreación

  /**
   * 📊 Cargar estadísticas de usuarios
   */
  const loadStats = useCallback(async () => {
    console.log('📊 LoadStats llamado');
    try {
      const statsData = await userService.getStats();
      console.log('📊 Stats recibidas:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ Error cargando stats:', error);
      const apiError = error as ApiError;
      console.error('Error loading stats:', apiError);
      // No mostrar toast para stats, es secundario
    }
  }, []);

  /**
   * ➕ Crear usuario
   */
  const createUser = useCallback(async (userData: CreateUserData): Promise<boolean> => {
    setActionLoading(prev => ({ ...prev, create: true }));
    
    try {
      const newUser = await userService.createUser(userData);
      
      // Agregar el nuevo usuario a la lista local
      setUsers(prev => [newUser, ...prev]);
      
      // Actualizar stats si están cargadas
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          totalUsers: prev.totalUsers + 1,
          activeUsers: newUser.isActive ? prev.activeUsers + 1 : prev.activeUsers,
          inactiveUsers: newUser.isActive ? prev.inactiveUsers : prev.inactiveUsers + 1,
          usersByRole: {
            ...prev.usersByRole,
            [newUser.role]: (prev.usersByRole[newUser.role] || 0) + 1
          },
          usersByWorkspace: {
            ...prev.usersByWorkspace,
            [newUser.workspace]: (prev.usersByWorkspace[newUser.workspace] || 0) + 1
          }
        } : null);
      }
      
      toast.success(`Usuario ${newUser.fullName} creado exitosamente`);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al crear usuario');
      return false;
    } finally {
      setActionLoading(prev => ({ ...prev, create: false }));
    }
  }, [stats]);

  /**
   * ✏️ Actualizar usuario
   */
  const updateUser = useCallback(async (id: string, userData: UpdateUserData): Promise<boolean> => {
    setActionLoading(prev => ({ 
      ...prev, 
      update: { ...prev.update, [id]: true } 
    }));
    
    try {
      const updatedUser = await userService.updateUser(id, userData);
      
      // Actualizar en la lista local
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ));
      
      toast.success(`Usuario ${updatedUser.fullName} actualizado exitosamente`);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al actualizar usuario');
      return false;
    } finally {
      setActionLoading(prev => ({ 
        ...prev, 
        update: { ...prev.update, [id]: false } 
      }));
    }
  }, []);

  /**
   * 🗑️ Eliminar usuario
   */
  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    setActionLoading(prev => ({ 
      ...prev, 
      delete: { ...prev.delete, [id]: true } 
    }));
    
    try {
      await userService.deleteUser(id);
      
      // Remover de la lista local
      const userToDelete = users.find(u => u.id === id);
      setUsers(prev => prev.filter(user => user.id !== id));
      
      // Actualizar stats si están cargadas
      if (stats && userToDelete) {
        setStats(prev => prev ? {
          ...prev,
          totalUsers: prev.totalUsers - 1,
          activeUsers: userToDelete.isActive ? prev.activeUsers - 1 : prev.activeUsers,
          inactiveUsers: userToDelete.isActive ? prev.inactiveUsers : prev.inactiveUsers - 1,
          usersByRole: {
            ...prev.usersByRole,
            [userToDelete.role]: Math.max(0, (prev.usersByRole[userToDelete.role] || 0) - 1)
          },
          usersByWorkspace: {
            ...prev.usersByWorkspace,
            [userToDelete.workspace]: Math.max(0, (prev.usersByWorkspace[userToDelete.workspace] || 0) - 1)
          }
        } : null);
      }
      
      toast.success(`Usuario ${userToDelete?.fullName || ''} eliminado exitosamente`);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al eliminar usuario');
      return false;
    } finally {
      setActionLoading(prev => ({ 
        ...prev, 
        delete: { ...prev.delete, [id]: false } 
      }));
    }
  }, [users, stats]);

  /**
   * 🔄 Cambiar contraseña
   */
  const changePassword = useCallback(async (id: string, passwordData: { currentPassword: string; newPassword: string }): Promise<boolean> => {
    try {
      await userService.changePassword(id, passwordData);
      toast.success('Contraseña actualizada exitosamente');
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al cambiar contraseña');
      return false;
    }
  }, []);

  /**
   * 📧 Reenviar verificación de email
   */
  const resendVerification = useCallback(async (id: string): Promise<boolean> => {
    try {
      await userService.resendVerification(id);
      toast.success('Email de verificación reenviado');
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al reenviar verificación');
      return false;
    }
  }, []);

  /**
   * 📥 Exportar usuarios
   */
  const exportUsers = useCallback(async (format: 'csv' | 'excel'): Promise<void> => {
    try {
      const blob = await userService.exportUsers(format, filters);
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `usuarios_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Usuarios exportados en formato ${format.toUpperCase()}`);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al exportar usuarios');
    }
  }, [filters]);

  /**
   * 🔍 Buscar usuarios
   */
  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    try {
      return await userService.searchUsers(query);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error en la búsqueda');
      return [];
    }
  }, []);

  /**
   * 📄 Cambiar página
   */
  const changePage = useCallback((page: number) => {
    const currentFilters = filtersRef.current;
    const newFilters = { ...currentFilters, offset: (page - 1) * pagination.limit };
    loadUsers(newFilters);
  }, [loadUsers, pagination.limit]);

  /**
   * 🔧 Actualizar filtros
   */
  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    const currentFilters = filtersRef.current;
    const updatedFilters = { ...currentFilters, ...newFilters, offset: 0 };
    loadUsers(updatedFilters);
  }, [loadUsers]);

  /**
   * 🔄 Refrescar datos
   */
  const refresh = useCallback(() => {
    loadUsers(); // Usará filtersRef.current automáticamente
    loadStats();
  }, [loadUsers, loadStats]);

  // 🛡️ Funciones de permisos
  const canCreateUser = useCallback(() => {
    return currentUser?.role === 'administrador' || currentUser?.role === 'presidente';
  }, [currentUser]);

  const canEditUser = useCallback((user: User) => {
    if (!currentUser) return false;
    
    // Administradores pueden editar a todos
    if (currentUser.role === 'administrador') return true;
    
    // Presidentes pueden editar a todos menos administradores
    if (currentUser.role === 'presidente' && user.role !== 'administrador') return true;
    
    // Los usuarios pueden editar su propia información básica
    if (currentUser.id === user.id) return true;
    
    return false;
  }, [currentUser]);

  const canDeleteUser = useCallback((user: User) => {
    if (!currentUser) return false;
    
    // No puede eliminarse a sí mismo
    if (currentUser.id === user.id) return false;
    
    // Administradores pueden eliminar a todos menos otros administradores
    if (currentUser.role === 'administrador' && user.role !== 'administrador') return true;
    
    // Presidentes pueden eliminar usuarios no administradores
    if (currentUser.role === 'presidente' && user.role !== 'administrador') return true;
    
    return false;
  }, [currentUser]);

  const canChangePassword = useCallback((user: User) => {
    if (!currentUser) return false;
    
    // Administradores pueden cambiar contraseñas de todos
    if (currentUser.role === 'administrador') return true;
    
    // Presidentes pueden cambiar contraseñas de no administradores
    if (currentUser.role === 'presidente' && user.role !== 'administrador') return true;
    
    return false;
  }, [currentUser]);

  // 🚀 Efecto inicial - solo se ejecuta una vez al montar
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      if (mounted) {
        await loadUsers(initialFilters);
        await loadStats();
      }
    };
    
    initializeData();
    
    return () => {
      mounted = false;
    };
  }, []);

  return {
    // 📊 Estado
    users,
    loading,
    error,
    stats,
    pagination,
    filters,
    actionLoading,

    // 🔧 Funciones principales
    loadUsers,
    loadStats,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    resendVerification,
    exportUsers,
    searchUsers,
    
    // 📄 Paginación y filtros
    changePage,
    updateFilters,
    refresh,

    // 🛡️ Permisos
    canCreateUser,
    canEditUser,
    canDeleteUser,
    canChangePassword
  };
};
