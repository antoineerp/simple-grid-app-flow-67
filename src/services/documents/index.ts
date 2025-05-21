
// Re-export functions from document service files with explicit naming to avoid conflicts
export { calculateDocumentStats } from './documentStatsService';
export { fetchDocumentsFromServer as loadDocumentsFromServer, syncDocumentsWithServer } from './documentSyncService';

// Export other functions from documentService that don't conflict
export { 
  // We don't re-export functions that would cause conflicts
  // calculateDocumentStats,  <- This would conflict
  // loadDocumentsFromServer, <- This would conflict 
  // syncDocumentsWithServer  <- This would conflict
} from './documentService';
