import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { z } from 'zod'

// 📋 Schema de validación para parámetros
const paramsSchema = z.object({
  id: z.string().uuid('Invalid document ID format')
})

type DeleteParams = z.infer<typeof paramsSchema>

// 🗑️ Ruta para eliminar documentos
export async function deleteRoute(fastify: FastifyInstance): Promise<void> {
  fastify.delete('/:id', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Delete a document permanently (removes both file and database record)',
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
                fileName: { type: 'string' },
                workspace: { type: 'string' },
                deletedAt: { type: 'string' },
                deletedBy: {
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

    handler: async (request: FastifyRequest<{ Params: DeleteParams }>, reply: FastifyReply) => {
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

        // 📄 Verificar que el documento existe
        const document = await documentService.getDocumentById(id)
        
        if (!document) {
          return reply.status(404).send({
            success: false,
            error: 'Document not found',
            details: `No document found with ID: ${id}`
          })
        }

        // 🔐 Verificar permisos para eliminar
        const canDelete = await validateDeletePermission(user, document)
        
        if (!canDelete.allowed) {
          return reply.status(403).send({
            success: false,
            error: 'Permission denied',
            details: canDelete.reason
          })
        }

        // ⚠️ Confirmar eliminación si es necesario
        const confirmParam = request.query as any
        if (!confirmParam?.confirm) {
          return reply.status(400).send({
            success: false,
            error: 'Deletion confirmation required',
            details: 'Add ?confirm=true to confirm document deletion. This action cannot be undone.'
          })
        }

        // 📊 Guardar información para respuesta antes de eliminar
        const documentInfo = {
          id: document.id,
          title: document.title,
          fileName: document.fileName,
          workspace: document.workspace
        }

        // 🗑️ Eliminar documento (archivo + registro de BD)
        await documentService.deleteDocument(id, user.id)

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: 'Document deleted successfully',
          data: {
            ...documentInfo,
            deletedAt: new Date().toISOString(),
            deletedBy: {
              id: user.id,
              fullName: user.fullName,
              role: user.role
            }
          }
        })

      } catch (error: any) {
        console.error('❌ Delete document error:', error)

        // 🔐 Obtener usuario para casos de error que requieren eliminar solo registro
        const user = (request as any).user

        // 🚨 Error específico de archivo no encontrado en storage
        if (error.message.includes('not found') || error.message.includes('NoSuchKey')) {
          // Eliminar registro de BD aunque el archivo no exista
          try {
            if (user?.id) {
              await documentService.deleteDocument(request.params.id, user.id)
              return reply.status(200).send({
                success: true,
                message: 'Document record deleted (file was already missing)',
                data: {
                  id: request.params.id,
                  deletedAt: new Date().toISOString(),
                  deletedBy: {
                    id: user.id,
                    fullName: user.fullName,
                    role: user.role
                  }
                }
              })
            }
          } catch (dbError) {
            return reply.status(500).send({
              success: false,
              error: 'Database error',
              details: 'Failed to delete document record'
            })
          }
        }

        // 🚨 Error de MinIO/Storage
        if (error.message.includes('MinIO') || error.message.includes('storage')) {
          return reply.status(500).send({
            success: false,
            error: 'Storage error',
            details: 'Failed to delete file from storage'
          })
        }

        // 🚨 Error de base de datos
        if (error.message.includes('Database') || error.message.includes('Prisma')) {
          return reply.status(500).send({
            success: false,
            error: 'Database error',
            details: 'Failed to delete document record'
          })
        }

        // 🚨 Error general
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while deleting the document'
        })
      }
    }
  })

  // 📊 Ruta adicional para eliminación masiva (solo administradores)
  fastify.delete('/bulk', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Delete multiple documents at once (admin only)',
      tags: ['Documents'],
      body: {
        type: 'object',
        properties: {
          documentIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 50,
            description: 'Array of document UUIDs to delete'
          },
          confirm: {
            type: 'boolean',
            description: 'Confirmation flag for bulk deletion'
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
                deleted: { type: 'number' },
                failed: { type: 'number' },
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
      Body: { documentIds: string[], confirm: boolean }
    }>, reply: FastifyReply) => {
      try {
        // 🔐 Verificar que es administrador
        const user = (request as any).user
        if (!user?.id || user.role !== 'administrador') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'Only administrators can perform bulk deletions'
          })
        }

        const { documentIds, confirm } = request.body

        if (!confirm) {
          return reply.status(400).send({
            success: false,
            error: 'Confirmation required',
            details: 'Bulk deletion requires explicit confirmation'
          })
        }

        // 🗑️ Eliminar documentos uno por uno
        const results = {
          deleted: 0,
          failed: 0,
          errors: [] as Array<{ documentId: string, error: string }>
        }

        for (const documentId of documentIds) {
          try {
            await documentService.deleteDocument(documentId, user.id)
            results.deleted++
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
          message: `Bulk deletion completed: ${results.deleted} deleted, ${results.failed} failed`,
          data: results
        })

      } catch (error: any) {
        console.error('❌ Bulk delete error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to perform bulk deletion'
        })
      }
    }
  })
}

// 🔐 Función para validar permisos de eliminación
async function validateDeletePermission(
  user: any,
  document: any
): Promise<{ allowed: boolean; reason?: string }> {
  
  // 🔐 Administradores pueden eliminar cualquier documento
  if (user.role === 'administrador') {
    return { allowed: true }
  }

  // 📝 El creador puede eliminar sus propios documentos en estado draft
  if (document.createdBy === user.id && document.status === 'draft') {
    return { allowed: true }
  }

  // 📋 Secretarios pueden eliminar documentos de su workspace
  if (user.role.includes('secretario')) {
    // TODO: Verificar que el workspace del usuario coincida con el del documento
    // y que el documento esté en un estado que permita eliminación
    if (document.status !== 'archived') {
      return { allowed: true }
    }
  }

  // 👥 Presidente/Vicepresidente pueden eliminar documentos no archivados
  if (['presidente', 'vicepresidente'].includes(user.role) && document.status !== 'archived') {
    return { allowed: true }
  }

  return { 
    allowed: false, 
    reason: `User with role ${user.role} cannot delete this document. Document status: ${document.status}, Created by: ${document.createdBy === user.id ? 'you' : 'another user'}`
  }
}
