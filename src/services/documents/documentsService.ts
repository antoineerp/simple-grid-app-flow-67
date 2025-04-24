
import { Document } from '@/types/documents';
import { SyncService, getCurrentUserId } from '../core/syncService';

// Instance du service de synchronisation pour les documents
const documentsSync = new SyncService('documents', 'DocumentsController.php');

/**
 * Charge les documents depuis le localStorage ou retourne une liste par défaut
 */
export const loadDocumentsFromStorage = (currentUser: string): Document[] => {
  const defaultDocuments: Document[] = [
    { 
      id: '1', 
      nom: 'Manuel qualité', 
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date()
    },
    { 
      id: '2', 
      nom: 'Processus opérationnel', 
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date()
    },
  ];

  // Charger les documents avec le service de synchronisation
  const documents = documentsSync.loadFromStorage<Document>(currentUser, defaultDocuments);
  
  // S'assurer que les dates sont des objets Date
  return documents.map(doc => ({
    ...doc,
    date_creation: doc.date_creation ? new Date(doc.date_creation) : new Date(),
    date_modification: doc.date_modification ? new Date(doc.date_modification) : new Date()
  }));
};

/**
 * Sauvegarde les documents dans le localStorage et les synchronise avec le serveur
 */
export const saveDocumentsToStorage = (documents: Document[], currentUser: string): void => {
  documentsSync.saveToStorage<Document>(documents, currentUser);
};

/**
 * Synchronise les documents avec le serveur
 */
export const syncDocumentsWithServer = async (
  documents: Document[],
  currentUser: string
): Promise<boolean> => {
  return documentsSync.syncWithServer<Document>(documents, currentUser);
};

/**
 * Legacy calculate document statistics function (kept for backward compatibility)
 * @deprecated Use the version from documentStatsService instead
 */
export const calculateDocumentStats = (documents: Document[]) => {
  const totalDocuments = documents.length;
  const excluded = documents.filter(doc => doc.etat === 'EX').length;
  const nonExcluded = totalDocuments - excluded;
  
  return {
    total: totalDocuments,
    excluded,
    nonExcluded,
    nonConforme: documents.filter(doc => doc.etat === 'NC').length,
    partiellementConforme: documents.filter(doc => doc.etat === 'PC').length,
    conforme: documents.filter(doc => doc.etat === 'C').length,
    // Add exclusion property to match the expected type
    exclusion: excluded
  };
};
