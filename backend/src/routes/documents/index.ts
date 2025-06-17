import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { uploadRoute } from './upload'
import { uploadFileRoute } from './upload-file'
import { createDocumentRoute } from './create-document'
import { listRoute } from './list'
import { getRoute } from './get'
import { downloadRoute } from './download'
import { statusRoute } from './status'
import { deleteRoute } from './delete'
import { archiveRoute } from './archive'

// 📄 Plugin principal para rutas de documentos
export async function documentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // 📤 POST /documents - Upload de documentos (método original)
  await fastify.register(uploadRoute)
  
  // 🚀 POST /documents/upload-file - Subir solo archivo (nuevo método paso 1)
  await fastify.register(uploadFileRoute)
  
  // 📝 POST /documents/create-document - Crear documento con metadatos (nuevo método paso 2)
  await fastify.register(createDocumentRoute)
  
  // 📋 GET /documents - Listar documentos con filtros
  await fastify.register(listRoute)
  
  // 📋 GET /documents/my-documents - Listar SOLO documentos del usuario actual
  await fastify.register(myDocumentsRoute)
  
  // 📄 GET /documents/:id - Obtener documento específico
  await fastify.register(getRoute)
  
  // 📥 GET /documents/:id/download - Descargar archivo
  await fastify.register(downloadRoute)
  
  // 🔄 PUT /documents/:id/status - Cambiar estado del documento
  await fastify.register(statusRoute)
  
  // 📦 PUT /documents/:id/archive - Archivar documento
  await fastify.register(archiveRoute)
  
  // 🗑️ DELETE /documents/:id - Eliminación de documento
  await fastify.register(deleteRoute)
}

async function myDocumentsRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/my-documents', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get user own documents only',
      tags: ['Documents'],
      querystring: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: Object.values(require('../../generated/prisma').DocumentStatus),
            description: 'Filter by document status' 
          },
          search: { 
            type: 'string',
            description: 'Search in title, description, and filename' 
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
        }
      },
    },
    handler: async (request: any, reply: any) => {
      try {
        const user = request.user;
        if (!user?.id) {
          return reply.status(401).send({
            success: false,
            error: 'Authentication required'
          });
        }

        const { documentService } = await import('../../services/documentService');
        
        // 🔒 Obtener SOLO documentos del usuario actual
        const result = await documentService.getDocuments({
          createdBy: user.id, // Forzar filtro por usuario actual
          status: request.query.status,
          search: request.query.search,
          limit: parseInt(request.query.limit?.toString() || '20'),
          offset: parseInt(request.query.offset?.toString() || '0'),
          // NO pasar requestingUserId para evitar la lógica de permisos
        });

        return reply.send({
          success: true,
          message: 'User documents retrieved successfully',
          data: result
        });

      } catch (error: any) {
        console.error('❌ Error fetching user documents:', error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: error.message
        });
      }
    }
  });
}
