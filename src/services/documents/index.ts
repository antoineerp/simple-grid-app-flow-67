
// Re-export specific functions from documentsService to avoid ambiguity
import { 
  fetchDocuments,
  saveDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  calculateDocumentStats as calcDocStats
} from './documentsService';

import {
  syncDocumentsWithServer
} from './documentSyncService';

import {
  getDocumentStats
} from './documentStatsService';

// Export with renamed functions to avoid conflicts
export {
  fetchDocuments,
  saveDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  calcDocStats as calculateDocumentStats,
  syncDocumentsWithServer,
  getDocumentStats
};
