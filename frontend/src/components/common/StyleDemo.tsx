import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * 🎨 Componente de demostración de estilos
 * Para verificar que no hay elementos transparentes
 */
export function StyleDemo() {
  const [selectedValue, setSelectedValue] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6 p-6">
      {/* 📊 Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Demo de Estilos Actualizados</h1>
        <p className="text-muted-foreground">
          Verificando que todos los componentes tienen fondos sólidos - incluye menús corregidos
        </p>
      </div>

      <Separator />

      {/* 🎯 Grid de componentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 📄 Card básica */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Card Básica</CardTitle>
            <CardDescription>
              Esta card debe tener fondo sólido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Input con fondo sólido" />
            <div className="flex gap-2">
              <Button variant="default">Primario</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </CardContent>
        </Card>

        {/* 🎯 Select Components Corregidos */}
        <Card className="bg-card-solid shadow-medium">
          <CardHeader>
            <CardTitle>Select Corregidos</CardTitle>
            <CardDescription>
              Menús con fondos sólidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rol del Usuario</Label>
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-solid border shadow-lg">
                  <SelectItem value="admin" className="bg-solid hover:bg-accent text-foreground">
                    <div>
                      <div className="font-medium">Administrador</div>
                      <div className="text-xs text-muted-foreground">Acceso total</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="user" className="bg-solid hover:bg-accent text-foreground">
                    <div>
                      <div className="font-medium">Usuario</div>
                      <div className="text-xs text-muted-foreground">Acceso limitado</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Workspace</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Seleccionar workspace" />
                </SelectTrigger>
                <SelectContent className="bg-solid border shadow-lg">
                  <SelectItem value="presidencia" className="bg-solid hover:bg-accent text-foreground">
                    Presidencia
                  </SelectItem>
                  <SelectItem value="intendencia" className="bg-solid hover:bg-accent text-foreground">
                    Intendencia
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 🌟 Card con badges */}
        <Card className="bg-card-solid shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Badges & Estados
              <Badge variant="default">Nuevo</Badge>
            </CardTitle>
            <CardDescription>
              Diferentes variantes de badges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 🎨 Card con colores de fondo */}
        <Card className="bg-muted-solid">
          <CardHeader>
            <CardTitle>Fondos Sólidos</CardTitle>
            <CardDescription>
              Diferentes fondos sin transparencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-solid rounded-md border">
              <p className="text-sm">Fondo principal sólido</p>
            </div>
            <div className="p-3 bg-card-solid rounded-md border">
              <p className="text-sm">Fondo de card sólido</p>
            </div>
            <div className="p-3 bg-secondary rounded-md">
              <p className="text-sm">Fondo secundario</p>
            </div>
          </CardContent>
        </Card>

        {/* ✨ Card con efectos de sombra */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Sombras Suaves</CardTitle>
            <CardDescription>
              Card con sombra suave
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Botón de prueba</Button>
          </CardContent>
        </Card>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle>Sombras Fuertes</CardTitle>
            <CardDescription>
              Card con sombra fuerte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Botón outline
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 🔄 Sección de elementos interactivos */}
      <Card className="animate-slide-in">
        <CardHeader>
          <CardTitle>Elementos Interactivos Corregidos</CardTitle>
          <CardDescription>
            Formularios y controles con fondos sólidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Escribe tu nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" placeholder="Descripción del documento..." rows={3} />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="ghost">Cancelar</Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Abrir Dialog</Button>
              </DialogTrigger>
              <DialogContent className="bg-solid">
                <DialogHeader>
                  <DialogTitle>Dialog Corregido</DialogTitle>
                  <DialogDescription>
                    Este dialog debe tener fondo sólido
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selección en Dialog</Label>
                    <Select>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Seleccionar opción" />
                      </SelectTrigger>
                      <SelectContent className="bg-solid border shadow-lg">
                        <SelectItem value="opcion1" className="bg-solid hover:bg-accent text-foreground">
                          Opción 1
                        </SelectItem>
                        <SelectItem value="opcion2" className="bg-solid hover:bg-accent text-foreground">
                          Opción 2
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input placeholder="Input en dialog" />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 Información de debug actualizada */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Estado de Correcciones ✅</CardTitle>
          <CardDescription>
            Elementos corregidos para eliminar transparencias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>✅ Variables CSS configuradas</p>
            <p>✅ Componentes con fondos sólidos</p>
            <p>✅ SelectContent corregidos (bg-solid)</p>
            <p>✅ Dialog backgrounds corregidos</p>
            <p>✅ Input/Textarea backgrounds sólidos</p>
            <p>✅ DocumentUpload menu corregido</p>
            <p>✅ CreateUserDialog corregido</p>
            <p>✅ EditUserDialog corregido</p>
            <p>✅ UserList selects corregidos</p>
            <p>✅ RoleSelector corregido</p>
            <p>✅ Table headers con bg-muted-solid</p>
            <p>✅ Loading overlays mejorados</p>
            <p>✅ Hover states sólidos</p>
            <p>✅ Sombras personalizadas activas</p>
            <p>✅ Animaciones funcionando</p>
            <p>✅ Modo oscuro soportado</p>
            <p>🎯 <strong>TODOS LOS ELEMENTOS TRANSPARENTES CORREGIDOS</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 