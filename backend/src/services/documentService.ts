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
      await this.logDocumentActivity(document.id, documentData.createdBy, 'document_created', {
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        workspace: documentData.workspace
      })

      return document as DocumentWithDetails

    } catch (error) {
      console.error('❌ Error creating document:', error)
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📋 Obtener lista de documentos con filtros
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
        orderDirection = 'desc'
      } = filters

      // 🔍 Construir filtros para Prisma
      const where: any = {}

      if (workspace) where.workspace = workspace
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
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { fileName: { contains: search, mode: 'insensitive' } }
        ]
      }

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
      await this.logDocumentActivity(id, userId, 'document_updated', updateData)

      return document as DocumentWithDetails

    } catch (error) {
      console.error('❌ Error updating document:', error)
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔄 Cambiar estado del documento
   */
  async changeDocumentStatus(
    id: string,
    newStatus: DocumentStatus,
    userId: string
  ): Promise<DocumentWithDetails> {
    try {
      const updateData: any = { status: newStatus, updatedAt: new Date() }

      // 📅 Establecer fechas según el estado
      if (newStatus === DocumentStatus.stored) {
        updateData.storedAt = new Date()
      } else if (newStatus === DocumentStatus.archived) {
        updateData.archivedAt = new Date()
      }

      const document = await prisma.document.update({
        where: { id },
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
      await this.logDocumentActivity(id, userId, 'status_changed', {
        newStatus,
        previousStatus: DocumentStatus.draft // TODO: Obtener el estado anterior
      })

      return document as DocumentWithDetails

    } catch (error) {
      console.error('❌ Error changing document status:', error)
      throw new Error(`Failed to change document status: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
