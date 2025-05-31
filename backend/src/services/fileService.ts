import * as Minio from 'minio'
import { config } from '../config/environment'
import { WorkspaceType } from '../generated/prisma'
import crypto from 'crypto'
import path from 'path'

// 📦 Cliente MinIO singleton
class MinioClient {
  private client: Minio.Client
  private static instance: MinioClient

  private constructor() {
    this.client = new Minio.Client({
      endPoint: config.storage.endpoint,
      port: config.storage.port,
      useSSL: config.storage.useSSL,
      accessKey: config.storage.accessKey,
      secretKey: config.storage.secretKey
    })
  }

  public static getInstance(): MinioClient {
    if (!MinioClient.instance) {
      MinioClient.instance = new MinioClient()
    }
    return MinioClient.instance
  }

  public getClient(): Minio.Client {
    return this.client
  }
}

// 🗂️ Mapeo de workspaces a buckets
const WORKSPACE_BUCKETS: Record<WorkspaceType, string> = {
  cam: 'lisadocs-cam',
  ampp: 'lisadocs-ampp',
  presidencia: 'lisadocs-presidencia',
  intendencia: 'lisadocs-intendencia',
  comisiones_cf: 'lisadocs-comisiones-cf'
}

// 📁 Tipos para el servicio
export interface UploadResult {
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  fileHash: string
  bucket: string
  objectName: string
}

export interface FileInfo {
  fileName: string
  fileSize: number
  mimeType: string
  lastModified: Date
  etag: string
}

// 🚀 Servicio de archivos con MinIO
export class FileService {
  private minioClient: Minio.Client

  constructor() {
    this.minioClient = MinioClient.getInstance().getClient()
  }

  /**
   * 📤 Subir archivo a MinIO
   */
  async uploadFile(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
    workspace: WorkspaceType,
    userId: string
  ): Promise<UploadResult> {
    try {
      const bucket = WORKSPACE_BUCKETS[workspace]
      const fileExtension = path.extname(originalFileName)
      const sanitizedFileName = this.sanitizeFileName(path.basename(originalFileName, fileExtension))
      
      // 🔐 Generar hash único para el archivo
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const objectName = `${workspace}/${userId}/${timestamp}_${sanitizedFileName}_${fileHash.substring(0, 8)}${fileExtension}`

      // ✅ Verificar que el bucket existe
      await this.ensureBucketExists(bucket)

      // 📤 Subir archivo
      const uploadInfo = await this.minioClient.putObject(
        bucket,
        objectName,
        buffer,
        buffer.length,
        {
          'Content-Type': mimeType,
          'X-Original-Name': originalFileName,
          'X-Upload-User': userId,
          'X-File-Hash': fileHash
        }
      )

      // 🔗 Generar URL de acceso
      const fileUrl = `http://${config.storage.endpoint}:${config.storage.port}/${bucket}/${objectName}`

      return {
        fileUrl,
        fileName: originalFileName,
        fileSize: buffer.length,
        mimeType,
        fileHash,
        bucket,
        objectName
      }

    } catch (error) {
      console.error('❌ Error uploading file to MinIO:', error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📥 Obtener archivo de MinIO
   */
  async getFile(bucket: string, objectName: string): Promise<Buffer> {
    try {
      const chunks: Buffer[] = []
      const stream = await this.minioClient.getObject(bucket, objectName)
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('❌ Error getting file from MinIO:', error)
      throw new Error(`Failed to get file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📋 Obtener información del archivo
   */
  async getFileInfo(bucket: string, objectName: string): Promise<FileInfo> {
    try {
      const stat = await this.minioClient.statObject(bucket, objectName)
      
      return {
        fileName: stat.metaData?.['x-original-name'] || objectName,
        fileSize: stat.size,
        mimeType: stat.metaData?.['content-type'] || 'application/octet-stream',
        lastModified: stat.lastModified,
        etag: stat.etag
      }
    } catch (error) {
      console.error('❌ Error getting file info from MinIO:', error)
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🗑️ Eliminar archivo de MinIO
   */
  async deleteFile(bucket: string, objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucket, objectName)
    } catch (error) {
      console.error('❌ Error deleting file from MinIO:', error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🔗 Generar URL de descarga temporal (presigned)
   */
  async generateDownloadUrl(bucket: string, objectName: string, expirySeconds: number = 3600): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(bucket, objectName, expirySeconds)
    } catch (error) {
      console.error('❌ Error generating download URL:', error)
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 📂 Listar archivos en un bucket con prefijo
   */
  async listFiles(workspace: WorkspaceType, prefix?: string): Promise<string[]> {
    try {
      const bucket = WORKSPACE_BUCKETS[workspace]
      const objects: string[] = []
      
      const objectStream = this.minioClient.listObjects(bucket, prefix, true)
      
      return new Promise((resolve, reject) => {
        objectStream.on('data', (obj) => {
          if (obj.name) objects.push(obj.name)
        })
        objectStream.on('end', () => resolve(objects))
        objectStream.on('error', reject)
      })
    } catch (error) {
      console.error('❌ Error listing files:', error)
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🏗️ Asegurar que el bucket existe
   */
  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucket)
      if (!exists) {
        await this.minioClient.makeBucket(bucket, 'us-east-1')
        console.log(`✅ Bucket ${bucket} created successfully`)
      }
    } catch (error) {
      console.error(`❌ Error ensuring bucket ${bucket} exists:`, error)
      throw new Error(`Failed to ensure bucket exists: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 🧹 Limpiar nombre de archivo
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Reemplazar caracteres especiales
      .replace(/_{2,}/g, '_') // Múltiples underscores a uno
      .replace(/^_|_$/g, '') // Quitar underscores al inicio/final
      .substring(0, 100) // Limitar longitud
  }

  /**
   * ✅ Validar tipo de archivo
   */
  validateFileType(mimeType: string): boolean {
    const allowedTypes = [
      // Documentos
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      // Imágenes
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Otros
      'application/zip',
      'application/x-rar-compressed'
    ]
    
    return allowedTypes.includes(mimeType)
  }

  /**
   * 📊 Obtener estadísticas de almacenamiento por workspace
   */
  async getStorageStats(workspace: WorkspaceType): Promise<{
    totalFiles: number
    totalSize: number
    filesByType: Record<string, number>
  }> {
    try {
      const bucket = WORKSPACE_BUCKETS[workspace]
      const files = await this.listFiles(workspace)
      
      let totalSize = 0
      const filesByType: Record<string, number> = {}
      
      for (const fileName of files) {
        try {
          const fileInfo = await this.getFileInfo(bucket, fileName)
          totalSize += fileInfo.fileSize
          
          const extension = path.extname(fileName).toLowerCase()
          filesByType[extension] = (filesByType[extension] || 0) + 1
        } catch (error) {
          console.warn(`⚠️  Could not get info for file ${fileName}:`, error)
        }
      }
      
      return {
        totalFiles: files.length,
        totalSize,
        filesByType
      }
    } catch (error) {
      console.error('❌ Error getting storage stats:', error)
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// 🎯 Instancia singleton del servicio
export const fileService = new FileService()
