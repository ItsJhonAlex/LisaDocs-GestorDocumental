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
