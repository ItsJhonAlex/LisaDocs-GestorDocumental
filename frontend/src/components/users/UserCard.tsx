import React from 'react';
import { User, Shield, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User as UserType } from '@/types/auth';

interface UserCardProps {
  user: UserType;
  onClick?: () => void;
}

/**
 * 🎴 Tarjeta de Usuario
 * 
 * Componente de tarjeta para mostrar información resumida de un usuario
 */
export function UserCard({ user, onClick }: UserCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className="border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground truncate">
              {user.fullName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 bg-card space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            {user.role.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {user.workspace}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {user.lastLoginAt 
              ? `Último acceso: ${new Date(user.lastLoginAt).toLocaleDateString('es-ES')}`
              : 'Nunca ha iniciado sesión'
            }
          </span>
        </div>
        
        <div className="pt-2">
          <Badge 
            variant={user.isActive ? 'default' : 'secondary'}
            className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
          >
            {user.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
