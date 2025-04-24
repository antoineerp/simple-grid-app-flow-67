
import { Document } from '@/types/documents';
import { getUserId } from '../auth/authService';

/**
 * Loads documents from local storage for the current user
 */
export const loadDocumentsFromStorage = (currentUser: string): Document[] => {
  // Utiliser l'ID utilisateur réel à partir du service d'authentification
  const userId = getUserId() || currentUser;
  const storageKey = `documents_${userId}`;
  
  console.log(`[Documents] Loading documents for user ${userId}`);
  const storedDocuments = localStorage.getItem(storageKey);
  
  if (storedDocuments) {
    try {
      const parsedDocuments = JSON.parse(storedDocuments);
      console.log(`[Documents] Loaded ${parsedDocuments.length} documents`);
      return parsedDocuments;
    } catch (error) {
      console.error('[Documents] Error parsing stored documents:', error);
      return getDefaultDocuments();
    }
  } else {
    console.log(`[Documents] No documents found, loading defaults`);
    // Ne pas charger les documents d'autres utilisateurs comme template
    return getDefaultDocuments();
  }
};

/**
 * Saves documents to local storage for the current user
 */
export const saveDocumentsToStorage = (documents: Document[], currentUser: string): void => {
  // Utiliser l'ID utilisateur réel à partir du service d'authentification
  const userId = getUserId() || currentUser;
  const storageKey = `documents_${userId}`;
  
  try {
    console.log(`[Documents] Saving ${documents.length} documents for user ${userId}`);
    localStorage.setItem(storageKey, JSON.stringify(documents));
    
    // Notify other components of document updates
    window.dispatchEvent(new Event('documentUpdate'));
  } catch (error) {
    console.error('[Documents] Error saving documents to localStorage:', error);
  }
};

/**
 * Calculates document statistics for display
 */
export const calculateDocumentStats = (documents: Document[]) => {
  const total = documents.length;
  const excluded = documents.filter(doc => doc.etat === 'EX').length;
  const nonExcluded = total - excluded;
  
  const nonConforme = documents.filter(doc => doc.etat === 'NC').length;
  const partiellementConforme = documents.filter(doc => doc.etat === 'PC').length;
  const conforme = documents.filter(doc => doc.etat === 'C').length;
  
  return {
    total: nonExcluded,
    nonConforme,
    partiellementConforme,
    conforme,
    excluded,
    exclusion: excluded
  };
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
