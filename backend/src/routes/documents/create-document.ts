import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { WorkspaceType } from '../../generated/prisma'
import { z } from 'zod'
import * as path from 'path'
import * as fs from 'fs/promises'

// 📋 Schema de validación para crear documento
const createDocumentSchema = z.object({
  tempFileId: z.string().uuid('Invalid temp file ID'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional(),
  workspace: z.nativeEnum(WorkspaceType, { message: 'Invalid workspace' }),
  tags: z.array(z.string()).default([])
})

// 📝 Ruta para crear documento con archivo temporal y metadatos
export async function createDocumentRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post('/create-document', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Create a document using a temporary file and metadata',
      tags: ['Documents'],
      body: {
        type: 'object',
        properties: {
          tempFileId: { type: 'string', format: 'uuid' },
          title: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string' },
          workspace: { 
            type: 'string',
            enum: ['cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf']
          },
          tags: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          }
        },
        required: ['tempFileId', 'title', 'workspace']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                fileName: { type: 'string' },
                fileSize: { type: 'number' },
                mimeType: { type: 'string' },
                workspace: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 🔐 Obtener usuario autenticado
        const user = (request as any).user
        if (!user?.id) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required'
          })
        }

        // 📋 Validar datos de entrada
        const validationResult = createDocumentSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { tempFileId, title, description, workspace, tags } = validationResult.data

        console.log('📝 Creating document with metadata:', {
          tempFileId,
          title,
          description,
          workspace,
          tags,
          userId: user.id
        })

        // 📁 Buscar el archivo temporal
        const tempDir = path.join(process.cwd(), 'temp-uploads')
        const files = await fs.readdir(tempDir)
        const tempFileName = files.find(file => file.startsWith(tempFileId))

        if (!tempFileName) {
          return reply.status(404).send({
            success: false,
            error: 'Temporary file not found',
            details: 'The uploaded file has expired or does not exist'
          })
        }

        const tempFilePath = path.join(tempDir, tempFileName)
        
        // 📏 Leer el archivo temporal
        const buffer = await fs.readFile(tempFilePath)
        
        // 📄 Extraer información del archivo
        const originalFileName = tempFileName.split('_').slice(1).join('_') // Remover el tempFileId_
        const mimeType = getMimeTypeFromExtension(originalFileName)

        console.log('📁 Processing temp file:', {
          tempFilePath,
          originalFileName,
          fileSize: buffer.length,
          mimeType
        })

        // 🎯 Crear documento usando el servicio
        const document = await documentService.createDocument(
          {
            title,
            description,
            workspace,
            tags,
            createdBy: user.id,
            metadata: {
              uploadSource: 'two-step-api',
              userAgent: request.headers['user-agent'] || '',
              ipAddress: request.ip,
              tempFileId
            }
          },
          buffer,
          originalFileName,
          mimeType
        )

        // 🧹 Limpiar archivo temporal
        try {
          await fs.unlink(tempFilePath)
          console.log('🧹 Temporary file cleaned up:', tempFilePath)
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temp file:', cleanupError)
          // No falla la operación si no se puede limpiar
        }

        console.log('✅ Document created successfully:', {
          documentId: document.id,
          title: document.title,
          workspace: document.workspace
        })

        // ✅ Respuesta exitosa
        return reply.status(201).send({
          success: true,
          message: 'Document created successfully',
          data: {
            id: document.id,
            title: document.title,
            description: document.description,
            fileName: document.fileName,
            fileSize: Number(document.fileSize),
            mimeType: document.mimeType,
            workspace: document.workspace,
            status: document.status,
            tags: document.tags,
            createdAt: document.createdAt.toISOString(),
            createdByUser: document.createdByUser
          }
        })

      } catch (error: any) {
        console.error('❌ Document creation error:', error)
        
        // 🛡️ Manejo de errores específicos
        if (error.message.includes('File type') && error.message.includes('not allowed')) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid file type',
            details: error.message
          })
        }

        if (error.message.includes('MinIO') || error.message.includes('Failed to upload')) {
          return reply.status(500).send({
            success: false,
            error: 'Storage error',
            details: 'Failed to store the document'
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while creating the document'
        })
      }
    }
  })
}

// 🎯 Función helper para obtener MIME type desde extensión
function getMimeTypeFromExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  }
  
  return mimeTypes[ext] || 'application/octet-stream'
} 