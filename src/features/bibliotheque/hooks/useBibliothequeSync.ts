
import { useState, useEffect, useCallback } from 'react';
import { useSyncContext } from '@/hooks/useSyncContext';
import { syncService } from '@/services/sync';
import { useToast } from '@/hooks/use-toast';
import { MembresProvider } from '@/contexts/MembresContext';

// Types pour les documents et groupes de la bibliothèque
interface BibliothequeDocument {
  id: string;
  titre: string;
  description?: string;
  groupe_id?: string;
  // ... autres propriétés
}

interface BibliothequeGroup {
  id: string;
  nom: string;
  description?: string;
  ordre?: number;
  // ... autres propriétés
}

export const useBibliothequeSync = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<BibliothequeDocument[]>([]);
  const [groups, setGroups] = useState<BibliothequeGroup[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Récupérer le contexte de synchronisation
  const syncContext = useSyncContext();
  const isSyncEnabled = syncContext?.isSyncEnabled || false;

  // Fonction pour charger les données
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Utiliser syncTable au lieu de loadDataFromServer
      const result = await syncService.syncTable('bibliotheque');
      
      if (result.success) {
        // Récupérer les données après synchronisation
        const data = await fetchBibliothequeData();
        
        if (data) {
          setDocuments(data.documents || []);
          setGroups(data.groups || []);
          
          // Mettre à jour la date de dernière synchronisation
          const now = new Date().toISOString();
          setLastSynced(now);
          
          toast({
            title: "Bibliothèque synchronisée",
            description: "Les documents ont été mis à jour avec succès",
          });
        }
      } else {
        setError("Erreur lors de la synchronisation");
        toast({
          title: "Erreur de synchronisation",
          description: "Impossible de synchroniser les documents",
          variant: "destructive",
        });
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
  }, [toast]);

  // Fonction pour récupérer les données de la bibliothèque
  const fetchBibliothequeData = async () => {
    try {
      // Simuler la récupération des données
      // Dans un cas réel, vous feriez un appel API ici
      return {
        documents: [
          { id: '1', titre: 'Document 1', description: 'Description 1', groupe_id: 'g1' },
          { id: '2', titre: 'Document 2', description: 'Description 2', groupe_id: 'g1' },
          { id: '3', titre: 'Document 3', description: 'Description 3', groupe_id: 'g2' },
        ],
        groups: [
          { id: 'g1', nom: 'Groupe 1', description: 'Description groupe 1', ordre: 1 },
          { id: 'g2', nom: 'Groupe 2', description: 'Description groupe 2', ordre: 2 },
        ]
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      return null;
    }
  };

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
