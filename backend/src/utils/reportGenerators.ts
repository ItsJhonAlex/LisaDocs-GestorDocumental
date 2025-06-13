import * as XLSX from 'xlsx'
import * as createCsvWriter from 'csv-writer'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { prisma } from '../config/database'

// 📊 Tipos para las estadísticas
interface DocumentStats {
  id: string
  title: string
  workspace: string
  status: string
  createdAt: Date
  updatedAt: Date
  fileSize: number | null
  createdByUser: {
    fullName: string
    email: string
  }
}

interface UserStats {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: Date
  _count: {
    documents: number
  }
}

/**
 * 📄 Generar reporte en formato CSV
 */
export async function generateCSVReport(
  type: string,
  whereClause: any,
  period: string,
  workspace?: string
): Promise<Buffer> {
  console.log('📄 Generating CSV report:', { type, period, workspace })

  try {
    let data: any[] = []
    let headers: any[] = []

    switch (type) {
      case 'documents':
        // 📋 Reporte de documentos
        const documents = await prisma.document.findMany({
          where: whereClause,
          include: {
            createdByUser: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        headers = [
          { id: 'id', title: 'ID' },
          { id: 'title', title: 'Título' },
          { id: 'workspace', title: 'Workspace' },
          { id: 'status', title: 'Estado' },
          { id: 'author', title: 'Autor' },
          { id: 'fileSize', title: 'Tamaño (bytes)' },
          { id: 'createdAt', title: 'Fecha de creación' },
          { id: 'updatedAt', title: 'Última actualización' }
        ]

        data = documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          workspace: doc.workspace,
          status: doc.status,
          author: doc.createdByUser.fullName,
          fileSize: Number(doc.fileSize) || 0,
          createdAt: doc.createdAt.toISOString().split('T')[0],
          updatedAt: doc.updatedAt.toISOString().split('T')[0]
        }))
        break

      case 'users':
        // 👥 Reporte de usuarios
        const users = await prisma.user.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: {
                documents: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        headers = [
          { id: 'id', title: 'ID' },
          { id: 'fullName', title: 'Nombre Completo' },
          { id: 'email', title: 'Email' },
          { id: 'role', title: 'Rol' },
          { id: 'documentsCount', title: 'Documentos' },
          { id: 'createdAt', title: 'Fecha de registro' }
        ]

        data = users.map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          documentsCount: user._count.documents,
          createdAt: user.createdAt.toISOString().split('T')[0]
        }))
        break

      case 'overview':
      default:
        // 📊 Reporte de resumen
        const [totalDocs, totalUsers, docsByWorkspace, docsByStatus] = await Promise.all([
          prisma.document.count({ where: whereClause }),
          prisma.user.count({ where: { isActive: true } }),
          prisma.document.groupBy({
            by: ['workspace'],
            where: whereClause,
            _count: true
          }),
          prisma.document.groupBy({
            by: ['status'],
            where: whereClause,
            _count: true
          })
        ])

        headers = [
          { id: 'metric', title: 'Métrica' },
          { id: 'value', title: 'Valor' }
        ]

        data = [
          { metric: 'Total de documentos', value: totalDocs },
          { metric: 'Total de usuarios', value: totalUsers },
          { metric: 'Período', value: period },
          { metric: 'Workspace', value: workspace || 'Todos' },
          ...docsByWorkspace.map(item => ({
            metric: `Documentos en ${item.workspace}`,
            value: item._count
          })),
          ...docsByStatus.map(item => ({
            metric: `Documentos en estado ${item.status}`,
            value: item._count
          }))
        ]
        break
    }

    // 📝 Crear CSV
    const csvBuffer = await new Promise<Buffer>((resolve, reject) => {
      const csvContent = createCsvWriter.createObjectCsvStringifier({
        header: headers
      })

      const headerString = csvContent.getHeaderString()
      const recordsString = csvContent.stringifyRecords(data)
      const fullCsv = headerString + recordsString

      resolve(Buffer.from(fullCsv, 'utf8'))
    })

    console.log('✅ CSV report generated successfully')
    return csvBuffer

  } catch (error) {
    console.error('❌ Error generating CSV report:', error)
    throw new Error('Failed to generate CSV report')
  }
}

/**
 * 📊 Generar reporte en formato Excel
 */
