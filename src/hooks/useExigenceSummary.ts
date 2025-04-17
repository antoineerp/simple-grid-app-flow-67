
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
        const exclusionCount = exigences.filter((e: any) => e.exclusion).length;
        const nonExcludedExigences = exigences.filter((e: any) => !e.exclusion);
        
        const newStats = {
          exclusion: exclusionCount,
          nonConforme: nonExcludedExigences.filter((e: any) => e.atteinte === 'NC').length,
          partiellementConforme: nonExcludedExigences.filter((e: any) => e.atteinte === 'PC').length,
          conforme: nonExcludedExigences.filter((e: any) => e.atteinte === 'C').length,
          total: nonExcludedExigences.length
        };
        
        setStats(newStats);
      }
    };

    // Load exigences initially
    loadExigences();

    // Set up event listener for storage changes
    window.addEventListener('storage', loadExigences);
    // Add custom event listener for exigence updates
    window.addEventListener('exigenceUpdate', loadExigences);

    // Clean up event listeners
    return () => {
      window.removeEventListener('storage', loadExigences);
      window.removeEventListener('exigenceUpdate', loadExigences);
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
