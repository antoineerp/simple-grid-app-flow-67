
import { useState, useEffect } from 'react';
import { ExigenceStats } from '@/types/exigences';

export const useExigenceSummary = () => {
  const [stats, setStats] = useState<ExigenceStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });

  useEffect(() => {
    // Function to load exigences and calculate stats
    const loadExigences = () => {
      // Retrieve exigences from local storage
      const storedExigences = localStorage.getItem('exigences');
      
      if (storedExigences) {
        const exigences = JSON.parse(storedExigences);
        
        // Calculate stats
        const newStats = {
          exclusion: exigences.filter((e: any) => e.exclusion).length,
          nonConforme: exigences.filter((e: any) => !e.exclusion && e.atteinte === 'NC').length,
          partiellementConforme: exigences.filter((e: any) => !e.exclusion && e.atteinte === 'PC').length,
          conforme: exigences.filter((e: any) => !e.exclusion && e.atteinte === 'C').length,
          total: exigences.filter((e: any) => !e.exclusion).length
        };
        
        setStats(newStats);
      }
    };

    // Load exigences initially
    loadExigences();

    // Set up event listener for storage changes
    window.addEventListener('storage', loadExigences);

    // Clean up event listener
    return () => {
      window.removeEventListener('storage', loadExigences);
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
