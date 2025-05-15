
// Export all document services with explicit naming to avoid conflicts
export { 
  loadDocumentsFromStorage,
  saveDocumentsToStorage
} from './documentsService';

// Rename the calculateDocumentStats from documentsService to avoid conflict
export { 
  calculateDocumentStats as calculateDocumentStatsLegacy 
} from './documentsService';

// Export the primary calculateDocumentStats from documentStatsService
export { calculateDocumentStats } from './documentStatsService';
