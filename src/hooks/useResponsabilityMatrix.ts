
import { useState, useEffect } from 'react';
import { useMembres } from '@/contexts/MembresContext';
import { Membre } from '@/types/membres';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

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
  const userId = getCurrentUser();
  
  useEffect(() => {
    const calculateResponsabilites = () => {
      // Charger les exigences et documents depuis le localStorage pour l'utilisateur actuel
      const storagePrefix = `${userId}_`;
      const storedExigences = localStorage.getItem(`exigences_${storagePrefix}`);
      const storedDocuments = localStorage.getItem(`documents_${storagePrefix}`);
      
      const exigences = storedExigences ? JSON.parse(storedExigences) : [];
      const documents = storedDocuments ? JSON.parse(storedDocuments) : [];
      
      console.log(`Données chargées pour ${userId}: ${exigences.length} exigences, ${documents.length} documents`);

      // Calculer les responsabilités pour chaque membre
      const membresWithResponsabilites = membres.map(membre => {
        const initiales = membre.initiales;
        
        if (!initiales) {
          console.warn(`Membre sans initiales: ${membre.prenom} ${membre.nom}`);
          return {
            ...membre,
            exigences: { r: 0, a: 0, c: 0, i: 0 },
            documents: { r: 0, a: 0, c: 0, i: 0 }
          } as MembreResponsabilite;
        }
        
        // Initialiser les compteurs
        const exigencesCount = { r: 0, a: 0, c: 0, i: 0 };
        const documentsCount = { r: 0, a: 0, c: 0, i: 0 };

        // Compter les occurrences dans les exigences (en excluant les exigences exclues)
        if (Array.isArray(exigences)) {
          exigences
            .filter((exigence: any) => !exigence.exclusion)
            .forEach((exigence: any) => {
              if (exigence.responsabilites) {
                // Vérifier si les initiales du membre sont dans chaque type de responsabilité
                if (exigence.responsabilites.r?.includes(initiales)) exigencesCount.r++;
                if (exigence.responsabilites.a?.includes(initiales)) exigencesCount.a++;
                if (exigence.responsabilites.c?.includes(initiales)) exigencesCount.c++;
                if (exigence.responsabilites.i?.includes(initiales)) exigencesCount.i++;
              }
            });
        }
        
        // Compter les occurrences dans les documents (en tenant compte que le document peut avoir excluded=true ou etat='EX')
        if (Array.isArray(documents)) {
          documents
            .filter((document: any) => !document.excluded && document.etat !== 'EX')
            .forEach((document: any) => {
              if (document.responsabilites) {
                // Vérifier si les initiales du membre sont dans chaque type de responsabilité
                if (document.responsabilites.r?.includes(initiales)) documentsCount.r++;
                if (document.responsabilites.a?.includes(initiales)) documentsCount.a++;
                if (document.responsabilites.c?.includes(initiales)) documentsCount.c++;
                if (document.responsabilites.i?.includes(initiales)) documentsCount.i++;
              }
            });
        }

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
  }, [membres, userId]);

  return { membreResponsabilites };
};
