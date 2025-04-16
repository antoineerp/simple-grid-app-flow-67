
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
    // Retrieve exigences from local storage
    const storedExigences = localStorage.getItem('exigences');
    
    if (storedExigences) {
      const exigences = JSON.parse(storedExigences);
      
      // Calculate stats
      const newStats = {
        exclusion: exigences.filter((e: any) => e.exclusion).length,
        nonConforme: exigences.filter((e: any) => e.atteinte === 'NC').length,
        partiellementConforme: exigences.filter((e: any) => e.atteinte === 'PC').length,
        conforme: exigences.filter((e: any) => e.atteinte === 'C').length,
        total: exigences.length
      };
      
      setStats(newStats);
    }
  }, []);

  return stats;
};
