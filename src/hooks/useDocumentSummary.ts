
import { useState, useEffect } from 'react';
import { DocumentStats } from '@/types/documents';

export const useDocumentSummary = () => {
  const [stats, setStats] = useState<DocumentStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });

  useEffect(() => {
    // Function to load documents and calculate stats
    const loadDocuments = () => {
      // Retrieve documents from local storage
      const storedDocuments = localStorage.getItem('documents');
      
      if (storedDocuments) {
        const documents = JSON.parse(storedDocuments);
        
        // Calculate stats
        const newStats = {
          exclusion: documents.filter((d: any) => d.etat === 'EX').length,
          nonConforme: documents.filter((d: any) => d.etat === 'NC').length,
          partiellementConforme: documents.filter((d: any) => d.etat === 'PC').length,
          conforme: documents.filter((d: any) => d.etat === 'C').length,
          total: documents.filter((d: any) => d.etat !== 'EX').length
        };
        
        setStats(newStats);
      }
    };

    // Load documents initially
    loadDocuments();

    // Set up event listener for storage changes
    window.addEventListener('storage', loadDocuments);

    // Clean up event listener
    return () => {
      window.removeEventListener('storage', loadDocuments);
    };
  }, []);

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
