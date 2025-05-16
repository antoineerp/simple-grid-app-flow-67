
import { useState, useEffect } from 'react';
import { useSync } from './useSync';

// Define the document type
interface Document {
  id: string;
  title: string;
  content?: string;
  // Add any other properties as needed
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { syncStatus, startSync, endSync, loading, error } = useSync('documents');

  // Function to synchronize and process documents
  const syncAndProcess = async () => {
    startSync();
    try {
      // Simulate loading documents - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Example documents - replace with real data from your API
      const loadedDocuments = [
        { id: '1', title: 'Document 1', content: 'Content 1' },
        { id: '2', title: 'Document 2', content: 'Content 2' },
        { id: '3', title: 'Document 3', content: 'Content 3' },
      ];
      
      setDocuments(loadedDocuments);
      endSync();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      endSync(errorMessage);
      return false;
    }
  };

  // Load initial data
  useEffect(() => {
    syncAndProcess();
  }, []);

  // Select a document
  const selectDocument = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    setSelectedDocument(document || null);
  };

  return {
    documents,
    selectedDocument,
    selectDocument,
    syncStatus,
    startSync,
    endSync,
    syncAndProcess,
    loading,
    error
  };
};

export default useDocuments;
