import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { DocumentStatus } from '../../generated/prisma'
import { z } from 'zod'

// 📋 Schema de validación para parámetros
const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

// 📋 Schema de validación para el body
const statusUpdateSchema = z.object({
  status: z.nativeEnum(DocumentStatus, { message: 'Invalid status value' })
})

type StatusParams = z.infer<typeof paramsSchema>
type StatusBody = z.infer<typeof statusUpdateSchema>

// 🔄 Ruta para cambiar estado del documento
export async function statusRoute(fastify: FastifyInstance): Promise<void> {
  fastify.put('/:id/status', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Change document status (draft → stored → archived)',
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
          status: { 
            type: 'string',
            enum: Object.values(DocumentStatus),
            description: 'New document status'
          }
        },
        required: ['status']
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
                previousStatus: { type: 'string' },
                updatedAt: { type: 'string' },
                storedAt: { type: 'string' },
                archivedAt: { type: 'string' },
                updatedBy: {
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
        404: {
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
        }
      }
    },

    handler: async (request: FastifyRequest<{ Params: StatusParams, Body: StatusBody }>, reply: FastifyReply) => {
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

        // 📋 Validar body
        const bodyValidation = statusUpdateSchema.safeParse(request.body)
        if (!bodyValidation.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid request body',
            details: bodyValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const { id } = paramsValidation.data
        const { status: newStatus } = bodyValidation.data

        // 📄 Verificar que el documento existe
        const currentDocument = await documentService.getDocumentById(id)
        
        if (!currentDocument) {
          return reply.status(404).send({
            success: false,
            error: 'Document not found',
            details: `No document found with ID: ${id}`
          })
        }

        const currentStatus = currentDocument.status

        // 🔐 Verificar permisos para cambiar estado
        // TODO: Implementar lógica de permisos más sofisticada
        const canChangeStatus = await validateStatusChangePermission(
          user,
          currentDocument,
          currentStatus,
          newStatus
        )

        if (!canChangeStatus.allowed) {
          return reply.status(403).send({
            success: false,
            error: 'Permission denied',
            details: canChangeStatus.reason
          })
        }

        // ✅ Validar transición de estado
        const validTransition = validateStatusTransition(currentStatus, newStatus)
        if (!validTransition.valid) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid status transition',
            details: validTransition.reason
          })
        }

        // 🔄 Cambiar estado del documento
        const updatedDocument = await documentService.changeDocumentStatus(
          id,
          newStatus,
          user.id
        )

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: `Document status changed from ${currentStatus} to ${newStatus}`,
          data: {
            id: updatedDocument.id,
            title: updatedDocument.title,
            status: updatedDocument.status,
            previousStatus: currentStatus,
            updatedAt: updatedDocument.updatedAt.toISOString(),
            storedAt: updatedDocument.storedAt?.toISOString() || null,
            archivedAt: updatedDocument.archivedAt?.toISOString() || null,
            updatedBy: {
              id: user.id,
              fullName: user.fullName,
              role: user.role
            }
          }
        })

      } catch (error: any) {
        console.error('❌ Status change error:', error)

        // 🚨 Error de base de datos
        if (error.message.includes('Database') || error.message.includes('Prisma')) {
          return reply.status(500).send({
            success: false,
            error: 'Database error',
            details: 'Failed to update document status'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while updating document status'
        })
      }
    }
  })
}

// 🔐 Función para validar permisos de cambio de estado
async function validateStatusChangePermission(
  user: any,
  document: any,
  currentStatus: DocumentStatus,
  newStatus: DocumentStatus
): Promise<{ allowed: boolean; reason?: string }> {
  
  // 📝 El creador del documento puede cambiar de draft a stored
  if (document.createdBy === user.id) {
    if (currentStatus === DocumentStatus.draft && newStatus === DocumentStatus.stored) {
      return { allowed: true }
    }
  }

  // 🔐 Administradores pueden hacer cualquier cambio
  if (user.role === 'administrador') {
    return { allowed: true }
  }

  // 📋 Secretarios pueden archivar documentos en su workspace
  if (user.role.includes('secretario') && currentStatus === DocumentStatus.stored && newStatus === DocumentStatus.archived) {
    // TODO: Verificar que el workspace del usuario coincida con el del documento
    return { allowed: true }
  }

  // 👥 Usuarios con rol de presidente/vicepresidente pueden archivar
  if (['presidente', 'vicepresidente'].includes(user.role) && newStatus === DocumentStatus.archived) {
    return { allowed: true }
  }

  return { 
    allowed: false, 
    reason: `User with role ${user.role} cannot change document status from ${currentStatus} to ${newStatus}`
  }
}

// ✅ Función para validar transiciones de estado
function validateStatusTransition(
  currentStatus: DocumentStatus,
  newStatus: DocumentStatus
): { valid: boolean; reason?: string } {
  
  // 🔄 Transiciones válidas
  const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
    [DocumentStatus.draft]: [DocumentStatus.stored],
    [DocumentStatus.stored]: [DocumentStatus.archived],
    [DocumentStatus.archived]: [] // Los documentos archivados no pueden cambiar de estado
  }

  const allowedNextStates = validTransitions[currentStatus] || []
  
  if (!allowedNextStates.includes(newStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedNextStates.join(', ') || 'none'}`
    }
  }

  return { valid: true }
}
