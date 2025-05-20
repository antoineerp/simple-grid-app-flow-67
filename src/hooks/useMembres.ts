
import { useState, useEffect, useCallback } from 'react';
import { Membre } from '@/types/membres';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedSync } from '@/hooks/useUnifiedSync';

// Hook pour la gestion des membres utilisant notre système de synchronisation unifié
export const useMembres = () => {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Utiliser notre hook de synchronisation unifié
  const {
    data: membres,
    setData: setMembres,
    syncState: {
      isSyncing,
      lastSynced,
      syncFailed,
      pendingSync
    },
    isOnline,
    loadFromServer,
    syncWithServer,
    loadFromLocalStorage
  } = useUnifiedSync<Membre[]>('membres', []);

  // Initialiser avec quelques membres par défaut si nécessaire
  useEffect(() => {
    const initializeMembres = async () => {
      // Charger d'abord depuis le stockage local
      const localMembres = loadFromLocalStorage();
      
      if (localMembres.length > 0) {
        console.log("useMembres: Membres chargés depuis le stockage local:", localMembres.length);
        setMembres(localMembres);
      } else {
        // Données par défaut si aucun membre n'est trouvé
        const defaultMembres: Membre[] = [
          {
            id: '1',
            nom: 'Dupont',
            prenom: 'Jean',
            fonction: 'Directeur',
            initiales: 'JD',
            date_creation: new Date()
          },
          {
            id: '2',
            nom: 'Martin',
            prenom: 'Sophie',
            fonction: 'Responsable RH',
            initiales: 'SM',
            date_creation: new Date()
          }
        ];
        
        console.log("useMembres: Aucun membre trouvé, utilisation des membres par défaut");
        setMembres(defaultMembres);
        
        // Sauvegarder les membres par défaut et synchroniser si en ligne
        if (isOnline) {
          await syncWithServer(defaultMembres, { silent: true });
        }
      }
      
      // Puis essayer de charger depuis le serveur
      if (isOnline) {
        try {
          const result = await loadFromServer();
          if (result.success && result.data && result.data.length > 0) {
            console.log("useMembres: Membres chargés depuis le serveur:", result.data.length);
          }
        } catch (error) {
          console.error("useMembres: Erreur lors du chargement des membres:", error);
          setError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
    
    initializeMembres();
  }, [isOnline, loadFromLocalStorage, loadFromServer, setMembres, syncWithServer]);

  // Fonction pour réinitialiser l'état d'erreur
  const resetSyncFailed = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour rafraîchir les membres depuis le serveur
  const refreshMembres = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "Impossible de rafraîchir les données en mode hors ligne",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const result = await loadFromServer({ forceRefresh: true });
      
      if (result.success) {
        toast({
          title: "Rafraîchissement réussi",
          description: "Les membres ont été mis à jour avec succès"
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("useMembres: Erreur lors du rafraîchissement des membres:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      toast({
        title: "Erreur de rafraîchissement",
        description: error instanceof Error ? error.message : "Impossible de rafraîchir les membres",
        variant: "destructive"
      });
    }
  }, [isOnline, loadFromServer, toast]);

  return {
    membres,
    setMembres,
    lastSynced,
    isLoading: isSyncing,
    error,
    syncFailed,
    resetSyncFailed,
    refreshMembres
  };
};

export default useMembres;
