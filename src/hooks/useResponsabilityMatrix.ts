
import { useState, useEffect } from 'react';
import { useMembres } from '@/contexts/MembresContext';
import { Membre } from '@/types/membres';

interface ResponsabiliteCount {
  r: number;
  a: number;
  c: number;
  i: number;
}

export interface MembreResponsabilite extends Membre {
  exigences: ResponsabiliteCount;
  documents: ResponsabiliteCount;
}

export const useResponsabilityMatrix = () => {
  const { membres } = useMembres();
  const [membreResponsabilites, setMembreResponsabilites] = useState<MembreResponsabilite[]>([]);

  useEffect(() => {
    const calculateResponsabilites = () => {
      // Load exigences and documents from local storage
      const storedExigences = localStorage.getItem('exigences');
      const storedDocuments = localStorage.getItem('documents');
      
      const exigences = storedExigences ? JSON.parse(storedExigences) : [];
      const documents = storedDocuments ? JSON.parse(storedDocuments) : [];
      
      // Calculate responsabilities for each membre
      const membresWithResponsabilites = membres.map(membre => {
        const initiales = membre.initiales;
        
        // Initialize counters
        const exigencesCount = { r: 0, a: 0, c: 0, i: 0 };
        const documentsCount = { r: 0, a: 0, c: 0, i: 0 };
        
        // Count occurrences in exigences
        exigences.forEach((exigence: any) => {
          if (exigence.responsabilites.r.includes(initiales)) exigencesCount.r++;
          if (exigence.responsabilites.a.includes(initiales)) exigencesCount.a++;
          if (exigence.responsabilites.c.includes(initiales)) exigencesCount.c++;
          if (exigence.responsabilites.i.includes(initiales)) exigencesCount.i++;
        });
        
        // Count occurrences in documents
        documents.forEach((document: any) => {
          if (document.responsabilites.r.includes(initiales)) documentsCount.r++;
          if (document.responsabilites.a.includes(initiales)) documentsCount.a++;
          if (document.responsabilites.c.includes(initiales)) documentsCount.c++;
          if (document.responsabilites.i.includes(initiales)) documentsCount.i++;
        });
        
        // Include all properties from the membre and add the new properties
        return {
          ...membre,
          exigences: exigencesCount,
          documents: documentsCount,
        } as MembreResponsabilite;
      });
      
      setMembreResponsabilites(membresWithResponsabilites);
    };

    // Calculate initially
    calculateResponsabilites();
    
    // Listen for updates to exigences, documents and membres
    window.addEventListener('exigenceUpdate', calculateResponsabilites);
    window.addEventListener('documentUpdate', calculateResponsabilites);
    window.addEventListener('storage', calculateResponsabilites);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('exigenceUpdate', calculateResponsabilites);
      window.removeEventListener('documentUpdate', calculateResponsabilites);
      window.removeEventListener('storage', calculateResponsabilites);
    };
  }, [membres]);

  return { membreResponsabilites };
};
