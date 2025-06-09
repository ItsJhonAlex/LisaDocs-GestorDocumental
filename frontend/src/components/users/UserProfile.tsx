import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User as UserType } from '@/types/auth';

interface UserProfileProps {
  user: UserType;
}

/**
 * 👤 Componente de Perfil de Usuario
 * 
 * Muestra el perfil detallado de un usuario específico
 */
export function UserProfile({ user }: UserProfileProps) {
  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <User className="h-5 w-5" />
          Perfil de Usuario
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-card">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nombre</label>
            <p className="text-foreground font-medium">{user.fullName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-foreground font-medium">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Rol</label>
            <p className="text-foreground font-medium">{user.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
