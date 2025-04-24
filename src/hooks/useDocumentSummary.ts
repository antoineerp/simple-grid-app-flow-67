
import { useState, useEffect } from 'react';
import type { DocumentStats } from '@/types/documents';
import { loadDocumentsFromStorage, calculateDocumentStats } from '@/services/documents';

export const useDocumentSummary = () => {
  const [stats, setStats] = useState<DocumentStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });
  
  const currentUser = localStorage.getItem('currentUser') || 'default';

  useEffect(() => {
    // Function to load documents and calculate stats
    const loadDocuments = () => {
      // Retrieve documents from local storage for the current user
      const documents = loadDocumentsFromStorage(currentUser);
      
      // Calculate stats
      const documentStats = calculateDocumentStats(documents);
      
      setStats(documentStats);
    };

    // Load documents initially
    loadDocuments();

    // Set up event listener for storage changes
    window.addEventListener('storage', loadDocuments);
    // Add custom event listener for document updates
    window.addEventListener('documentUpdate', loadDocuments);

    // Clean up event listeners
    return () => {
      window.removeEventListener('storage', loadDocuments);
      window.removeEventListener('documentUpdate', loadDocuments);
    };
  }, [currentUser]);

  // Calculate conformity rate (percentage of conforme out of total non-excluded)
  const getConformityRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.conforme / stats.total) * 100);
  };

  return {
    ...stats,
    conformityRate: getConformityRate()
  };
};
