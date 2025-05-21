
// Re-export functions from document service files with explicit naming to avoid conflicts
export { calculateDocumentStats } from './documentStatsService';
export { fetchDocumentsFromServer, syncDocumentsWithServer, getLocalDocuments, saveLocalDocuments } from './documentSyncService';

// Alias pour la compatibilité avec le code existant
export { fetchDocumentsFromServer as loadDocumentsFromServer } from './documentSyncService';
