import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MultipartFile } from '@fastify/multipart'
import { documentService } from '../../services/documentService'
import { activityService } from '../../services/activityService'
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

        // 📦 Procesar datos multipart con approach manual y robusto
        const parts = request.parts()
        const formData: Record<string, string> = {}
        let uploadedFile: { filename: string; mimetype: string; buffer: Buffer } | null = null

        // 🔄 Procesar partes una por una sin await en el loop
        try {
          const partsArray = []
          for await (const part of parts) {
            partsArray.push(part)
          }

          console.log('🔍 Total parts received:', partsArray.length)

          // Procesar cada parte
          for (const part of partsArray) {
            console.log('🔍 Processing part:', {
              type: part.type,
              fieldname: part.fieldname
            })

            if (part.type === 'file') {
              const buffer = await part.toBuffer()
              uploadedFile = {
                filename: part.filename || 'unknown',
                mimetype: part.mimetype || 'application/octet-stream',
                buffer
              }
              console.log('📁 File processed:', {
                filename: uploadedFile.filename,
                mimetype: uploadedFile.mimetype,
                size: buffer.length
              })
            } else {
              // Campo de texto
              const value = part.value as string
              formData[part.fieldname] = value
              console.log('📝 Field processed:', {
                fieldname: part.fieldname,
                value: value,
                valueType: typeof value
              })
            }
          }
        } catch (error) {
          console.error('❌ Error processing multipart:', error)
          return reply.status(400).send({
            success: false,
            error: 'Invalid multipart data',
            details: 'Failed to process the multipart request'
          })
        }

        // 📁 Validar que se subió un archivo
        if (!uploadedFile) {
          return reply.status(400).send({
            success: false,
            error: 'File is required',
            details: 'No file provided in the request'
          })
        }

        // 🐛 Debug - Ver todo lo que procesamos
        console.log('🔍 Final processed data:', {
          formData,
          formDataKeys: Object.keys(formData),
          title: formData.title,
          description: formData.description,
          workspace: formData.workspace,
          tags: formData.tags,
          fileInfo: {
            filename: uploadedFile.filename,
            mimetype: uploadedFile.mimetype,
            size: uploadedFile.buffer.length
          }
        });
        
        const validationResult = uploadSchema.safeParse({
          title: formData.title,
          description: formData.description,
          workspace: formData.workspace,
          tags: formData.tags
        })

        if (!validationResult.success) {
          // 🐛 Debug - Ver el error específico de validación
          console.log('❌ Validation failed:', {
            errors: validationResult.error.errors,
            formattedErrors: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          });
          
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { title, description, workspace, tags } = validationResult.data
        
        // 🐛 Debug - Validación exitosa
        console.log('✅ Validation successful:', {
          title,
          description,
          workspace,
          workspaceType: typeof workspace,
          tags
        });

        // 📁 Validar archivo
        if (!uploadedFile.filename) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid file',
            details: 'File must have a name'
          })
        }

        // 📏 Usar el buffer que ya tenemos en memoria
        const buffer = uploadedFile.buffer
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
          uploadedFile.filename,
          uploadedFile.mimetype || 'application/octet-stream'
        )

        // 📊 Registrar actividad de creación
        await activityService.logFromRequest(
          document.id,
          user.id,
          'uploaded',
          request,
          {
            fileName: uploadedFile.filename,
            fileSize: buffer.length,
            mimeType: uploadedFile.mimetype,
            workspace: workspace,
            title: title
          }
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
