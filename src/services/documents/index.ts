
// Re-export specific functions from documentsService to avoid ambiguity
import { 
  loadDocumentsFromStorage as fetchDocuments,
  saveDocumentsToStorage as saveDocuments,
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
  const docs = fetchDocuments(userId);
  const id = String(docs.length + 1);
  const documentWithId = { ...newDocument, id };
  const updatedDocs = [...docs, documentWithId];
  saveDocuments(updatedDocs, userId);
  return documentWithId;
};

const updateDocument = async (userId: string, id: string | number, updatedDocument: any) => {
  const docs = fetchDocuments(userId);
  const updatedDocs = docs.map(doc => doc.id === String(id) ? updatedDocument : doc);
  saveDocuments(updatedDocs, userId);
  return updatedDocument;
};

const deleteDocument = async (userId: string, id: string | number) => {
  const docs = fetchDocuments(userId);
  const updatedDocs = docs.filter(doc => doc.id !== String(id));
  saveDocuments(updatedDocs, userId);
  return true;
};

// Export with renamed functions to avoid conflicts
export {
  fetchDocuments,
  saveDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  calculateDocumentStats,
  syncDocumentsWithServer,
  getDefaultDocuments,
};

// Export a specific function to get document stats for compatibility
export const getDocumentStats = calculateDocumentStats;
