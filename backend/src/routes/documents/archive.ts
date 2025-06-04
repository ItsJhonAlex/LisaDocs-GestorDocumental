import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { DocumentStatus } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para parámetros de documento único
const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

// 📋 Schema de validación para archivado masivo
const bulkArchiveSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, 'At least one document ID is required').max(50, 'Maximum 50 documents at once'),
  reason: z.string().optional(),
  confirm: z.boolean().refine(val => val === true, 'Confirmation is required for bulk archive operation')
})

type ArchiveParams = z.infer<typeof paramsSchema>
type BulkArchiveBody = z.infer<typeof bulkArchiveSchema>

// 📦 Rutas para archivado de documentos
export async function archiveRoute(fastify: FastifyInstance): Promise<void> {
  
  // 📦 Archivar documento individual
  fastify.put('/:id/archive', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Archive a single document (changes status from stored to archived)',
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
      body: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            maxLength: 500,
            description: 'Optional reason for archiving'
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
                id: { type: 'string' },
                title: { type: 'string' },
                status: { type: 'string' },
                archivedAt: { type: 'string' },
                archivedBy: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    fullName: { type: 'string' },
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
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ 
      Params: ArchiveParams, 
      Body: { reason?: string } 
    }>, reply: FastifyReply) => {
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

        const { id } = paramsValidation.data
        const { reason } = request.body || {}

        // 📄 Verificar que el documento existe
        const document = await documentService.getDocumentById(id)
        
        if (!document) {
          return reply.status(404).send({
            success: false,
            error: 'Document not found',
            details: `No document found with ID: ${id}`
          })
        }

        // ✅ Verificar que el documento está en estado 'stored'
        if (document.status !== DocumentStatus.stored) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid document status',
            details: `Document must be in 'stored' status to be archived. Current status: ${document.status}`
          })
        }

        // 🔐 Verificar permisos de archivado
        const canArchive = await validateArchivePermission(user, document)
        
        if (!canArchive.allowed) {
          return reply.status(403).send({
            success: false,
            error: 'Permission denied',
            details: canArchive.reason
          })
        }

        // 📦 Archivar documento
        const archivedDocument = await documentService.changeDocumentStatus(
          id,
          DocumentStatus.archived,
          user.id
        )

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: 'Document archived successfully',
          data: {
            id: archivedDocument.id,
            title: archivedDocument.title,
            status: archivedDocument.status,
            archivedAt: archivedDocument.archivedAt?.toISOString(),
            archivedBy: {
              id: user.id,
              fullName: user.fullName,
              role: user.role
            },
            reason: reason || null
          }
        })

      } catch (error: any) {
        console.error('❌ Archive document error:', error)

        // 🚨 Error de base de datos
        if (error.message.includes('Database') || error.message.includes('Prisma')) {
          return reply.status(500).send({
            success: false,
            error: 'Database error',
            details: 'Failed to archive document'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while archiving the document'
        })
      }
    }
  })

  // 📦 Archivado masivo de documentos
  fastify.put('/archive/bulk', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Archive multiple documents at once (admin or secretary only)',
      tags: ['Documents'],
      body: {
        type: 'object',
        properties: {
          documentIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 50,
            description: 'Array of document UUIDs to archive'
          },
          reason: {
            type: 'string',
            maxLength: 500,
            description: 'Reason for bulk archiving'
          },
          confirm: {
            type: 'boolean',
            description: 'Confirmation flag for bulk archive operation'
          }
        },
        required: ['documentIds', 'confirm']
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
                archived: { type: 'number' },
                failed: { type: 'number' },
                total: { type: 'number' },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      documentId: { type: 'string' },
                      error: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Body: BulkArchiveBody
    }>, reply: FastifyReply) => {
      try {
        // 🔐 Verificar que es administrador o secretario
        const user = (request as any).user
        if (!user?.id || (!user.role.includes('administrador') && !user.role.includes('secretario'))) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only administrators and secretaries can perform bulk archive operations'
          })
        }

        // 📋 Validar body
        const validationResult = bulkArchiveSchema.safeParse(request.body)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { documentIds, reason, confirm } = validationResult.data

        if (!confirm) {
          return reply.status(400).send({
            success: false,
            error: 'Confirmation required',
            details: 'Bulk archive operation requires explicit confirmation'
          })
        }

        // 📦 Archivar documentos uno por uno
        const results = {
          archived: 0,
          failed: 0,
          total: documentIds.length,
          errors: [] as Array<{ documentId: string, error: string }>
        }

        for (const documentId of documentIds) {
          try {
            const document = await documentService.getDocumentById(documentId)
            
            if (!document) {
              results.failed++
              results.errors.push({
                documentId,
                error: 'Document not found'
              })
              continue
            }

            if (document.status !== DocumentStatus.stored) {
              results.failed++
              results.errors.push({
                documentId,
                error: `Invalid status: ${document.status}. Must be 'stored' to archive`
              })
              continue
            }

            // Verificar permisos
            const canArchive = await validateArchivePermission(user, document)
            if (!canArchive.allowed) {
              results.failed++
              results.errors.push({
                documentId,
                error: canArchive.reason || 'Permission denied'
              })
              continue
            }

            // Archivar documento
            await documentService.changeDocumentStatus(
              documentId,
              DocumentStatus.archived,
              user.id
            )
            results.archived++

          } catch (error: any) {
            results.failed++
            results.errors.push({
              documentId,
              error: error.message
            })
          }
        }

        return reply.status(200).send({
          success: true,
          message: `Bulk archive completed: ${results.archived} archived, ${results.failed} failed`,
          data: results
        })

      } catch (error: any) {
        console.error('❌ Bulk archive error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to perform bulk archive operation'
        })
      }
    }
  })
}

// 🔐 Función para validar permisos de archivado
async function validateArchivePermission(
  user: any,
  document: any
): Promise<{ allowed: boolean; reason?: string }> {
  
  // 🔐 Administradores pueden archivar cualquier documento
  if (user.role === 'administrador') {
    return { allowed: true }
  }

  // 📋 Secretarios pueden archivar documentos de su workspace
  if (user.role.includes('secretario')) {
    // TODO: Verificar que el workspace del usuario coincida con el del documento
    // Por ahora permitimos archivado a todos los secretarios
    return { allowed: true }
  }

  // 👥 Presidente/Vicepresidente pueden archivar documentos
  if (['presidente', 'vicepresidente'].includes(user.role)) {
    return { allowed: true }
  }

  // 📝 El creador puede archivar sus propios documentos si son stored
  if (document.createdBy === user.id && document.status === 'stored') {
    return { allowed: true }
  }

  return { 
    allowed: false, 
    reason: `User with role ${user.role} cannot archive documents. Document created by: ${document.createdBy === user.id ? 'you' : 'another user'}`
  }
}
