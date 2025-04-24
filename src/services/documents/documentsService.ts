
import { Document } from '@/types/documents';

/**
 * Loads documents from local storage for the current user
 */
export const loadDocumentsFromStorage = (currentUser: string): Document[] => {
  const storedDocuments = localStorage.getItem(`documents_${currentUser}`);
  
  if (storedDocuments) {
    return JSON.parse(storedDocuments);
  } else {
    const defaultDocuments = localStorage.getItem('documents_template') || localStorage.getItem('documents');
    
    if (defaultDocuments) {
      return JSON.parse(defaultDocuments);
    }
    
    return getDefaultDocuments();
  }
};

/**
 * Saves documents to local storage for the current user
 */
export const saveDocumentsToStorage = (documents: Document[], currentUser: string): void => {
  localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
  
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur') {
    localStorage.setItem('documents_template', JSON.stringify(documents));
  }
  
  // Notify other components of document updates
  window.dispatchEvent(new Event('documentUpdate'));
};

/**
 * Provides default documents if no existing data
 */
export const getDefaultDocuments = (): Document[] => {
  return [
    { 
      id: '1', 
      nom: 'Document 1',
      fichier_path: 'Voir le document',
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: 'C',
      date_creation: new Date(),
      date_modification: new Date()
    },
    { 
      id: '2', 
      nom: 'Document 2',
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: 'PC',
      date_creation: new Date(),
      date_modification: new Date()
    },
    { 
      id: '3', 
      nom: 'Document 3',
      fichier_path: 'Voir le document',
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: 'NC',
      date_creation: new Date(),
      date_modification: new Date()
    },
  ];
};
