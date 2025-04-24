
// Re-export specific functions from documentsService to avoid ambiguity
import { 
  loadDocumentsFromStorage,
  saveDocumentsToStorage,
  getDefaultDocuments,
} from './documentsService';

import {
  syncDocumentsWithServer
} from './documentSyncService';

import {
  calculateDocumentStats
} from './documentStatsService';

// Define functions that were missing but needed
const addDocument = async (userId: string, newDocument: any) => {
  const docs = loadDocumentsFromStorage(userId);
  const id = String(docs.length + 1);
  const documentWithId = { ...newDocument, id };
  const updatedDocs = [...docs, documentWithId];
  saveDocumentsToStorage(updatedDocs, userId);
  return documentWithId;
};

const updateDocument = async (userId: string, id: string | number, updatedDocument: any) => {
  const docs = loadDocumentsFromStorage(userId);
  const updatedDocs = docs.map(doc => doc.id === String(id) ? updatedDocument : doc);
  saveDocumentsToStorage(updatedDocs, userId);
  return updatedDocument;
};

const deleteDocument = async (userId: string, id: string | number) => {
  const docs = loadDocumentsFromStorage(userId);
  const updatedDocs = docs.filter(doc => doc.id !== String(id));
  saveDocumentsToStorage(updatedDocs, userId);
  return true;
};

// Export with renamed functions to avoid conflicts
export {
  loadDocumentsFromStorage as fetchDocuments,
  saveDocumentsToStorage as saveDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  calculateDocumentStats,
  syncDocumentsWithServer,
  getDefaultDocuments,
};

// Export loadDocumentsFromStorage and saveDocumentsToStorage for useDocuments hook
export { loadDocumentsFromStorage, saveDocumentsToStorage };

// Export a specific function to get document stats for compatibility
export const getDocumentStats = calculateDocumentStats;
