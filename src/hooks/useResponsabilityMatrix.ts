
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
      // Charger les exigences et documents depuis le localStorage
      const storedExigences = localStorage.getItem('exigences');
      const storedDocuments = localStorage.getItem('documents');
      
      const exigences = storedExigences ? JSON.parse(storedExigences) : [];
      const documents = storedDocuments ? JSON.parse(storedDocuments) : [];

      // Calculer les responsabilités pour chaque membre
      const membresWithResponsabilites = membres.map(membre => {
        const initiales = membre.initiales;
        
        // Initialiser les compteurs
        const exigencesCount = { r: 0, a: 0, c: 0, i: 0 };
        const documentsCount = { r: 0, a: 0, c: 0, i: 0 };

        // Compter les occurrences dans les exigences (en excluant les exigences exclues)
        exigences
          .filter((exigence: any) => !exigence.exclusion)
          .forEach((exigence: any) => {
            if (exigence.responsabilites.r.includes(initiales)) exigencesCount.r++;
            if (exigence.responsabilites.a.includes(initiales)) exigencesCount.a++;
            if (exigence.responsabilites.c.includes(initiales)) exigencesCount.c++;
            if (exigence.responsabilites.i.includes(initiales)) exigencesCount.i++;
          });
        
        // Compter les occurrences dans les documents (en excluant les documents exclus)
        documents
          .filter((document: any) => document.etat !== 'EX')
          .forEach((document: any) => {
            if (document.responsabilites.r.includes(initiales)) documentsCount.r++;
            if (document.responsabilites.a.includes(initiales)) documentsCount.a++;
            if (document.responsabilites.c.includes(initiales)) documentsCount.c++;
            if (document.responsabilites.i.includes(initiales)) documentsCount.i++;
          });

        // Inclure toutes les propriétés du membre et ajouter les nouvelles propriétés
        return {
          ...membre,
          exigences: exigencesCount,
          documents: documentsCount,
        } as MembreResponsabilite;
      });
      
      setMembreResponsabilites(membresWithResponsabilites);
    };

    // Calculer initialement
    calculateResponsabilites();
    
    // Écouter les mises à jour des exigences, documents et membres
    window.addEventListener('exigenceUpdate', calculateResponsabilites);
    window.addEventListener('documentUpdate', calculateResponsabilites);
    window.addEventListener('storage', calculateResponsabilites);
    
    // Nettoyer les event listeners
    return () => {
      window.removeEventListener('exigenceUpdate', calculateResponsabilites);
      window.removeEventListener('documentUpdate', calculateResponsabilites);
      window.removeEventListener('storage', calculateResponsabilites);
    };
  }, [membres]);

  return { membreResponsabilites };
};
