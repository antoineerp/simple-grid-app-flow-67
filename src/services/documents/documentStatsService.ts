
import { Document } from '@/types/documents';
import type { DocumentStats } from '@/types/documents';

/**
 * Calculates document statistics
 */
export const calculateDocumentStats = (documents: Document[]): DocumentStats => {
  const exclusionCount = documents.filter(d => d.etat === 'EX').length;
  const nonExcludedDocuments = documents.filter(d => d.etat !== 'EX');
  
  return {
    exclusion: exclusionCount,
    nonConforme: nonExcludedDocuments.filter(d => d.etat === 'NC').length,
    partiellementConforme: nonExcludedDocuments.filter(d => d.etat === 'PC').length,
    conforme: nonExcludedDocuments.filter(d => d.etat === 'C').length,
    total: nonExcludedDocuments.length
  };
};
