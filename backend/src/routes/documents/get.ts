import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { activityService } from '../../services/activityService'
import { z } from 'zod'

// 📋 Schema de validación para parámetros
const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

type GetParams = z.infer<typeof paramsSchema>

// 📄 Ruta para obtener documento específico
export async function getRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get a specific document by ID',
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
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                fileName: { type: 'string' },
                fileSize: { type: 'number' },
                mimeType: { type: 'string' },
                fileHash: { type: 'string' },
                workspace: { type: 'string' },
                status: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                metadata: { type: 'object' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                storedAt: { type: 'string' },
                archivedAt: { type: 'string' },
                expiresAt: { type: 'string' },
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

    handler: async (request: FastifyRequest<{ Params: GetParams }>, reply: FastifyReply) => {
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
        const validationResult = paramsSchema.safeParse(request.params)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid document ID',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { id } = validationResult.data

        // 📄 Obtener documento
        const document = await documentService.getDocumentById(id)
        
        if (!document) {
          return reply.status(404).send({
            success: false,
            error: 'Document not found',
            details: `No document found with ID: ${id}`
          })
        }

        // 🔐 Verificar permisos de acceso
        const { permissionService } = await import('../../services/permissionService')
        
        // 🔍 El usuario puede acceder si:
        // 1. Es el creador del documento
        // 2. Tiene permisos para ver el workspace del documento
        // 3. Es administrador
        
        let hasAccess = false
        
        // 👑 Administradores tienen acceso total
        if (user.role === 'administrador') {
          hasAccess = true
        }
        // 👤 Creador del documento siempre tiene acceso
        else if (document.createdBy === user.id) {
          hasAccess = true
        }
        // 🏢 Verificar permisos del workspace
        else {
          const workspaceAccess = await permissionService.checkWorkspaceAccess(user.id, document.workspace)
          hasAccess = workspaceAccess.hasAccess
        }
        
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to access this document'
          })
        }

        console.log('📄 Document access granted:', {
          documentId: id,
          documentCreator: document.createdBy,
          requestingUser: user.id,
          userRole: user.role,
          workspace: document.workspace,
          accessReason: user.role === 'administrador' ? 'admin' : 
                       document.createdBy === user.id ? 'owner' : 'workspace_permission'
        })

        // 📊 Registrar actividad de visualización
        await activityService.logFromRequest(
          id,
          user.id,
          'viewed',
          request,
          {
            title: document.title,
            fileName: document.fileName,
            workspace: document.workspace,
            status: document.status
          }
        )

        // 📋 Formatear respuesta con toda la información del documento
        const formattedDocument = {
          id: document.id,
          title: document.title,
          description: document.description,
          fileName: document.fileName,
          fileSize: Number(document.fileSize),
          mimeType: document.mimeType,
          fileHash: document.fileHash,
          workspace: document.workspace,
          status: document.status,
          tags: document.tags,
          metadata: document.metadata,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
          storedAt: document.storedAt?.toISOString() || null,
          archivedAt: document.archivedAt?.toISOString() || null,
          expiresAt: document.expiresAt?.toISOString() || null,
          createdByUser: document.createdByUser
        }

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: 'Document retrieved successfully',
          data: formattedDocument
        })

      } catch (error: any) {
        console.error('❌ Get document error:', error)

        // 🚨 Error de base de datos
        if (error.message.includes('Database') || error.message.includes('Prisma')) {
          return reply.status(500).send({
            success: false,
            error: 'Database error',
            details: 'Failed to retrieve document from database'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while retrieving the document'
        })
      }
    }
  })
}
