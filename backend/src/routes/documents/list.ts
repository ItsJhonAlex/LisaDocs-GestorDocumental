import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { WorkspaceType, DocumentStatus } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para query parameters
const listQuerySchema = z.object({
  workspace: z.nativeEnum(WorkspaceType).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  createdBy: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()) : undefined),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.union([z.string(), z.number()]).optional().transform(val => val ? parseInt(val.toString()) : 20),
  offset: z.union([z.string(), z.number()]).optional().transform(val => val ? parseInt(val.toString()) : 0),
  orderBy: z.enum(['createdAt', 'updatedAt', 'title', 'fileSize']).optional().default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc')
})

type ListQuery = z.infer<typeof listQuerySchema>

// 📋 Ruta para listar documentos
export async function listRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get a list of documents with filters',
      tags: ['Documents'],
      querystring: {
        type: 'object',
        properties: {
          workspace: { 
            type: 'string', 
            enum: Object.values(WorkspaceType),
            description: 'Filter by workspace' 
          },
          status: { 
            type: 'string', 
            enum: Object.values(DocumentStatus),
            description: 'Filter by document status' 
          },
          createdBy: { 
            type: 'string', 
            format: 'uuid',
            description: 'Filter by creator user ID' 
          },
          search: { 
            type: 'string',
            description: 'Search in title, description, and filename' 
          },
          tags: { 
            type: 'string',
            description: 'Comma-separated list of tags to filter by' 
          },
          dateFrom: { 
            type: 'string', 
            format: 'date-time',
            description: 'Filter documents created from this date' 
          },
          dateTo: { 
            type: 'string', 
            format: 'date-time',
            description: 'Filter documents created until this date' 
          },
          limit: { 
            type: ['integer', 'string'], 
            minimum: 1, 
            maximum: 100, 
            default: 20,
            description: 'Number of documents to return' 
          },
          offset: { 
            type: ['integer', 'string'], 
            minimum: 0, 
            default: 0,
            description: 'Number of documents to skip' 
          },
          orderBy: { 
            type: 'string', 
            enum: ['createdAt', 'updatedAt', 'title', 'fileSize'],
            default: 'createdAt',
            description: 'Field to order by' 
          },
          orderDirection: { 
            type: 'string', 
            enum: ['asc', 'desc'],
            default: 'desc',
            description: 'Order direction' 
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
                documents: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      fileName: { type: 'string' },
                      fileSize: { type: 'number' },
                      mimeType: { type: 'string' },
                      workspace: { type: 'string' },
                      status: { type: 'string' },
                      tags: { type: 'array', items: { type: 'string' } },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' },
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
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    limit: { type: 'number' },
                    offset: { type: 'number' },
                    hasMore: { type: 'boolean' }
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

    handler: async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
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

        // 📋 Validar query parameters
        const validationResult = listQuerySchema.safeParse(request.query)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid query parameters',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const filters = validationResult.data

        // 🔍 Validar fechas
        if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid date range',
            details: 'dateFrom must be before dateTo'
          })
        }

        // 📊 Obtener documentos
        const result = await documentService.getDocuments(filters as any)

        // 📋 Formatear respuesta
        const formattedDocuments = result.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          fileName: doc.fileName,
          fileSize: Number(doc.fileSize),
          mimeType: doc.mimeType,
          workspace: doc.workspace,
          status: doc.status,
          tags: doc.tags,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          storedAt: doc.storedAt?.toISOString(),
          archivedAt: doc.archivedAt?.toISOString(),
          createdByUser: doc.createdByUser
        }))

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} documents`,
          data: {
            documents: formattedDocuments,
            pagination: {
              total: result.total,
              limit: filters.limit || 20,
              offset: filters.offset || 0,
              hasMore: result.hasMore
            }
          }
        })

      } catch (error: any) {
        console.error('❌ List documents error:', error)

        // 🚨 Error de base de datos
        if (error.message.includes('Database') || error.message.includes('Prisma')) {
          return reply.status(500).send({
            success: false,
            error: 'Database error',
            details: 'Failed to retrieve documents from database'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while retrieving documents'
        })
      }
    }
  })

  // 📊 Ruta adicional para estadísticas de documentos
  fastify.get('/stats', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get document statistics',
      tags: ['Documents'],
      querystring: {
        type: 'object',
        properties: {
          workspace: { 
            type: 'string', 
            enum: Object.values(WorkspaceType),
            description: 'Get stats for specific workspace only' 
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
                total: { type: 'number' },
                byStatus: { type: 'object' },
                byWorkspace: { type: 'object' },
                totalSize: { type: 'string' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Querystring: { workspace?: WorkspaceType } }>, reply: FastifyReply) => {
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

        const { workspace } = request.query
        const stats = await documentService.getDocumentStats(workspace)

        return reply.status(200).send({
          success: true,
          message: 'Document statistics retrieved successfully',
          data: stats
        })

      } catch (error: any) {
        console.error('❌ Document stats error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve document statistics'
        })
      }
    }
  })
}
