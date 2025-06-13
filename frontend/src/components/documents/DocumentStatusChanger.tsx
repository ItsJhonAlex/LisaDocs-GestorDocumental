import React, { useState } from 'react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Archive, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import type { Document } from '@/types/document'

// 📋 Tipos para el componente
interface DocumentStatusChangerProps {
  document: Document
  onStatusChange: (documentId: string, newStatus: string, reason?: string) => Promise<void>
  disabled?: boolean
  className?: string
  isOpen?: boolean
  onClose?: () => void
  hideButton?: boolean
}

// 🎨 Configuración de estados
const STATUS_CONFIG = {
  draft: {
    label: 'Borrador',
    description: 'Solo visible para el creador',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    badgeVariant: 'secondary' as const
  },
  stored: {
    label: 'Publicado',
    description: 'Visible para usuarios con permisos',
    icon: Eye,
    color: 'bg-green-100 text-green-800 border-green-200',
    badgeVariant: 'default' as const
  },
  archived: {
    label: 'Archivado',
    description: 'Documento archivado',
    icon: Archive,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    badgeVariant: 'outline' as const
  }
} as const

type DocumentStatus = keyof typeof STATUS_CONFIG

export function DocumentStatusChanger({
  document,
  onStatusChange,
  disabled = false,
  className = '',
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  hideButton = false
}: DocumentStatusChangerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>(document.status as DocumentStatus)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Usar estado externo si se proporciona, sino usar estado interno
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnClose !== undefined ? 
    (open: boolean) => !open && externalOnClose() : 
    setInternalIsOpen

  const currentStatus = document.status as DocumentStatus
  const currentConfig = STATUS_CONFIG[currentStatus]
  const selectedConfig = STATUS_CONFIG[selectedStatus]

  // 🔄 Manejar cambio de estado
  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) {
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      await onStatusChange(document.id, selectedStatus, reason.trim() || undefined)
      setIsOpen(false)
      setReason('')
    } catch (error) {
      console.error('❌ Error changing status:', error)
      // TODO: Mostrar toast de error
    } finally {
      setIsLoading(false)
    }
  }

  // 🎯 Obtener estados disponibles según el estado actual
  const getAvailableStatuses = (): DocumentStatus[] => {
    switch (currentStatus) {
      case 'draft':
        return ['draft', 'stored'] // Borrador puede ir a Publicado
      case 'stored':
        return ['stored', 'draft', 'archived'] // Publicado puede ir a Borrador o Archivado
      case 'archived':
        return ['archived', 'stored'] // Archivado puede volver a Publicado
      default:
        return ['draft', 'stored', 'archived']
    }
  }

  const availableStatuses = getAvailableStatuses()
  const CurrentIcon = currentConfig.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 🏷️ Badge del estado actual */}
      {!hideButton && (
        <Badge variant={currentConfig.badgeVariant} className="flex items-center gap-1">
          <CurrentIcon className="w-3 h-3" />
          {currentConfig.label}
        </Badge>
      )}

      {/* 🔄 Botón para cambiar estado */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {!hideButton && (
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              Cambiar Estado
            </Button>
          </DialogTrigger>
        )}

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Cambiar Estado del Documento
            </DialogTitle>
            <DialogDescription>
              Cambiar el estado de "{document.title}" afectará su visibilidad.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 📊 Estado actual */}
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <CurrentIcon className="w-4 h-4" />
                <span className="font-medium">Estado actual: {currentConfig.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentConfig.description}
              </p>
            </div>

            {/* 🎯 Selector de nuevo estado */}
            <div className="space-y-2">
              <Label htmlFor="status-select">Nuevo estado</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: DocumentStatus) => setSelectedStatus(value)}
              >
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => {
                    const config = STATUS_CONFIG[status]
                    const StatusIcon = config.icon
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {config.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 📝 Vista previa del cambio */}
            {selectedStatus !== currentStatus && (
              <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Cambio: {currentConfig.label} → {selectedConfig.label}
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  {selectedConfig.description}
                </p>
              </div>
            )}

            {/* 📝 Razón del cambio (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="reason">Razón del cambio (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Describe por qué cambias el estado del documento..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/500 caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={isLoading || selectedStatus === currentStatus}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Cambiar Estado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 🎨 Componente simple para mostrar solo el badge del estado
export function DocumentStatusBadge({ 
  status, 
  className = '' 
}: { 
  status: string
  className?: string 
}) {
  const config = STATUS_CONFIG[status as DocumentStatus]
  if (!config) return null

  const StatusIcon = config.icon

  return (
    <Badge variant={config.badgeVariant} className={`flex items-center gap-1 ${className}`}>
      <StatusIcon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
} 