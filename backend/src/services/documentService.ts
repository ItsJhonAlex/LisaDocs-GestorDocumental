import { prisma } from '../config/database'
import { fileService, UploadResult } from './fileService'
// Importar tipos y enums desde la ubicación generada por Prisma
import { 
  Document, 
  DocumentStatus, 
  WorkspaceType, 
  User 
} from '../generated/prisma'
// Importar constantes para validaciones
import { VALIDATION_CONFIG } from '../config/constants'

// 📋 Tipos para el servicio
export interface CreateDocumentData {
  title: string
  description?: string
  tags?: string[]
  metadata?: Record<string, any>
  workspace: WorkspaceType
  createdBy: string
}

export interface UpdateDocumentData {
  title?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface DocumentListFilters {
  workspace?: WorkspaceType
  status?: DocumentStatus
  createdBy?: string
  search?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
  orderBy?: 'createdAt' | 'updatedAt' | 'title' | 'fileSize'
  orderDirection?: 'asc' | 'desc'
  requestingUserId?: string
}

export interface DocumentWithDetails extends Document {
  createdByUser: Pick<User, 'id' | 'fullName' | 'email' | 'role'>
}

// 🚀 Servicio de documentos
export class DocumentService {
  
  /**
   * 📤 Crear documento con archivo
   */
  async createDocument(
    documentData: CreateDocumentData,
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string
  ): Promise<DocumentWithDetails> {
    try {
      // ✅ Validar datos del documento
      if (!documentData.title || documentData.title.trim().length < VALIDATION_CONFIG.DOCUMENT.TITLE_MIN_LENGTH) {
        throw new Error(`Document title must be at least ${VALIDATION_CONFIG.DOCUMENT.TITLE_MIN_LENGTH} characters long`)
      }

      if (documentData.title.length > VALIDATION_CONFIG.DOCUMENT.TITLE_MAX_LENGTH) {
        throw new Error(`Document title cannot exceed ${VALIDATION_CONFIG.DOCUMENT.TITLE_MAX_LENGTH} characters`)
      }

      if (documentData.description && documentData.description.length > VALIDATION_CONFIG.DOCUMENT.DESCRIPTION_MAX_LENGTH) {
        throw new Error(`Document description cannot exceed ${VALIDATION_CONFIG.DOCUMENT.DESCRIPTION_MAX_LENGTH} characters`)
      }

      if (documentData.tags && documentData.tags.length > VALIDATION_CONFIG.DOCUMENT.MAX_TAGS) {
        throw new Error(`Document cannot have more than ${VALIDATION_CONFIG.DOCUMENT.MAX_TAGS} tags`)
      }

      // ✅ Validar tamaño de archivo
      if (fileBuffer.length > VALIDATION_CONFIG.FILE.MAX_SIZE_BYTES) {
        throw new Error(`File size exceeds maximum allowed size of ${VALIDATION_CONFIG.FILE.MAX_SIZE_BYTES / (1024 * 1024)}MB`)
      }

      // ✅ Validar tipo de archivo
      if (!fileService.validateFileType(mimeType)) {
        throw new Error(`File type ${mimeType} is not allowed`)
      }

      // 📤 Subir archivo a MinIO
      const uploadResult: UploadResult = await fileService.uploadFile(
        fileBuffer,
        originalFileName,
        mimeType,
        documentData.workspace,
        documentData.createdBy
      )

      // 💾 Crear documento en la base de datos
      const document = await prisma.document.create({
        data: {
          title: documentData.title,
          description: documentData.description,
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          fileSize: BigInt(uploadResult.fileSize),
          mimeType: uploadResult.mimeType,
          fileHash: uploadResult.fileHash,
          workspace: documentData.workspace,
          tags: documentData.tags || [],
          metadata: {
            ...documentData.metadata,
            bucket: uploadResult.bucket,
            objectName: uploadResult.objectName,
            uploadTimestamp: new Date().toISOString()
          },
          createdBy: documentData.createdBy,
          status: DocumentStatus.draft
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      })

      // 📊 Registrar actividad
      await prisma.documentActivity.create({
        data: {
          documentId: document.id,
          userId: documentData.createdBy,
          action: 'document_created',
          details: {
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            workspace: documentData.workspace
          },
          createdAt: new Date()
        }
      }).catch(error => {
        console.error('❌ Error logging document activity:', error)
      })

      return document as DocumentWithDetails

    } catch (error) {
      console.error('❌ Error creating document:', error)
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📋 Obtener lista de documentos con filtros y control de acceso
   */
  async getDocuments(filters: DocumentListFilters = {}): Promise<{
    documents: DocumentWithDetails[]
    total: number
    hasMore: boolean
  }> {
    try {
      const {
        workspace,
        status,
        createdBy,
        search,
        tags,
        dateFrom,
        dateTo,
        limit = 20,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc',
        requestingUserId
      } = filters

      // 🔍 Importar servicios necesarios
      const { permissionService } = await import('./permissionService')
      const { userService } = await import('./userService')

      // 🔐 Construir filtros con control de acceso
      const where: any = {}

      // 🏢 Control de acceso por usuario y permisos
      if (requestingUserId) {
        const requestingUser = await userService.getUserById(requestingUserId)
        
        if (!requestingUser) {
          throw new Error('Usuario no encontrado')
        }

        // 🔐 Administradores pueden ver todo
        if (requestingUser.role !== 'administrador') {
          // 👤 Los usuarios solo pueden ver:
          // 1. Sus propios documentos
          // 2. Documentos de workspaces a los que tienen acceso
          
          const accessibleWorkspaces: WorkspaceType[] = []
          
          // 🏢 Verificar acceso a cada workspace
          for (const ws of Object.values(WorkspaceType)) {
            const hasAccess = await permissionService.checkWorkspaceAccess(requestingUserId, ws)
            if (hasAccess.hasAccess) {
              accessibleWorkspaces.push(ws)
            }
          }

          // 🔍 Filtrar por documentos propios O documentos de workspaces accesibles
          where.OR = [
            // Documentos creados por el usuario
            { createdBy: requestingUserId },
            // Documentos de workspaces accesibles
            { 
              workspace: { 
                in: accessibleWorkspaces 
              }
            }
          ]
        }
      }

      // 🔍 Aplicar filtros adicionales
      if (workspace) {
        // Si se especifica workspace, verificar que el usuario tiene acceso
        if (requestingUserId) {
          const hasAccess = await permissionService.checkWorkspaceAccess(requestingUserId, workspace)
          if (!hasAccess.hasAccess) {
            // Si no tiene acceso al workspace, solo mostrar sus propios documentos de ese workspace
            where.AND = [
              { workspace },
              { createdBy: requestingUserId }
            ]
          } else {
            where.workspace = workspace
          }
        } else {
          where.workspace = workspace
        }
      }
      
      if (status) where.status = status
      if (createdBy) where.createdBy = createdBy
      if (tags && tags.length > 0) {
        where.tags = {
          hasEvery: tags
        }
      }

      // 📅 Filtros de fecha
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = dateFrom
        if (dateTo) where.createdAt.lte = dateTo
      }

      // 🔍 Búsqueda de texto
      if (search) {
        const searchConditions = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { fileName: { contains: search, mode: 'insensitive' } }
        ]
        
        if (where.OR) {
          // Si ya hay condiciones OR por permisos, combinarlas
          where.AND = [
            { OR: where.OR },
            { OR: searchConditions }
          ]
          delete where.OR
        } else {
          where.OR = searchConditions
        }
      }

      console.log('🔍 Document query filters:', JSON.stringify(where, null, 2))

      // 📊 Obtener total y documentos
      const [total, documents] = await Promise.all([
        prisma.document.count({ where }),
        prisma.document.findMany({
          where,
          include: {
            createdByUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { [orderBy]: orderDirection },
          skip: offset,
          take: limit
        })
      ])

      return {
        documents: documents as DocumentWithDetails[],
        total,
        hasMore: offset + limit < total
      }

    } catch (error) {
      console.error('❌ Error getting documents:', error)
      throw new Error(`Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📄 Obtener documento por ID
   */
  async getDocumentById(id: string): Promise<DocumentWithDetails | null> {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      })

      return document as DocumentWithDetails | null

    } catch (error) {
      console.error('❌ Error getting document by ID:', error)
      throw new Error(`Failed to get document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ✏️ Actualizar documento
   */
  async updateDocument(
    id: string,
    updateData: UpdateDocumentData,
    userId: string
  ): Promise<DocumentWithDetails> {
    try {
      const document = await prisma.document.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      })

      // 📊 Registrar actividad
      await prisma.documentActivity.create({
        data: {
          documentId: id,
          userId: userId,
          action: 'document_updated',
          details: updateData as any,
          createdAt: new Date()
        }
      }).catch(error => {
        console.error('❌ Error logging document activity:', error)
      })

      return document as DocumentWithDetails

    } catch (error) {
      console.error('❌ Error updating document:', error)
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔄 Cambiar estado de documento con validaciones de permisos
   */
  async changeDocumentStatus(
    documentId: string, 
    newStatus: DocumentStatus, 
    userId: string,
    reason?: string
  ): Promise<Document> {
    try {
      // 📄 Obtener documento actual
      const document = await this.getDocumentById(documentId)
      if (!document) {
        throw new Error('Document not found')
      }

      // 🔐 Verificar permisos para cambiar estado
      const canChangeStatus = await this.canUserChangeDocumentStatus(
        userId, 
        document, 
        newStatus
      )

      if (!canChangeStatus.allowed) {
        throw new Error(canChangeStatus.reason || 'Permission denied to change document status')
      }

      // 📝 Preparar datos de actualización
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      }

      // 📅 Establecer timestamps según el estado
      switch (newStatus) {
        case 'stored':
          updateData.storedAt = new Date()
          break
        case 'archived':
          updateData.archivedAt = new Date()
          break
        case 'draft':
          // Limpiar timestamps si vuelve a borrador
          updateData.storedAt = null
          updateData.archivedAt = null
          break
      }

      // 💾 Actualizar documento
      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: updateData,
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      })

      // 📊 Registrar actividad
      await this.logDocumentActivity(
        documentId,
        userId,
        'status_changed',
        {
          previousStatus: document.status,
          newStatus: newStatus,
          reason: reason || 'Status changed',
          timestamp: new Date().toISOString()
        }
      )

      console.log('✅ Document status changed successfully:', {
        documentId,
        previousStatus: document.status,
        newStatus,
        changedBy: userId,
        reason
      })

      return updatedDocument

    } catch (error) {
      console.error('❌ Error changing document status:', error)
      throw new Error(`Failed to change document status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔐 Verificar si un usuario puede cambiar el estado de un documento
   */
  private async canUserChangeDocumentStatus(
    userId: string,
    document: Document,
    newStatus: DocumentStatus
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { userService } = await import('./userService')
      const { permissionService } = await import('./permissionService')

      const user = await userService.getUserById(userId)
      if (!user) {
        return { allowed: false, reason: 'User not found' }
      }

      // 🔐 Administradores pueden cambiar cualquier estado
      if (user.role === 'administrador') {
        return { allowed: true }
      }

      // 👤 El creador puede cambiar el estado de sus propios documentos
      if (document.createdBy === userId) {
        // ✅ Puede cambiar de draft a stored
        if (document.status === 'draft' && newStatus === 'stored') {
          return { allowed: true }
        }
        
        // ✅ Puede cambiar de stored a draft (si tiene permisos)
        if (document.status === 'stored' && newStatus === 'draft') {
          return { allowed: true }
        }

        // ✅ Puede archivar sus propios documentos
        if (newStatus === 'archived') {
          return { allowed: true }
        }

        // ✅ Puede restaurar desde archived si es el creador
        if (document.status === 'archived' && newStatus === 'stored') {
          return { allowed: true }
        }
      }

      // 🏢 Verificar permisos del workspace para usuarios con roles especiales
      const workspaceAccess = await permissionService.checkWorkspaceAccess(userId, document.workspace)
      
      if (!workspaceAccess.hasAccess) {
        return { allowed: false, reason: 'No access to document workspace' }
      }

      // 👑 Presidente y vicepresidente pueden cambiar estados en cualquier workspace
      if (['presidente', 'vicepresidente'].includes(user.role)) {
        return { allowed: true }
      }

      // 📝 Secretarios pueden cambiar estados en su workspace
      if (['secretario_cam', 'secretario_ampp', 'secretario_cf'].includes(user.role)) {
        if (user.workspace === document.workspace) {
          return { allowed: true }
        }
      }

      // 🏢 Intendente puede cambiar estados en intendencia
      if (user.role === 'intendente' && document.workspace === 'intendencia') {
        return { allowed: true }
      }

      // 👥 Miembros CF pueden cambiar estados en comisiones_cf
      if (user.role === 'cf_member' && document.workspace === 'comisiones_cf') {
        return { allowed: true }
      }

      return { allowed: false, reason: 'Insufficient permissions to change document status' }

    } catch (error) {
      console.error('❌ Error checking status change permissions:', error)
      return { allowed: false, reason: 'Error checking permissions' }
    }
  }

  /**
   * 📋 Obtener documentos con filtros de visibilidad según permisos
   */
  async getDocumentsWithVisibilityFilter(
    userId: string,
    filters: {
      workspace?: WorkspaceType
      status?: DocumentStatus[]
      search?: string
      tags?: string[]
      limit?: number
      offset?: number
      dateFrom?: string
      dateTo?: string
    } = {}
  ): Promise<{ documents: Document[]; total: number; hasMore: boolean }> {
    try {
      const { userService } = await import('./userService')
      const { permissionService } = await import('./permissionService')

      const user = await userService.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // 🔍 Construir filtros de visibilidad
      const visibilityFilters: any = {}

      // 🔐 Administradores ven todo
      if (user.role === 'administrador') {
        // Sin filtros adicionales - ven todo
      }
      // 👑 Presidente y vicepresidente ven todo
      else if (['presidente', 'vicepresidente'].includes(user.role)) {
        // Sin filtros adicionales - ven todo
      }
      // 👤 Usuarios normales: ven sus borradores + documentos stored con permisos
      else {
        visibilityFilters.OR = [
          // 📝 Sus propios documentos (cualquier estado)
          { createdBy: userId },
          // 📄 Documentos stored en workspaces con acceso
          {
            status: 'stored',
            workspace: {
              in: await this.getAccessibleWorkspaces(userId)
            }
          }
        ]
      }

      // 🔍 Construir filtros completos
      const whereClause: any = {
        ...visibilityFilters
      }

      // 🏢 Filtro por workspace
      if (filters.workspace) {
        // Verificar acceso al workspace
        const workspaceAccess = await permissionService.checkWorkspaceAccess(userId, filters.workspace)
        if (!workspaceAccess.hasAccess && user.role !== 'administrador') {
          return { documents: [], total: 0, hasMore: false }
        }
        whereClause.workspace = filters.workspace
      }

      // 📊 Filtro por estado
      if (filters.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status }
      }

      // 🔍 Filtro por búsqueda
      if (filters.search) {
        whereClause.OR = [
          ...(whereClause.OR || []),
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { fileName: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // 🏷️ Filtro por tags
      if (filters.tags && filters.tags.length > 0) {
        whereClause.tags = { hasEvery: filters.tags }
      }

      // 📅 Filtro por fechas
      if (filters.dateFrom || filters.dateTo) {
        whereClause.createdAt = {}
        if (filters.dateFrom) {
          whereClause.createdAt.gte = new Date(filters.dateFrom)
        }
        if (filters.dateTo) {
          whereClause.createdAt.lte = new Date(filters.dateTo)
        }
      }

      // 📊 Obtener total
      const total = await prisma.document.count({ where: whereClause })

      // 📄 Obtener documentos
      const limit = Math.min(filters.limit || 20, 100)
      const offset = filters.offset || 0

      const documents = await prisma.document.findMany({
        where: whereClause,
        include: {
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      const hasMore = offset + documents.length < total

      console.log('📋 Documents retrieved with visibility filter:', {
        userId,
        userRole: user.role,
        totalFound: documents.length,
        totalAvailable: total,
        hasMore,
        filters
      })

      return { documents, total, hasMore }

    } catch (error) {
      console.error('❌ Error getting documents with visibility filter:', error)
      throw new Error(`Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🏢 Obtener workspaces accesibles para un usuario
   */
  private async getAccessibleWorkspaces(userId: string): Promise<WorkspaceType[]> {
    try {
      const { userService } = await import('./userService')
      const { permissionService } = await import('./permissionService')

      const user = await userService.getUserById(userId)
      if (!user) {
        return []
      }

      // 🔐 Administradores acceden a todo
      if (user.role === 'administrador') {
        return ['cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf']
      }

      // 👑 Presidente y vicepresidente acceden a todo
      if (['presidente', 'vicepresidente'].includes(user.role)) {
        return ['cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf']
      }

      const accessibleWorkspaces: WorkspaceType[] = []

      // �� Verificar acceso a cada workspace
      const allWorkspaces: WorkspaceType[] = ['cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf']
      
      for (const workspace of allWorkspaces) {
        const access = await permissionService.checkWorkspaceAccess(userId, workspace)
        if (access.hasAccess) {
          accessibleWorkspaces.push(workspace)
        }
      }

      return accessibleWorkspaces

    } catch (error) {
      console.error('❌ Error getting accessible workspaces:', error)
      return []
    }
  }

  /**
   * 📥 Obtener archivo del documento
   */
  async getDocumentFile(id: string): Promise<{
    buffer: Buffer
    fileName: string
    mimeType: string
  }> {
    try {
      const document = await this.getDocumentById(id)
      
      if (!document) {
        throw new Error('Document not found')
      }

      const metadata = document.metadata as any
      const buffer = await fileService.getFile(metadata.bucket, metadata.objectName)

      return {
        buffer,
        fileName: document.fileName,
        mimeType: document.mimeType
      }

    } catch (error) {
      console.error('❌ Error getting document file:', error)
      throw new Error(`Failed to get document file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔗 Generar URL de descarga
   */
  async generateDownloadUrl(id: string, expirySeconds: number = 3600): Promise<string> {
    try {
      const document = await this.getDocumentById(id)
      
      if (!document) {
        throw new Error('Document not found')
      }

      const metadata = document.metadata as any
      return await fileService.generateDownloadUrl(metadata.bucket, metadata.objectName, expirySeconds)

    } catch (error) {
      console.error('❌ Error generating download URL:', error)
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🗑️ Eliminar documento (lógico)
   */
  async deleteDocument(id: string, userId: string): Promise<void> {
    try {
      const document = await this.getDocumentById(id)
      
      if (!document) {
        throw new Error('Document not found')
      }

      // 🗑️ Eliminar archivo de MinIO
      const metadata = document.metadata as any
      await fileService.deleteFile(metadata.bucket, metadata.objectName)

      // 💾 Eliminar registro de la base de datos
      await prisma.document.delete({
        where: { id }
      })

      // 📊 Registrar actividad
      await this.logDocumentActivity(id, userId, 'document_deleted', {
        fileName: document.fileName,
        workspace: document.workspace
      })

    } catch (error) {
      console.error('❌ Error deleting document:', error)
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📊 Obtener estadísticas de documentos
   */
  async getDocumentStats(workspace?: WorkspaceType): Promise<{
    total: number
    byStatus: Record<DocumentStatus, number>
    byWorkspace: Record<WorkspaceType, number>
    totalSize: string
  }> {
    try {
      const where = workspace ? { workspace } : {}

      const [
        total,
        byStatus,
        byWorkspace,
        sizeAgg
      ] = await Promise.all([
        prisma.document.count({ where }),
        prisma.document.groupBy({
          by: ['status'],
          where,
          _count: true
        }),
        prisma.document.groupBy({
          by: ['workspace'],
          _count: true
        }),
        prisma.document.aggregate({
          where,
          _sum: { fileSize: true }
        })
      ])

      // 📈 Formatear resultados
      const statusStats = byStatus.reduce((acc: Record<DocumentStatus, number>, item: { status: DocumentStatus; _count: number }) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<DocumentStatus, number>)

      const workspaceStats = byWorkspace.reduce((acc: Record<WorkspaceType, number>, item: { workspace: WorkspaceType; _count: number }) => {
        acc[item.workspace] = item._count
        return acc
      }, {} as Record<WorkspaceType, number>)

      const totalSizeBytes = Number(sizeAgg._sum.fileSize || 0)
      const totalSize = this.formatFileSize(totalSizeBytes)

      return {
        total,
        byStatus: statusStats,
        byWorkspace: workspaceStats,
        totalSize
      }

    } catch (error) {
      console.error('❌ Error getting document stats:', error)
      throw new Error(`Failed to get document stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📊 Registrar actividad del documento
   */
  private async logDocumentActivity(
    documentId: string,
    userId: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.documentActivity.create({
        data: {
          documentId,
          userId,
          action,
          details,
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('❌ Error logging document activity:', error)
      // No re-lanzar el error para no interrumpir la operación principal
    }
  }

  /**
   * 📏 Formatear tamaño de archivo
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = (bytes / Math.pow(1024, i)).toFixed(2)
    
    return `${size} ${sizes[i]}`
  }
}

// 🎯 Instancia singleton del servicio
export const documentService = new DocumentService()