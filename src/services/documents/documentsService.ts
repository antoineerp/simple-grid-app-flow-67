
import { Document, DocumentStats } from '@/types/documents';

/**
 * Loads documents from localStorage for a specific user
 */
export const loadDocumentsFromStorage = (currentUser: string): Document[] => {
  const storedDocuments = localStorage.getItem(`documents_${currentUser}`);
  
  if (storedDocuments) {
    return JSON.parse(storedDocuments);
  }
  
  return [];
};

/**
 * Saves documents to localStorage for a specific user
 */
export const saveDocumentsToStorage = (documents: Document[], currentUser: string): void => {
  localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
  
  // If user is admin, also save as template
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur') {
    localStorage.setItem('documents_template', JSON.stringify(documents));
  }
  
  // Notify about document update
  window.dispatchEvent(new Event('documentUpdate'));
};

/**
 * Calculate document statistics
 */
export const calculateDocumentStats = (documents: Document[]): DocumentStats => {
  return {
    exclusion: documents.filter(doc => doc.etat === 'EX').length,
    nonConforme: documents.filter(doc => doc.etat === 'NC').length,
    partiellementConforme: documents.filter(doc => doc.etat === 'PC').length,
    conforme: documents.filter(doc => doc.etat === 'C').length,
    total: documents.length
  };
};
