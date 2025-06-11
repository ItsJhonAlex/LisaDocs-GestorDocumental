import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs/promises'

// 📤 Ruta para upload de archivos solamente (sin metadatos)
export async function uploadFileRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post('/upload-file', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Upload a file temporarily before adding metadata',
      tags: ['Documents'],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                tempFileId: { type: 'string' },
                filename: { type: 'string' },
                fileSize: { type: 'number' },
                mimeType: { type: 'string' }
              }
            }
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
            error: 'Authentication required'
          })
        }

        // 📦 Procesar solo el archivo
        const data = await request.file()
        if (!data) {
          return reply.status(400).send({
            success: false,
            error: 'File is required'
          })
        }

        // 📁 Validar archivo
        if (!data.filename) {
          return reply.status(400).send({
            success: false,
            error: 'File must have a name'
          })
        }

        // 📏 Obtener buffer y validar tamaño
        const buffer = await data.toBuffer()
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
            error: 'Empty file'
          })
        }

        // 🆔 Generar ID temporal único
        const tempFileId = crypto.randomUUID()
        
        // 📁 Crear directorio temporal si no existe
        const tempDir = path.join(process.cwd(), 'temp-uploads')
        await fs.mkdir(tempDir, { recursive: true })
        
        // 💾 Guardar archivo temporalmente
        const tempFilePath = path.join(tempDir, `${tempFileId}_${data.filename}`)
        await fs.writeFile(tempFilePath, buffer)

        console.log('✅ File uploaded temporarily:', {
          tempFileId,
          filename: data.filename,
          size: buffer.length,
          mimetype: data.mimetype,
          path: tempFilePath
        })

        // ✅ Respuesta exitosa
        return reply.status(200).send({
          success: true,
          message: 'File uploaded successfully. Please provide metadata to complete the process.',
          data: {
            tempFileId,
            filename: data.filename,
            fileSize: buffer.length,
            mimeType: data.mimetype || 'application/octet-stream'
          }
        })

      } catch (error: any) {
        console.error('❌ File upload error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred while uploading the file'
        })
      }
    }
  })
} 