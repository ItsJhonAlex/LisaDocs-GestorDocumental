import React from 'react';
import { Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { UserRole } from '@/types/auth';

interface RoleSelectorProps {
  value: UserRole | '';
  onChange: (value: UserRole) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

// 🎨 Configuración de roles
const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'administrador', label: 'Administrador', description: 'Acceso total al sistema' },
  { value: 'presidente', label: 'Presidente', description: 'Gestión ejecutiva principal' },
  { value: 'vicepresidente', label: 'Vicepresidente', description: 'Gestión ejecutiva secundaria' },
  { value: 'secretario_cam', label: 'Secretario CAM', description: 'Cámara de Comercio' },
  { value: 'secretario_ampp', label: 'Secretario AMPP', description: 'Asociación de Municipios' },
  { value: 'secretario_cf', label: 'Secretario CF', description: 'Comisiones de Fiscalización' },
  { value: 'intendente', label: 'Intendente', description: 'Gestión territorial' },
  { value: 'cf_member', label: 'Miembro CF', description: 'Miembro de comisiones' }
];

/**
 * 🛡️ Selector de Roles
 * 
 * Componente para seleccionar el rol de un usuario
 */
export function RoleSelector({ 
  value, 
  onChange, 
  disabled = false, 
  label = "Rol del Usuario",
  placeholder = "Seleccionar rol"
}: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      <div className="relative">
        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
        <Select
          value={value}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger className="pl-9 bg-background border text-foreground">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-solid border shadow-lg">
            {ROLE_OPTIONS.map((role) => (
              <SelectItem 
                key={role.value} 
                value={role.value}
                className="bg-solid hover:bg-accent text-foreground cursor-pointer"
              >
                <div>
                  <div className="font-medium">{role.label}</div>
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
