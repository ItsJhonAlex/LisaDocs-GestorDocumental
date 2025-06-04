import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MultipartFile } from '@fastify/multipart'
import { documentService } from '../../services/documentService'
import { WorkspaceType } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para el upload
const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional(),
  workspace: z.nativeEnum(WorkspaceType, { message: 'Invalid workspace' }),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()) : [])
})

// 📤 Ruta para upload de documentos
export async function uploadRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post('/', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Upload a new document',
      tags: ['Documents'],
      consumes: ['multipart/form-data'],
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
                createdAt: { type: 'string' },
                createdByUser: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    fullName: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
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
            error: 'Authentication required',
            details: 'User not authenticated'
          })
        }

        // 📦 Procesar datos multipart
        const data = await request.file()
        if (!data) {
          return reply.status(400).send({
            success: false,
            error: 'File is required',
            details: 'No file provided in the request'
          })
        }

        // 📋 Validar campos del formulario
        const fields = data.fields as any
        const validationResult = uploadSchema.safeParse({
          title: fields?.title?.value,
          description: fields?.description?.value,
          workspace: fields?.workspace?.value,
          tags: fields?.tags?.value
        })

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { title, description, workspace, tags } = validationResult.data

        // 📁 Validar archivo
        if (!data.filename) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid file',
            details: 'File must have a name'
          })
        }

        // 📏 Obtener tamaño del archivo
        const buffer = await data.toBuffer()
        const maxSize = 50 * 1024 * 1024 // 50MB
        
        if (buffer.length > maxSize) {
          return reply.status(400).send({
            success: false,
            error: 'File too large',
            details: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
          })
        }

        if (buffer.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'Empty file',
            details: 'File cannot be empty'
          })
        }

        // 🎯 Crear documento
        const document = await documentService.createDocument(
          {
            title: title as string,
            description: description as string | undefined,
            workspace: workspace as WorkspaceType,
            tags: tags as string[],
            createdBy: user.id,
            metadata: {
              uploadSource: 'api',
              userAgent: request.headers['user-agent'] || '',
              ipAddress: request.ip
            }
          },
          buffer,
          data.filename,
          data.mimetype || 'application/octet-stream'
        )

        // ✅ Respuesta exitosa
        return reply.status(201).send({
          success: true,
          message: 'Document uploaded successfully',
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
        console.error('❌ Upload error:', error)
        
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
            details: 'Failed to upload file to storage'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while uploading the document'
        })
      }
    }
  })
}
