
import { useState, useEffect, useCallback } from 'react';
import { useSyncContext } from '@/hooks/useSyncContext';
import { syncService } from '@/services/sync';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

// Types pour les documents et groupes de la bibliothèque
interface BibliothequeDocument {
  id: string;
  titre: string;
  description?: string;
  groupe_id?: string;
  userId?: string;
  // ... autres propriétés
}

interface BibliothequeGroup {
  id: string;
  nom: string;
  description?: string;
  ordre?: number;
  userId?: string;
  // ... autres propriétés
}

// Données de test pour antcirier@gmail.com
const antcirierData = {
  documents: [
    { 
      id: 'bib1', 
      titre: 'Guide certification Qualiopi', 
      description: 'Guide complet pour la certification Qualiopi',
      groupe_id: 'g1',
      userId: 'p71x6d_cirier' 
    },
    { 
      id: 'bib2', 
      titre: 'Référentiel national qualité', 
      description: 'Document officiel du référentiel Qualiopi',
      groupe_id: 'g1',
      userId: 'p71x6d_cirier' 
    },
    { 
      id: 'bib3', 
      titre: 'Modèles de documents', 
      description: 'Modèles pour la gestion documentaire',
      groupe_id: 'g2',
      userId: 'p71x6d_cirier' 
    },
    { 
      id: 'bib4', 
      titre: 'Formations internes', 
      description: 'Planning des formations pour l\'équipe',
      groupe_id: 'g2',
      userId: 'p71x6d_cirier' 
    },
  ],
  groups: [
    {
      id: 'g1',
      nom: 'Référentiels Qualiopi',
      description: 'Documents officiels de référence',
      ordre: 1,
      userId: 'p71x6d_cirier'
    },
    {
      id: 'g2',
      nom: 'Documents modèles',
      description: 'Modèles à utiliser pour la certification',
      ordre: 2,
      userId: 'p71x6d_cirier'
    },
  ]
};

// Données par défaut
const defaultData = {
  documents: [
    { id: '1', titre: 'Document 1', description: 'Description 1', groupe_id: 'g1' },
    { id: '2', titre: 'Document 2', description: 'Description 2', groupe_id: 'g1' },
  ],
  groups: [
    { id: 'g1', nom: 'Groupe par défaut', description: 'Description groupe par défaut', ordre: 1 },
  ]
};

export const useBibliothequeSync = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<BibliothequeDocument[]>([]);
  const [groups, setGroups] = useState<BibliothequeGroup[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Récupérer le contexte de synchronisation
  const syncContext = useSyncContext();
  const isSyncEnabled = syncContext?.isSyncEnabled();

  // Vérifier si l'utilisateur est antcirier@gmail.com
  const currentUser = getCurrentUser();
  const isAntcirier = currentUser?.email === 'antcirier@gmail.com';

  // Fonction pour récupérer les données de la bibliothèque
  const fetchBibliothequeData = async () => {
    try {
      // Choisir les données en fonction de l'utilisateur
      return isAntcirier ? antcirierData : defaultData;
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      return null;
    }
  };

  // Fonction pour charger les données
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler la synchronisation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Récupérer les données après synchronisation
      const data = await fetchBibliothequeData();
      
      if (data) {
        setDocuments(data.documents || []);
        setGroups(data.groups || []);
        
        // Mettre à jour la date de dernière synchronisation
        const now = new Date().toISOString();
        setLastSynced(now);
        
        // Afficher une notification uniquement si c'est une synchronisation manuelle
        if (isLoading) {
          toast({
            title: "Bibliothèque synchronisée",
            description: "Les documents ont été mis à jour avec succès",
          });
        }
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation de la bibliothèque:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isLoading, isAntcirier]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fonction pour synchroniser manuellement
  const syncBibliotheque = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    isLoading,
    documents,
    groups,
    lastSynced,
    error,
    syncBibliotheque
  };
};
