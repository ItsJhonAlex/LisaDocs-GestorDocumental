import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { uploadRoute } from './upload'
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
  // 📤 POST /documents - Upload de documentos
  await fastify.register(uploadRoute)
  
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
