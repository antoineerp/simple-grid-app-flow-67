
import { useState, useEffect } from 'react';
import { useMembres } from '@/contexts/MembresContext';
import { Membre } from '@/types/membres';
import { getCurrentUserId } from '@/services/core/userService';

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
  const userId = getCurrentUserId();

  useEffect(() => {
    const calculateResponsabilites = () => {
      // Charger les exigences et documents depuis le localStorage spécifiques à l'utilisateur actuel
      const storedExigences = localStorage.getItem(`exigences_${userId}`);
      const storedDocuments = localStorage.getItem(`documents_${userId}`);
      
      const exigences = storedExigences ? JSON.parse(storedExigences) : [];
      const documents = storedDocuments ? JSON.parse(storedDocuments) : [];
      
      console.log(`Exigences chargées pour ${userId}:`, exigences.length);
      console.log(`Documents chargés pour ${userId}:`, documents.length);

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
            .filter((exigence: any) => !exigence.exclusion && exigence.userId === userId)
            .forEach((exigence: any) => {
              if (exigence.responsabilites) {
                // Vérifier si les initiales du membre sont dans chaque type de responsabilité
                if (exigence.responsabilites.r && Array.isArray(exigence.responsabilites.r) && exigence.responsabilites.r.includes(initiales)) {
                  exigencesCount.r++;
                }
                if (exigence.responsabilites.a && Array.isArray(exigence.responsabilites.a) && exigence.responsabilites.a.includes(initiales)) {
                  exigencesCount.a++;
                }
                if (exigence.responsabilites.c && Array.isArray(exigence.responsabilites.c) && exigence.responsabilites.c.includes(initiales)) {
                  exigencesCount.c++;
                }
                if (exigence.responsabilites.i && Array.isArray(exigence.responsabilites.i) && exigence.responsabilites.i.includes(initiales)) {
                  exigencesCount.i++;
                }
              }
            });
        }
        
        // Compter les occurrences dans les documents (en excluant les documents exclus)
        if (Array.isArray(documents)) {
          documents
            .filter((document: any) => document.etat !== 'EX' && document.userId === userId)
            .forEach((document: any) => {
              if (document.responsabilites) {
                // Vérifier si les initiales du membre sont dans chaque type de responsabilité
                if (document.responsabilites.r && Array.isArray(document.responsabilites.r) && document.responsabilites.r.includes(initiales)) {
                  documentsCount.r++;
                }
                if (document.responsabilites.a && Array.isArray(document.responsabilites.a) && document.responsabilites.a.includes(initiales)) {
                  documentsCount.a++;
                }
                if (document.responsabilites.c && Array.isArray(document.responsabilites.c) && document.responsabilites.c.includes(initiales)) {
                  documentsCount.c++;
                }
                if (document.responsabilites.i && Array.isArray(document.responsabilites.i) && document.responsabilites.i.includes(initiales)) {
                  documentsCount.i++;
                }
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
