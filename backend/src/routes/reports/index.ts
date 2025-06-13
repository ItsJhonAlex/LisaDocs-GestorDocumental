import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { userService } from '../../services/userService'
import { permissionService } from '../../services/permissionService'
import { activityService } from '../../services/activityService'
import { prisma } from '../../config/database'
import { z } from 'zod'

// 📋 Schema de validación para query parameters
const statsQuerySchema = z.object({
  period: z.enum(['1month', '3months', '6months', '1year']).default('6months'),
  workspace: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

type StatsQuery = z.infer<typeof statsQuerySchema>

// 📊 Ruta principal para reportes
export async function reportsRoutes(fastify: FastifyInstance): Promise<void> {

  // 📊 GET /reports/stats - Obtener estadísticas del sistema
  fastify.get('/stats', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get system statistics and reports',
      tags: ['Reports'],
      querystring: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['1month', '3months', '6months', '1year'],
            default: '6months',
            description: 'Time period for statistics'
          },
          workspace: {
            type: 'string',
            description: 'Filter by specific workspace'
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Custom start date (ISO format)'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Custom end date (ISO format)'
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
                overview: {
                  type: 'object',
                  properties: {
                    totalDocuments: { type: 'number' },
                    totalUsers: { type: 'number' },
                    totalActiveUsers: { type: 'number' },
                    storageUsed: { type: 'number' },
                    storageUsedGB: { type: 'number' },
                    documentsThisMonth: { type: 'number' },
                    documentsLastMonth: { type: 'number' },
                    growthPercentage: { type: 'number' }
                  }
                },
                documentsByWorkspace: {
                  type: 'object',
                  additionalProperties: { type: 'number' }
                },
                documentsByStatus: {
                  type: 'object',
                  additionalProperties: { type: 'number' }
                },
                documentsByMonth: {
                  type: 'object',
                  additionalProperties: { type: 'number' }
                },
                usersByRole: {
                  type: 'object',
                  additionalProperties: { type: 'number' }
                },
                recentActivity: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      action: { type: 'string' },
                      createdAt: { type: 'string' },
                      description: { type: 'string' },
                      user: { type: 'object' },
                      document: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 🔐 Obtener usuario autenticado
      const user = (request as any).user
      if (!user?.id) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required',
          message: 'User not authenticated'
        })
      }

      // 🛡️ Verificar permisos para acceder a reportes
      const hasReportAccess = ['administrador', 'presidente', 'vicepresidente'].includes(user.role)
      
      if (!hasReportAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          message: 'Only administrators, presidents and vice-presidents can access reports'
        })
      }

      // 📋 Validar parámetros
      const queryValidation = statsQuerySchema.safeParse(request.query)
      if (!queryValidation.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid query parameters',
          message: queryValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        })
      }

      const { period, workspace, startDate, endDate } = queryValidation.data

      console.log('📊 Generating statistics:', {
        userId: user.id,
        userRole: user.role,
        period,
        workspace
      })

      // 📅 Calcular fechas según el período
      const now = new Date()
      let fromDate: Date
      let toDate = now

      if (startDate && endDate) {
        fromDate = new Date(startDate)
        toDate = new Date(endDate)
      } else {
        switch (period) {
          case '1month':
            fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
            break
          case '3months':
            fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
            break
          case '6months':
            fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
            break
          case '1year':
            fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
            break
          default:
            fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        }
      }

      // 🔍 Construir filtros
      const whereClause: any = {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      }

      if (workspace) {
        whereClause.workspace = workspace
      }

      // 📊 Obtener estadísticas principales
      const [
        totalDocuments,
        totalUsers,
        documentsByWorkspace,
        documentsByStatus,
        usersByRole,
        totalStorageResult,
        documentsThisMonth,
        documentsLastMonth,
        activeUsersCount,
        monthlyDocuments
      ] = await Promise.all([
        // Total de documentos
        prisma.document.count({ where: whereClause }),
        
        // Total de usuarios
        prisma.user.count({ where: { isActive: true } }),
        
        // Documentos por workspace
        prisma.document.groupBy({
          by: ['workspace'],
          where: whereClause,
          _count: true
        }),
        
        // Documentos por estado
        prisma.document.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true
        }),
        
        // Usuarios por rol
        prisma.user.groupBy({
          by: ['role'],
          where: { isActive: true },
          _count: true
        }),
        
        // Almacenamiento total usado
        prisma.document.aggregate({
          where: whereClause,
          _sum: { fileSize: true }
        }),
        
        // Documentos del mes actual
        prisma.document.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
              lte: now
            }
          }
        }),
        
        // Documentos del mes pasado
        prisma.document.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
              lte: new Date(now.getFullYear(), now.getMonth(), 0)
            }
          }
        }),
        
        // Usuarios activos (con documentos)
        prisma.user.count({
          where: {
            isActive: true,
            documents: {
              some: {
                createdAt: {
                  gte: fromDate,
                  lte: toDate
                }
              }
            }
          }
        }),
        
        // Documentos por mes
        workspace ? 
          prisma.$queryRaw`
            SELECT 
              DATE_TRUNC('month', created_at) as month,
              COUNT(*)::int as count
            FROM documents 
            WHERE created_at >= ${fromDate} AND created_at <= ${toDate}
              AND workspace = ${workspace}
            GROUP BY month
            ORDER BY month
          ` :
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*)::int as count
          FROM documents 
          WHERE created_at >= ${fromDate} AND created_at <= ${toDate}
          GROUP BY month
          ORDER BY month
        `
      ])

      // 📈 Calcular crecimiento
      const growthPercentage = documentsLastMonth > 0 
        ? ((documentsThisMonth - documentsLastMonth) / documentsLastMonth) * 100
        : documentsThisMonth > 0 ? 100 : 0

      // 💾 Formatear almacenamiento
      const storageUsedBytes = Number(totalStorageResult._sum.fileSize || 0)
      const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024)

      // 🗂️ Formatear datos por workspace
      const workspaceStats = documentsByWorkspace.reduce((acc, item) => {
        acc[item.workspace] = item._count
        return acc
      }, {} as Record<string, number>)

      // 📊 Formatear datos por estado
      const statusStats = documentsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>)

      // 👥 Formatear datos por rol
      const roleStats = usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count
        return acc
      }, {} as Record<string, number>)

      // 📅 Formatear documentos por mes
      const monthlyStats = (monthlyDocuments as any[]).reduce((acc, item) => {
        const month = new Date(item.month).toLocaleDateString('es-ES', { 
          month: 'long',
          year: 'numeric'
        })
        acc[month] = item.count
        return acc
      }, {} as Record<string, number>)

      // 📊 Preparar respuesta
      const stats = {
        overview: {
          totalDocuments,
          totalUsers,
          totalActiveUsers: activeUsersCount,
          storageUsed: storageUsedBytes,
          storageUsedGB: Number(storageUsedGB.toFixed(2)),
          documentsThisMonth,
          documentsLastMonth,
          growthPercentage: Number(growthPercentage.toFixed(1))
        },
        documentsByWorkspace: workspaceStats,
        documentsByStatus: statusStats,
        documentsByMonth: monthlyStats,
        usersByRole: roleStats,
        recentActivity: await activityService.getRecentActivity(15)
      }

      console.log('✅ Statistics generated successfully:', {
        totalDocuments,
        totalUsers,
        period,
        storageUsedGB: stats.overview.storageUsedGB
      })

      return reply.status(200).send({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats
      })

    } catch (error) {
      console.error('❌ Error generating statistics:', error)
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to generate statistics'
      })
    }
  })

  // 📤 GET /reports/export - Exportar reportes
  fastify.get('/export', {
    preHandler: fastify.authenticate,
    schema: {
      description: 'Export reports in various formats',
      tags: ['Reports'],
      querystring: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['csv', 'excel', 'pdf'],
            description: 'Export format'
          },
          type: {
            type: 'string',
            enum: ['documents', 'users', 'activity', 'overview'],
            description: 'Type of report to export'
          },
          period: {
            type: 'string',
            enum: ['1month', '3months', '6months', '1year'],
            default: '6months'
          },
          workspace: {
            type: 'string',
            description: 'Filter by specific workspace'
          }
        },
        required: ['format', 'type']
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 🔐 Verificar permisos (mismo que stats)
      const user = (request as any).user
      if (!user?.id) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }

      const hasReportAccess = ['administrador', 'presidente', 'vicepresidente'].includes(user.role)
      if (!hasReportAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied'
        })
      }

      const { format, type, period = '6months', workspace } = request.query as any

      console.log('📤 Exporting report:', { format, type, period, workspace, userId: user.id })

      // 📊 Obtener las mismas estadísticas que usa /stats
      const queryValidation = statsQuerySchema.safeParse({ period, workspace })
      if (!queryValidation.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid query parameters'
        })
      }

      const { period: validPeriod, workspace: validWorkspace } = queryValidation.data

      // 📅 Calcular fechas según el período (mismo que en /stats)
      const now = new Date()
      let fromDate: Date
      let toDate = now

      switch (validPeriod) {
        case '1month':
          fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case '3months':
          fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          break
        case '6months':
          fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
          break
        case '1year':
          fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        default:
          fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      }

      // 🔍 Construir filtros
      const whereClause: any = {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      }

      if (validWorkspace) {
        whereClause.workspace = validWorkspace
      }

      // 📊 Generar el archivo según el formato solicitado
      const filename = `reporte-${type}-${validPeriod}-${new Date().toISOString().split('T')[0]}`
      
      if (format === 'csv') {
        // 📄 Exportar como CSV
        const { generateCSVReport } = await import('../../utils/reportGenerators')
        const csvBuffer = await generateCSVReport(type, whereClause, validPeriod, validWorkspace)
        
        reply.header('Content-Type', 'text/csv')
        reply.header('Content-Disposition', `attachment; filename="${filename}.csv"`)
        return reply.send(csvBuffer)
        
      } else if (format === 'excel') {
        // 📊 Exportar como Excel
        const { generateExcelReport } = await import('../../utils/reportGenerators')
        const excelBuffer = await generateExcelReport(type, whereClause, validPeriod, validWorkspace)
        
        reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        reply.header('Content-Disposition', `attachment; filename="${filename}.xlsx"`)
        return reply.send(excelBuffer)
        
      } else if (format === 'pdf') {
        // 📄 Exportar como PDF
        const { generatePDFReport } = await import('../../utils/reportGenerators')
        const pdfBuffer = await generatePDFReport(type, whereClause, validPeriod, validWorkspace)
        
        reply.header('Content-Type', 'application/pdf')
        reply.header('Content-Disposition', `attachment; filename="${filename}.pdf"`)
        return reply.send(pdfBuffer)
        
      } else {
        return reply.status(400).send({
          success: false,
          error: 'Invalid format',
          message: 'Supported formats: csv, excel, pdf'
        })
      }

    } catch (error) {
      console.error('❌ Error exporting report:', error)
      
      return reply.status(500).send({
        success: false,
        error: 'Export failed',
        message: 'An error occurred while generating the report'
      })
    }
  })
} 