
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
      // Obtenir l'identifiant de l'utilisateur actuel
      const currentUser = localStorage.getItem('userId') || 'anonymous';
      
      // Charger les exigences et documents depuis le localStorage avec le préfixe utilisateur
      const storedExigences = localStorage.getItem(`exigences_${currentUser}`);
      const storedDocuments = localStorage.getItem(`documents_${currentUser}`);
      
      const exigences = storedExigences ? JSON.parse(storedExigences) : [];
      const documents = storedDocuments ? JSON.parse(storedDocuments) : [];
      
      console.log(`[Matrix] User ID: ${currentUser}`);
      console.log(`[Matrix] Exigences chargées: ${exigences.length}`);
      console.log(`[Matrix] Documents chargés: ${documents.length}`);

      // Calculer les responsabilités pour chaque membre
      const membresWithResponsabilites = membres.map(membre => {
        const initiales = membre.initiales;
        console.log(`[Matrix] Calcul des responsabilités pour ${membre.prenom} ${membre.nom} (${initiales})`);
        
        // Initialiser les compteurs
        const exigencesCount = { r: 0, a: 0, c: 0, i: 0 };
        const documentsCount = { r: 0, a: 0, c: 0, i: 0 };

        // Compter les occurrences dans les exigences (en excluant les exigences exclues)
        exigences
          .filter((exigence: any) => !exigence.exclusion)
          .forEach((exigence: any) => {
            if (exigence.responsabilites) {
              // Vérifier si les initiales du membre sont dans chaque type de responsabilité
              if (exigence.responsabilites.r && exigence.responsabilites.r.includes(initiales)) {
                exigencesCount.r++;
              }
              if (exigence.responsabilites.a && exigence.responsabilites.a.includes(initiales)) {
                exigencesCount.a++;
              }
              if (exigence.responsabilites.c && exigence.responsabilites.c.includes(initiales)) {
                exigencesCount.c++;
              }
              if (exigence.responsabilites.i && exigence.responsabilites.i.includes(initiales)) {
                exigencesCount.i++;
              }
            }
          });
        
        // Compter les occurrences dans les documents (en excluant les documents exclus)
        documents
          .filter((document: any) => document.etat !== 'EX')
          .forEach((document: any) => {
            if (document.responsabilites) {
              // Vérifier si les initiales du membre sont dans chaque type de responsabilité
              if (document.responsabilites.r && document.responsabilites.r.includes(initiales)) {
                documentsCount.r++;
              }
              if (document.responsabilites.a && document.responsabilites.a.includes(initiales)) {
                documentsCount.a++;
              }
              if (document.responsabilites.c && document.responsabilites.c.includes(initiales)) {
                documentsCount.c++;
              }
              if (document.responsabilites.i && document.responsabilites.i.includes(initiales)) {
                documentsCount.i++;
              }
            }
          });

        console.log(`[Matrix] Résultats pour ${initiales}:`, { 
          exigences: exigencesCount, 
          documents: documentsCount,
          total: exigencesCount.r + exigencesCount.a + exigencesCount.c + exigencesCount.i + 
                 documentsCount.r + documentsCount.a + documentsCount.c + documentsCount.i
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
