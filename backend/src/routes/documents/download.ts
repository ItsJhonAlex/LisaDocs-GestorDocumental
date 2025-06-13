import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { z } from 'zod'

// 📋 Schema de validación para parámetros
const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

// 📋 Schema para query parameters
const querySchema = z.object({
  inline: z.string().optional().transform(val => val === 'true')
})

type DownloadParams = z.infer<typeof paramsSchema>
type DownloadQuery = z.infer<typeof querySchema>

// 📥 Ruta para descargar documentos
export async function downloadRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/:id/download', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Download a document file',
      tags: ['Documents'],
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            format: 'uuid',
            description: 'Document UUID' 
          }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          inline: { 
            type: 'string',
            enum: ['true', 'false'],
            description: 'Whether to display inline or force download' 
          }
        }
      },
      response: {
        200: {
          description: 'File content',
          type: 'string',
          format: 'binary'
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
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

    handler: async (request: FastifyRequest<{ Params: DownloadParams, Querystring: DownloadQuery }>, reply: FastifyReply) => {
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

        // 📋 Validar parámetros
        const paramsValidation = paramsSchema.safeParse(request.params)
        if (!paramsValidation.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid document ID',
            details: paramsValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const queryValidation = querySchema.safeParse(request.query)
        if (!queryValidation.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid query parameters',
            details: queryValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { id } = paramsValidation.data
        const { inline = false } = queryValidation.data

        // 📄 Verificar que el documento existe
        const document = await documentService.getDocumentById(id)
        
        if (!document) {
          return reply.status(404).send({
            success: false,
            error: 'Document not found',
            details: `No document found with ID: ${id}`
          })
        }

        // 🔐 Verificar permisos de descarga
        const { permissionService } = await import('../../services/permissionService')
        
        // 🔍 El usuario puede descargar si:
        // 1. Es el creador del documento
        // 2. Tiene permisos para ver/descargar del workspace del documento
        // 3. Es administrador
        
        let hasDownloadAccess = false
        
        // 👑 Administradores tienen acceso total
        if (user.role === 'administrador') {
          hasDownloadAccess = true
        }
        // 👤 Creador del documento siempre tiene acceso
        else if (document.createdBy === user.id) {
          hasDownloadAccess = true
        }
        // 🏢 Verificar permisos del workspace
        else {
          const workspaceAccess = await permissionService.checkWorkspaceAccess(user.id, document.workspace)
          // Verificar si tiene permisos específicos de descarga
          hasDownloadAccess = workspaceAccess.hasAccess && workspaceAccess.permissions.includes('download')
        }
        
        if (!hasDownloadAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Download access denied',
            details: 'You do not have permission to download this document'
          })
        }

        console.log('📥 Document download access granted:', {
          documentId: id,
          documentTitle: document.title,
          documentCreator: document.createdBy,
          requestingUser: user.id,
          userRole: user.role,
          workspace: document.workspace,
          accessReason: user.role === 'administrador' ? 'admin' : 
                       document.createdBy === user.id ? 'owner' : 'workspace_permission'
        })

        // 📥 Obtener archivo del documento
        const fileData = await documentService.getDocumentFile(id)

        // 🔍 Debug: Mostrar información del archivo
        console.log('🔍 Debug: File data from service:', {
          fileName: fileData.fileName,
          mimeType: fileData.mimeType,
          bufferSize: fileData.buffer.length
        })

        // 🏷️ Configurar headers de respuesta
        const disposition = inline ? 'inline' : 'attachment'
        const fileName = encodeURIComponent(fileData.fileName)
        
        console.log('🔍 Debug: Setting headers:', {
          disposition,
          originalFileName: fileData.fileName,
          encodedFileName: fileName,
          contentDisposition: `${disposition}; filename*=UTF-8''${fileName}`
        })
        
        reply.header('Content-Type', fileData.mimeType)
        reply.header('Content-Disposition', `${disposition}; filename*=UTF-8''${fileName}`)
        reply.header('Content-Length', fileData.buffer.length.toString())
        reply.header('Cache-Control', 'private, max-age=3600') // Cache por 1 hora
        reply.header('Last-Modified', new Date().toUTCString())

        // 📊 Registrar actividad de descarga
        const { prisma } = await import('../../config/database')
        await prisma.documentActivity.create({
          data: {
            documentId: id,
            userId: user.id,
            action: 'downloaded',
            details: {
              fileName: fileData.fileName,
              fileSize: fileData.buffer.length,
              inline: inline,
              userAgent: request.headers['user-agent'] || '',
              timestamp: new Date().toISOString()
            },
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            createdAt: new Date()
          }
        }).catch(error => {
          console.error('❌ Error logging download activity:', error)
        })
        
        // 📥 Enviar archivo
        return reply.send(fileData.buffer)

      } catch (error: any) {
        console.error('❌ Download error:', error)

        // 🚨 Error específico de archivo no encontrado
        if (error.message.includes('not found') || error.message.includes('NoSuchKey')) {
          return reply.status(404).send({
            success: false,
            error: 'File not found',
            details: 'The document file could not be found in storage'
          })
        }

        // 🚨 Error de MinIO/Storage
        if (error.message.includes('MinIO') || error.message.includes('storage')) {
          return reply.status(500).send({
            success: false,
            error: 'Storage error',
            details: 'Failed to retrieve file from storage'
          })
        }

        // 🚨 Error de base de datos
        if (error.message.includes('Database') || error.message.includes('Prisma')) {
          return reply.status(500).send({
            success: false,
            error: 'Database error',
            details: 'Failed to retrieve document information'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while downloading the file'
        })
      }
    }
  })

  // 🔗 Ruta adicional para generar URL de descarga temporal
  fastify.get('/:id/download-url', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Generate a temporary download URL for a document',
      tags: ['Documents'],
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            format: 'uuid',
            description: 'Document UUID' 
          }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          expires: { 
            type: 'integer',
            minimum: 60,
            maximum: 86400,
            default: 3600,
            description: 'URL expiration time in seconds (1 min to 24 hours)' 
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                downloadUrl: { type: 'string' },
                expiresAt: { type: 'string' },
                expiresIn: { type: 'number' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ 
      Params: DownloadParams, 
      Querystring: { expires?: number } 
    }>, reply: FastifyReply) => {
      try {
        // 🔐 Verificar autenticación
        const user = (request as any).user
        if (!user?.id) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required',
            details: 'User not authenticated'
          })
        }

        const { id } = request.params
        const { expires = 3600 } = request.query

        // 📄 Verificar que el documento existe
        const document = await documentService.getDocumentById(id)
        
        if (!document) {
          return reply.status(404).send({
            success: false,
            error: 'Document not found',
            details: `No document found with ID: ${id}`
          })
        }

        // 🔗 Generar URL temporal
        const downloadUrl = await documentService.generateDownloadUrl(id, expires)
        const expiresAt = new Date(Date.now() + expires * 1000)

        return reply.status(200).send({
          success: true,
          message: 'Download URL generated successfully',
          data: {
            downloadUrl,
            expiresAt: expiresAt.toISOString(),
            expiresIn: expires
          }
        })

      } catch (error: any) {
        console.error('❌ Generate download URL error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to generate download URL'
        })
      }
    }
  })

  // 👁️ Ruta para generar URL de visualización temporal (para iframes y nueva pestaña)
  fastify.get('/:id/view-url', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Generate a temporary view URL for a document (for iframes and new tabs)',
      tags: ['Documents'],
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            format: 'uuid',
            description: 'Document UUID' 
          }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          expires: { 
            type: 'integer',
            minimum: 300,
            maximum: 7200,
            default: 1800,
            description: 'URL expiration time in seconds (5 min to 2 hours)' 
          },
          inline: { 
            type: 'string',
            enum: ['true', 'false'],
            default: 'true',
            description: 'Whether to display inline (for viewing) or force download' 
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                viewUrl: { type: 'string' },
                expiresAt: { type: 'string' },
                expiresIn: { type: 'number' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ 
      Params: DownloadParams, 
      Querystring: { expires?: number, inline?: string } 
    }>, reply: FastifyReply) => {
      try {
        // 🔐 Verificar autenticación
        const user = (request as any).user
        if (!user?.id) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required',
            details: 'User not authenticated'
          })
        }

        const { id } = request.params
        const { expires = 1800, inline = 'true' } = request.query

        // 📄 Verificar que el documento existe y permisos
        const document = await documentService.getDocumentById(id)
        
        if (!document) {
          return reply.status(404).send({
            success: false,
            error: 'Document not found',
            details: `No document found with ID: ${id}`
          })
        }

        // 🔐 Verificar permisos de visualización (mismo que descarga)
        const { permissionService } = await import('../../services/permissionService')
        
        let hasViewAccess = false
        
        if (user.role === 'administrador') {
          hasViewAccess = true
        } else if (document.createdBy === user.id) {
          hasViewAccess = true
        } else {
          const workspaceAccess = await permissionService.checkWorkspaceAccess(user.id, document.workspace)
          hasViewAccess = workspaceAccess.hasAccess && (
            workspaceAccess.permissions.includes('view') || 
            workspaceAccess.permissions.includes('download')
          )
        }
        
        if (!hasViewAccess) {
          return reply.status(403).send({
            success: false,
            error: 'View access denied',
            details: 'You do not have permission to view this document'
          })
        }

        console.log('👁️ Document view access granted:', {
          documentId: id,
          documentTitle: document.title,
          requestingUser: user.id,
          userRole: user.role,
          workspace: document.workspace,
          inline: inline === 'true'
        })

        // 🔗 Generar URL temporal para visualización
        const viewUrl = await documentService.generateDownloadUrl(id, expires)
        
        // 📄 Agregar parámetros para visualización inline si es necesario
        const finalViewUrl = inline === 'true' && document.mimeType === 'application/pdf' 
          ? `${viewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`
          : viewUrl

        const expiresAt = new Date(Date.now() + expires * 1000)

        return reply.status(200).send({
          success: true,
          message: 'View URL generated successfully',
          data: {
            viewUrl: finalViewUrl,
            expiresAt: expiresAt.toISOString(),
            expiresIn: expires
          }
        })

      } catch (error: any) {
        console.error('❌ Generate view URL error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to generate view URL'
        })
      }
    }
  })
}