export async function generateExcelReport(
  type: string,
  whereClause: any,
  period: string,
  workspace?: string
): Promise<Buffer> {
  console.log('📊 Generating Excel report:', { type, period, workspace })

  try {
    let data: any[] = []
    let sheetName = 'Reporte'

    switch (type) {
      case 'documents':
        // 📋 Reporte de documentos
        const documents = await prisma.document.findMany({
          where: whereClause,
          include: {
            createdByUser: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        sheetName = 'Documentos'
        data = [
          ['ID', 'Título', 'Workspace', 'Estado', 'Autor', 'Tamaño (bytes)', 'Fecha de creación', 'Última actualización'],
          ...documents.map(doc => [
            doc.id,
            doc.title,
            doc.workspace,
            doc.status,
            doc.createdByUser.fullName,
            Number(doc.fileSize) || 0,
            doc.createdAt.toISOString().split('T')[0],
            doc.updatedAt.toISOString().split('T')[0]
          ])
        ]
        break

      case 'users':
        // 👥 Reporte de usuarios
        const users = await prisma.user.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: {
                documents: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        sheetName = 'Usuarios'
        data = [
          ['ID', 'Nombre Completo', 'Email', 'Rol', 'Documentos', 'Fecha de registro'],
          ...users.map(user => [
            user.id,
            user.fullName,
            user.email,
            user.role,
            user._count.documents,
            user.createdAt.toISOString().split('T')[0]
          ])
        ]
        break

      case 'overview':
      default:
        // 📊 Reporte de resumen
        const [totalDocs, totalUsers, docsByWorkspace, docsByStatus] = await Promise.all([
          prisma.document.count({ where: whereClause }),
          prisma.user.count({ where: { isActive: true } }),
          prisma.document.groupBy({
            by: ['workspace'],
            where: whereClause,
            _count: true
          }),
          prisma.document.groupBy({
            by: ['status'],
            where: whereClause,
            _count: true
          })
        ])

        sheetName = 'Resumen'
        data = [
          ['Métrica', 'Valor'],
          ['Total de documentos', totalDocs],
          ['Total de usuarios', totalUsers],
          ['Período', period],
          ['Workspace', workspace || 'Todos'],
          ['', ''],
          ['Documentos por Workspace', ''],
          ...docsByWorkspace.map(item => [item.workspace, item._count]),
          ['', ''],
          ['Documentos por Estado', ''],
          ...docsByStatus.map(item => [item.status, item._count])
        ]
        break
    }

    // 📊 Crear workbook de Excel
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // 🎨 Agregar el worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // 💾 Generar buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log('✅ Excel report generated successfully')
    return excelBuffer

  } catch (error) {
    console.error('❌ Error generating Excel report:', error)
    throw new Error('Failed to generate Excel report')
  }
}

/**
 * 📄 Generar reporte en formato PDF
 */
export async function generatePDFReport(
  type: string,
  whereClause: any,
  period: string,
  workspace?: string
): Promise<Buffer> {
  console.log('📄 Generating PDF report:', { type, period, workspace })

  try {
    const doc = new jsPDF()
    
    // 🎨 Configurar PDF
    doc.setFontSize(20)
    doc.text('LisaDocs - Reporte de Sistema', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Período: ${period}`, 20, 35)
    doc.text(`Workspace: ${workspace || 'Todos'}`, 20, 45)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 20, 55)

    let startY = 70

    switch (type) {
      case 'documents':
        // 📋 Reporte de documentos
        const documents = await prisma.document.findMany({
          where: whereClause,
          include: {
            createdByUser: {
              select: {
                fullName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50 // Limitar para PDF
        })

        doc.setFontSize(16)
        doc.text('Documentos', 20, startY)
        
        const docData = documents.map(doc => [
          doc.title.substring(0, 30) + (doc.title.length > 30 ? '...' : ''),
          doc.workspace,
          doc.status,
          doc.createdByUser.fullName,
          doc.createdAt.toISOString().split('T')[0]
        ])

        autoTable(doc, {
          head: [['Título', 'Workspace', 'Estado', 'Autor', 'Fecha']],
          body: docData,
          startY: startY + 10,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        })
        break

      case 'users':
        // 👥 Reporte de usuarios
        const users = await prisma.user.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: {
                documents: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50 // Limitar para PDF
        })

        doc.setFontSize(16)
        doc.text('Usuarios Activos', 20, startY)

        const userData = users.map(user => [
          user.fullName,
          user.email,
          user.role,
          user._count.documents.toString(),
          user.createdAt.toISOString().split('T')[0]
        ])

        autoTable(doc, {
          head: [['Nombre', 'Email', 'Rol', 'Documentos', 'Registro']],
          body: userData,
          startY: startY + 10,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        })
        break

      case 'overview':
      default:
        // 📊 Reporte de resumen
        const [totalDocs, totalUsers, docsByWorkspace, docsByStatus] = await Promise.all([
          prisma.document.count({ where: whereClause }),
          prisma.user.count({ where: { isActive: true } }),
          prisma.document.groupBy({
            by: ['workspace'],
            where: whereClause,
            _count: true
          }),
          prisma.document.groupBy({
            by: ['status'],
            where: whereClause,
            _count: true
          })
        ])

        doc.setFontSize(16)
        doc.text('Resumen General', 20, startY)

        let currentY = startY + 20

        // Estadísticas generales
        doc.setFontSize(12)
        doc.text(`Total de documentos: ${totalDocs}`, 20, currentY)
        doc.text(`Total de usuarios: ${totalUsers}`, 20, currentY + 10)
        
        currentY += 30

        // Documentos por workspace
        doc.setFontSize(14)
        doc.text('Documentos por Workspace:', 20, currentY)
        currentY += 15

        const workspaceData = docsByWorkspace.map(item => [item.workspace, item._count.toString()])
        autoTable(doc, {
          head: [['Workspace', 'Documentos']],
          body: workspaceData,
          startY: currentY,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] }
        })

        currentY = (doc as any).lastAutoTable.finalY + 20

        // Documentos por estado
        doc.setFontSize(14)
        doc.text('Documentos por Estado:', 20, currentY)
        currentY += 10

        const statusData = docsByStatus.map(item => [item.status, item._count.toString()])
        autoTable(doc, {
          head: [['Estado', 'Documentos']],
          body: statusData,
          startY: currentY,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] }
        })
        break
    }

    // 💾 Generar buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    console.log('✅ PDF report generated successfully')
    return pdfBuffer

  } catch (error) {
    console.error('❌ Error generating PDF report:', error)
    throw new Error('Failed to generate PDF report')
  }
} 