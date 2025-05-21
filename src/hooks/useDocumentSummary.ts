
import { useState, useEffect } from 'react';
import type { DocumentStats } from '@/types/documents';
import { loadDocumentsFromServer, calculateDocumentStats } from '@/services/documents';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

export const useDocumentSummary = () => {
  const [stats, setStats] = useState<DocumentStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });
  
  const currentUser = getCurrentUser() || 'p71x6d_richard';

  useEffect(() => {
    // Function to load documents and calculate stats
    const loadDocuments = async () => {
      try {
        // Retrieve documents from server for the current user
        const documents = await loadDocumentsFromServer();
        
        // Calculate stats
        const documentStats = calculateDocumentStats(documents);
        
        setStats(documentStats);
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
      }
    };

    // Load documents initially
    loadDocuments();

    // Set up event listener for document updates
    window.addEventListener('documentUpdate', loadDocuments);

    // Clean up event listener
    return () => {
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
