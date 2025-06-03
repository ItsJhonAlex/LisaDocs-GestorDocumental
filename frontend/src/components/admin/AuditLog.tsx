import { useState } from 'react';
import { 
  Eye, 
  Search, 
  Filter, 
  Calendar,
  User,
  Shield,
  Activity,
  Download,
  Upload,
  Trash2,
  Edit,
  Clock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 🎯 Tipos para el log de auditoría
interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'document' | 'user' | 'system' | 'security';
}

// 📊 Mock data para auditoría
const mockAuditLog: AuditEntry[] = [
  {
    id: 'audit-1',
    timestamp: '2024-01-30T14:25:00Z',
    user: 'Jonathan Rodriguez',
    userRole: 'administrador',
    action: 'LOGIN',
    resource: 'Sistema',
    details: 'Inicio de sesión exitoso',
    ipAddress: '192.168.1.100',
    severity: 'low',
    category: 'auth'
  },
  {
    id: 'audit-2',
    timestamp: '2024-01-30T14:20:00Z',
    user: 'Carlos Mendoza',
    userRole: 'presidente',
    action: 'DOCUMENT_UPLOAD',
    resource: '/workspaces/presidencia',
    details: 'Subió decreto-municipal-002-2024.pdf',
    ipAddress: '192.168.1.105',
    severity: 'medium',
    category: 'document'
  },
  {
    id: 'audit-3',
    timestamp: '2024-01-30T14:15:00Z',
    user: 'Elena Rodríguez',
    userRole: 'secretario_cam',
    action: 'DOCUMENT_VIEW',
    resource: '/workspaces/cam',
    details: 'Visualizó acta-cam-enero-2024.pdf',
    ipAddress: '192.168.1.110',
    severity: 'low',
    category: 'document'
  },
  {
    id: 'audit-4',
    timestamp: '2024-01-30T14:10:00Z',
    user: 'Sistema',
    userRole: 'system',
    action: 'BACKUP_CREATED',
    resource: 'Base de datos',
    details: 'Respaldo automático completado (2.4GB)',
    ipAddress: '127.0.0.1',
    severity: 'low',
    category: 'system'
  },
  {
    id: 'audit-5',
    timestamp: '2024-01-30T13:55:00Z',
    user: 'Usuario Desconocido',
    userRole: 'unknown',
    action: 'LOGIN_FAILED',
    resource: 'Sistema',
    details: 'Intento de acceso fallido con email: hacker@test.com',
    ipAddress: '203.0.113.1',
    severity: 'high',
    category: 'security'
  }
];

/**
 * 📋 Componente de Log de Auditoría
 * 
 * Muestra el historial completo de acciones del sistema:
 * - Inicios de sesión y autenticación
 * - Operaciones con documentos
 * - Cambios de configuración
 * - Eventos de seguridad
 */
export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [filteredLogs, setFilteredLogs] = useState<AuditEntry[]>(mockAuditLog);

  // 🔍 Aplicar filtros
  const applyFilters = () => {
    let filtered = mockAuditLog;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.user.toLowerCase().includes(search) ||
        entry.action.toLowerCase().includes(search) ||
        entry.resource.toLowerCase().includes(search) ||
        entry.details.toLowerCase().includes(search)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(entry => entry.severity === selectedSeverity);
    }

    setFilteredLogs(filtered);
  };

  // 🎨 Función para obtener el ícono según la acción
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return <User className="w-4 h-4" />;
      case 'DOCUMENT_UPLOAD':
        return <Upload className="w-4 h-4" />;
      case 'DOCUMENT_VIEW':
        return <Eye className="w-4 h-4" />;
      case 'DOCUMENT_DOWNLOAD':
        return <Download className="w-4 h-4" />;
      case 'DOCUMENT_DELETE':
        return <Trash2 className="w-4 h-4" />;
      case 'DOCUMENT_EDIT':
        return <Edit className="w-4 h-4" />;
      case 'LOGIN_FAILED':
        return <Shield className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // 🎨 Función para obtener el color del badge según la severidad
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medio</Badge>;
      case 'low':
        return <Badge variant="secondary">Bajo</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  // 🕒 Formatear timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('es-ES'),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-6">
      {/* 🔍 Filtros de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Auditoría</CardTitle>
          <CardDescription>
            Busca y filtra eventos específicos en el log de auditoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="auth">Autenticación</SelectItem>
                <SelectItem value="document">Documentos</SelectItem>
                <SelectItem value="user">Usuarios</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="security">Seguridad</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={applyFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📋 Lista de eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Log de Auditoría</CardTitle>
          <CardDescription>
            Mostrando {filteredLogs.length} eventos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((entry) => {
              const { date, time } = formatTime(entry.timestamp);
              
              return (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-2 rounded-full ${
                      entry.severity === 'critical' ? 'bg-red-100' :
                      entry.severity === 'high' ? 'bg-orange-100' :
                      entry.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {getActionIcon(entry.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{entry.action.replace('_', ' ')}</span>
                        <span className="text-xs text-muted-foreground">por</span>
                        <span className="text-sm font-medium">{entry.user}</span>
                        <Badge variant="outline" className="text-xs">
                          {entry.userRole}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        {entry.details}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{date}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{time}</span>
                        </span>
                        <span>IP: {entry.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(entry.severity)}
                  </div>
                </div>
              );
            })}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay eventos</h3>
                <p className="text-muted-foreground">
                  No se encontraron eventos que coincidan con los filtros aplicados.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
