import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { documentService } from '../../services/documentService'
import { workspaceService } from '../../services/workspaceService'
import { z } from 'zod'
import { LogMessages } from '../../utils/logger'

// 📋 Schema para filtros específicos de AMPP
const amppFiltersSchema = z.object({
  category: z.enum(['ordenanza', 'resolucion', 'decreto', 'acta', 'informe', 'convenio']).optional(),
  municipality: z.string().optional(),
  urgency: z.enum(['urgente', 'normal', 'baja']).optional(),
  status: z.enum(['draft', 'stored', 'archived']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
})

type AmppFilters = z.infer<typeof amppFiltersSchema>

// 🏛️ Rutas específicas del workspace AMPP
export async function amppRoutes(fastify: FastifyInstance): Promise<void> {

  // 📋 GET /workspaces/ampp/documents - Documentos municipales
  fastify.route({
    method: 'GET',
    url: '/documents',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get AMPP workspace documents with municipal filters',
      tags: ['AMPP Workspace'],
      querystring: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['ordenanza', 'resolucion', 'decreto', 'acta', 'informe', 'convenio'],
            description: 'Type of municipal document'
          },
          municipality: {
            type: 'string',
            description: 'Filter by municipality'
          },
          urgency: {
            type: 'string',
            enum: ['urgente', 'normal', 'baja'],
            description: 'Document urgency level'
          },
          status: {
            type: 'string',
            enum: ['draft', 'stored', 'archived'],
            description: 'Document status'
          },
          dateFrom: {
            type: 'string',
            format: 'date',
            description: 'Filter from date'
          },
          dateTo: {
            type: 'string',
            format: 'date',
            description: 'Filter to date'
          },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 }
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
                documents: { type: 'array' },
                pagination: { type: 'object' },
                filters: { type: 'object' },
                municipalities: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{ Querystring: AmppFilters }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso a AMPP
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'ampp')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to AMPP workspace'
          })
        }

        // 📋 Validar filtros
        const validationResult = amppFiltersSchema.safeParse(request.query)
        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid filters',
            details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        }

        const filters = validationResult.data

        // 🔍 Construir filtros para documentService
        const documentFilters: any = {
          workspace: 'ampp',
          status: filters.status,
          limit: filters.limit,
          offset: filters.offset,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }

        // 📅 Filtros de fecha
        if (filters.dateFrom) documentFilters.dateFrom = new Date(filters.dateFrom)
        if (filters.dateTo) documentFilters.dateTo = new Date(filters.dateTo)

        // 🏷️ Filtros por tags específicos de AMPP
        if (filters.category || filters.municipality || filters.urgency) {
          const tags: string[] = []
          if (filters.category) tags.push(`categoria:${filters.category}`)
          if (filters.municipality) tags.push(`municipio:${filters.municipality}`)
          if (filters.urgency) tags.push(`urgencia:${filters.urgency}`)
          documentFilters.tags = tags
        }

        // 📊 Obtener documentos y municipios disponibles
        const [result, municipalities] = await Promise.all([
          documentService.getDocuments(documentFilters),
          getAvailableMunicipalities()
        ])

        return reply.status(200).send({
          success: true,
          message: `Found ${result.total} AMPP documents`,
          data: {
            documents: result.documents,
            pagination: {
              total: result.total,
              limit: filters.limit || 20,
              offset: filters.offset || 0,
              hasMore: result.hasMore
            },
            filters: {
              applied: filters,
              available: {
                categories: ['ordenanza', 'resolucion', 'decreto', 'acta', 'informe', 'convenio'],
                urgencies: ['urgente', 'normal', 'baja'],
                statuses: ['draft', 'stored', 'archived']
              }
            },
            municipalities
          }
        })

      } catch (error: any) {
        console.error('❌ AMPP documents error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve AMPP documents'
        })
      }
    }
  })

  // 🏛️ GET /workspaces/ampp/municipalities - Gestión de municipios
  fastify.route({
    method: 'GET',
    url: '/municipalities',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get municipalities information and statistics',
      tags: ['AMPP Workspace'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                municipalities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      documentsCount: { type: 'number' },
                      lastActivity: { type: 'string' },
                      status: { type: 'string' }
                    }
                  }
                },
                summary: { type: 'object' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'ampp')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to AMPP workspace'
          })
        }

        // 🏛️ Obtener información de municipios
        const [municipalities, summary] = await Promise.all([
          getMunicipalitiesStats(),
          getMunicipalitiesSummary()
        ])

        return reply.status(200).send({
          success: true,
          message: 'Municipalities information retrieved successfully',
          data: {
            municipalities,
            summary
          }
        })

      } catch (error: any) {
        console.error('❌ AMPP municipalities error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve municipalities information'
        })
      }
    }
  })

  // 📊 GET /workspaces/ampp/dashboard - Dashboard municipal
  fastify.route({
    method: 'GET',
    url: '/dashboard',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get AMPP workspace dashboard with municipal metrics',
      tags: ['AMPP Workspace'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                overview: { type: 'object' },
                documentsByCategory: { type: 'object' },
                documentsByMunicipality: { type: 'object' },
                recentActivity: { type: 'array' },
                urgentMatters: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user

        // 🔐 Verificar acceso
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'ampp')
        if (!hasAccess) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have access to AMPP workspace'
          })
        }

        // 📊 Obtener estadísticas específicas de AMPP
        const [
          workspaceStats,
          urgentMatters,
          municipalityStats
        ] = await Promise.all([
          workspaceService.getWorkspaceStats('ampp'),
          getUrgentAmppMatters(),
          getDocumentsByMunicipality()
        ])

        // 📈 Métricas específicas de AMPP
        const dashboardData = {
          overview: {
            totalDocuments: workspaceStats.totalDocuments,
            totalUsers: workspaceStats.totalUsers,
            storageUsed: workspaceStats.storageUsed,
            municipalitiesActive: await getActiveMunicipalitiesCount(),
            urgentMatters: urgentMatters.length
          },
          documentsByCategory: await getDocumentsByCategory('ampp'),
          documentsByMunicipality: municipalityStats,
          recentActivity: workspaceStats.recentActivity.slice(0, 5),
          urgentMatters
        }

        return reply.status(200).send({
          success: true,
          message: 'AMPP dashboard retrieved successfully',
          data: dashboardData
        })

      } catch (error: any) {
        console.error('❌ AMPP dashboard error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to retrieve AMPP dashboard'
        })
      }
    }
  })

  // 📈 GET /workspaces/ampp/reports - Reportes municipales
  fastify.route({
    method: 'GET',
    url: '/reports',
    preHandler: fastify.authenticate,
    schema: {
      description: 'Get AMPP workspace reports and municipal analytics',
      tags: ['AMPP Workspace'],
      querystring: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['general', 'by-municipality', 'by-category', 'compliance'],
            default: 'general'
          },
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            default: 'month'
          },
          municipality: {
            type: 'string',
            description: 'Filter by specific municipality'
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
                reportType: { type: 'string' },
                period: { type: 'string' },
                summary: { type: 'object' },
                data: { type: 'array' }
              }
            }
          }
        }
      }
    },

    handler: async (request: FastifyRequest<{
      Querystring: { 
        type?: string 
        period?: string 
        municipality?: string 
      }
    }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const { type = 'general', period = 'month', municipality } = request.query

        // 🔐 Verificar acceso y permisos
        const hasAccess = await workspaceService.hasWorkspaceAccess(user.id, 'ampp')
        const permissions = await workspaceService.getUserWorkspacePermissions(user.id, 'ampp')
        
        if (!hasAccess || !permissions.includes('view_stats')) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            details: 'You do not have permission to view AMPP reports'
          })
        }

        // 📈 Generar reporte
        const reportData = await generateAmppReport(type, period, municipality)

        return reply.status(200).send({
          success: true,
          message: `AMPP ${type} report for ${period} generated successfully`,
          data: reportData
        })

      } catch (error: any) {
        console.error('❌ AMPP reports error:', error)
        
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
          details: 'Failed to generate AMPP reports'
        })
      }
    }
  })

  // 🎯 Log específico de AMPP
  fastify.log.info(LogMessages.workspaceRoutes('AMPP', [
    'GET /documents - Municipal documents with filters',
    'GET /municipalities - Municipalities management',
    'GET /dashboard - Municipal dashboard metrics',
    'GET /reports - Municipal reports and analytics'
  ]))
}

