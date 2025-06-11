import type { 
  Document, 
  DocumentType
} from '@/types/document';
import type { BackendDocument } from '@/hooks/useBackendDocuments';
import { 
  getDocumentTypeFromTags, 
  getDocumentTypeConfig,
  DOCUMENT_TYPE_CONFIG
} from '@/types/document';

/**
 * 🔄 Convertir BackendDocument a Document local con tipos enriquecidos
 */
export function enrichBackendDocument(backendDoc: BackendDocument): Document {
  const documentType = getDocumentTypeFromTags(backendDoc.tags || []);
  
  // Separar tipo de documento de tags adicionales
  const additionalTags = backendDoc.tags?.filter((tag: string) => 
    !Object.values(DOCUMENT_TYPE_CONFIG).some(config => 
      Object.keys(DOCUMENT_TYPE_CONFIG).find(key => key === tag)
    )
  ) || [];

  return {
    id: backendDoc.id,
    title: backendDoc.title,
    description: backendDoc.description,
    fileName: backendDoc.fileName,
    fileSize: backendDoc.fileSize,
    mimeType: backendDoc.mimeType,
    status: backendDoc.status,
    workspace: backendDoc.workspace,
    tags: backendDoc.tags || [],
    createdBy: backendDoc.createdByUser.id,
    createdByUser: {
      id: backendDoc.createdByUser.id,
      fullName: backendDoc.createdByUser.fullName,
      email: backendDoc.createdByUser.email || 'no-email@example.com',
      role: 'cf_member' as const
    },
    createdAt: backendDoc.createdAt,
    metadata: {},
    updatedAt: backendDoc.createdAt,
    storedAt: backendDoc.status === 'stored' ? backendDoc.createdAt : undefined,
    archivedAt: backendDoc.status === 'archived' ? backendDoc.createdAt : undefined,
    fileUrl: `/api/documents/${backendDoc.id}/download`,
    
    // 🆕 Propiedades derivadas
    documentType: documentType || undefined,
    additionalTags
  };
}

/**
 * 📊 Analizar estadísticas de tipos de documentos
 */
export function analyzeDocumentTypes(documents: Document[]) {
  const typeStats = new Map<DocumentType | 'unknown', number>();
  
  documents.forEach(doc => {
    const type = doc.documentType || 'unknown';
    typeStats.set(type, (typeStats.get(type) || 0) + 1);
  });

  return Array.from(typeStats.entries()).map(([type, count]) => ({
    type,
    count,
    label: type === 'unknown' ? 'Sin tipo' : getDocumentTypeConfig(type).label,
    icon: type === 'unknown' ? '❓' : getDocumentTypeConfig(type).icon
  }));
}

/**
 * 🔍 Filtrar documentos por tipo
 */
export function filterDocumentsByType(
  documents: Document[], 
  types: DocumentType[]
): Document[] {
  if (types.length === 0) return documents;
  
  return documents.filter(doc => 
    doc.documentType && types.includes(doc.documentType)
  );
}

/**
 * 📅 Verificar si un documento está próximo a vencer su retención
 */
export function isDocumentNearExpiration(document: Document): boolean {
  if (!document.documentType || !document.storedAt) return false;
  
  const config = getDocumentTypeConfig(document.documentType);
  const storedDate = new Date(document.storedAt);
  const expirationDate = new Date(storedDate);
  expirationDate.setMonth(expirationDate.getMonth() + config.retentionMonths);
  
  const now = new Date();
  const daysToExpiration = Math.ceil(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Considerar "próximo a vencer" si faltan menos de 30 días
  return daysToExpiration <= 30 && daysToExpiration > 0;
}

/**
 * ⚠️ Verificar si un documento ha vencido su período de retención
 */
export function isDocumentExpired(document: Document): boolean {
  if (!document.documentType || !document.storedAt) return false;
  
  const config = getDocumentTypeConfig(document.documentType);
  const storedDate = new Date(document.storedAt);
  const expirationDate = new Date(storedDate);
  expirationDate.setMonth(expirationDate.getMonth() + config.retentionMonths);
  
  return new Date() > expirationDate;
}

/**
 * 🏷️ Obtener todas las tags que no son tipos de documento
 */
export function getAdditionalTags(documents: Document[]): string[] {
  const allTags = new Set<string>();
  
  documents.forEach(doc => {
    doc.additionalTags?.forEach(tag => allTags.add(tag));
  });
  
  return Array.from(allTags).sort();
}

/**
 * 📊 Agrupar documentos por tipo
 */
export function groupDocumentsByType(documents: Document[]): Record<string, Document[]> {
  const groups: Record<string, Document[]> = {};
  
  documents.forEach(doc => {
    const type = doc.documentType || 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(doc);
  });
  
  return groups;
}

/**
 * 🎯 Validar si un tipo de documento es válido para un workspace
 */
export function isDocumentTypeValidForWorkspace(
  documentType: DocumentType, 
  workspace: string
): boolean {
  const config = getDocumentTypeConfig(documentType);
  return config.workspaces.includes(workspace as any);
}

/**
 * 📋 Crear mock data con tipos de documentos
 */
export function createMockDocumentWithType(
  overrides: Partial<Document> = {}
): Document {
  const types = Object.values(DOCUMENT_TYPE_CONFIG);
  const randomType = Object.keys(DOCUMENT_TYPE_CONFIG)[
    Math.floor(Math.random() * types.length)
  ] as DocumentType;
  
  const baseDoc: Document = {
    id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `Documento ${randomType.replace('_', ' ')}`,
    description: `Descripción de ${getDocumentTypeConfig(randomType).label}`,
    fileName: `documento-${randomType}.pdf`,
    fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
    mimeType: 'application/pdf',
    status: 'stored',
    workspace: getDocumentTypeConfig(randomType).workspaces[0],
    tags: [randomType, 'importante'],
    createdBy: 'user-mock',
    createdByUser: {
      id: 'user-mock',
      fullName: 'Usuario Test',
      email: 'test@example.com',
      role: 'cf_member' as const
    },
    createdAt: new Date().toISOString(),
    metadata: {},
    updatedAt: new Date().toISOString(),
    storedAt: new Date().toISOString(),
    fileUrl: `/uploads/${randomType}/documento.pdf`,
    documentType: randomType,
    additionalTags: ['importante'],
    ...overrides
  };
  
  return baseDoc;
} 