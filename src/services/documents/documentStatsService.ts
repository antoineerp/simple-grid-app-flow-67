
import { Document, DocumentStats } from '@/types/documents';

/**
 * Calculate document statistics
 */
export const calculateDocumentStats = (documents: Document[]): DocumentStats => {
  return {
    exclusion: documents.filter(doc => doc.excluded || doc.etat === 'EX').length,
    nonConforme: documents.filter(doc => !doc.excluded && doc.etat === 'NC').length,
    partiellementConforme: documents.filter(doc => !doc.excluded && doc.etat === 'PC').length,
    conforme: documents.filter(doc => !doc.excluded && doc.etat === 'C').length,
    total: documents.length
  };
};