// 🔧 Funciones auxiliares específicas de AMPP

async function getAvailableMunicipalities(): Promise<string[]> {
  // TODO: Implementar obtención de municipios desde tags o configuración
  return [
    'Municipalidad A',
    'Municipalidad B', 
    'Municipalidad C',
    'Municipalidad D'
  ]
}

async function getMunicipalitiesStats(): Promise<any[]> {
  const municipalities = await getAvailableMunicipalities()
  
  // TODO: Implementar estadísticas reales por municipio
  return municipalities.map(name => ({
    name,
    documentsCount: Math.floor(Math.random() * 100),
    lastActivity: new Date().toISOString(),
    status: 'active'
  }))
}

async function getMunicipalitiesSummary(): Promise<any> {
  const municipalities = await getAvailableMunicipalities()
  
  return {
    total: municipalities.length,
    active: municipalities.length,
    totalDocuments: await documentService.getDocuments({
      workspace: 'ampp',
      limit: 1
    }).then(result => result.total),
    averageDocuments: 25
  }
}

async function getUrgentAmppMatters(): Promise<any[]> {
  // TODO: Implementar filtro por documentos urgentes usando tags
  return []
}

async function getDocumentsByMunicipality(): Promise<Record<string, number>> {
  // TODO: Implementar conteo por municipio usando tags
  const municipalities = await getAvailableMunicipalities()
  const stats: Record<string, number> = {}
  
  municipalities.forEach(municipality => {
    stats[municipality] = Math.floor(Math.random() * 50)
  })
  
  return stats
}

async function getDocumentsByCategory(workspace: string): Promise<Record<string, number>> {
  // TODO: Implementar conteo por categoría usando tags
  return {
    ordenanza: 0,
    resolucion: 0,
    decreto: 0,
    acta: 0,
    informe: 0,
    convenio: 0
  }
}

async function getActiveMunicipalitiesCount(): Promise<number> {
  return (await getAvailableMunicipalities()).length
}

async function generateAmppReport(type: string, period: string, municipality?: string): Promise<any> {
  // TODO: Implementar generación de reportes específicos de AMPP
  return {
    reportType: type,
    period,
    municipality,
    summary: {
      totalProcessed: 0,
      byCategory: {},
      compliance: '95%',
      pendingReview: 0
    },
    data: []
  }
}
