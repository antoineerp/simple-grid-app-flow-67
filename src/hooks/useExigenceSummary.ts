
import { useState, useEffect } from 'react';
import { getCurrentUserId } from '@/utils/userUtils';
import { Exigence } from '@/types/exigences';

export const useExigenceSummary = () => {
  const currentUser = getCurrentUserId();
  const [nonConforme, setNonConforme] = useState(0);
  const [partiellementConforme, setPartiellementConforme] = useState(0);
  const [conforme, setConforme] = useState(0);
  const [exclusion, setExclusion] = useState(0);
  const [total, setTotal] = useState(0);
  const [conformityRate, setConformityRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("[useExigenceSummary] Chargement des données d'exigences");
        const tableName = 'exigences';
        
        // Essayer de charger depuis localStorage d'abord
        const storedExigences = localStorage.getItem(`${tableName}_${currentUser}`);
        
        if (!storedExigences) {
          console.log("[useExigenceSummary] Aucune donnée trouvée dans localStorage");
          setIsLoading(false);
          return;
        }
        
        const exigences: Exigence[] = JSON.parse(storedExigences);
        if (!Array.isArray(exigences)) {
          throw new Error("Format de données invalide");
        }
        
        console.log(`[useExigenceSummary] ${exigences.length} exigences chargées`);
        
        // Filtrer et compter les exigences par statut
        const excludedCount = exigences.filter(e => e.exclusion).length;
        const validExigences = exigences.filter(e => !e.exclusion);
        const ncCount = validExigences.filter(e => e.atteinte === 'NC').length;
        const pcCount = validExigences.filter(e => e.atteinte === 'PC').length;
        const cCount = validExigences.filter(e => e.atteinte === 'C').length;
        const totalCount = validExigences.length;
        
        // Calculer le taux de conformité
        const conformRate = totalCount > 0 ? Math.round((cCount / totalCount) * 100) : 0;
        
        // Mettre à jour les états
        setNonConforme(ncCount);
        setPartiellementConforme(pcCount);
        setConforme(cCount);
        setExclusion(excludedCount);
        setTotal(totalCount);
        setConformityRate(conformRate);
        
      } catch (err) {
        console.error("[useExigenceSummary] Erreur lors du chargement des données:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  return {
    nonConforme,
    partiellementConforme,
    conforme,
    exclusion,
    total,
    conformityRate,
    isLoading,
    error
  };
};
