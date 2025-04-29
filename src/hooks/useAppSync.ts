
import { useState, useCallback } from 'react';
import { useSyncService } from '@/services/core/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

/**
 * Hook pour la synchronisation globale de l'application
 * Ce hook fournit une interface unifiée pour synchroniser toutes les données
 * de l'application en une seule fois.
 */
export const useAppSync = () => {
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<Date | null>(null);
  const syncService = useSyncService();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();

  /**
   * Synchronise toutes les données de l'application en une seule fois
   * @param options Options contenant les données à synchroniser
   */
  const syncAllData = useCallback(async (options: {
    documents?: any[],
    membres?: any[],
    exigences?: any[],
    bibliotheque?: any[]
  }) => {
    if (!isOnline || isGlobalSyncing) {
      toast({
        title: isGlobalSyncing ? "Synchronisation en cours" : "Hors ligne", 
        description: isGlobalSyncing ? 
          "Veuillez attendre la fin de la synchronisation en cours" : 
          "Connexion internet requise pour la synchronisation",
        variant: "destructive"
      });
      return false;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Non authentifié",
        description: "Vous devez être connecté pour synchroniser vos données",
        variant: "destructive"
      });
      return false;
    }

    setIsGlobalSyncing(true);
    try {
      const allPromises = [];

      // Synchroniser les documents si fournis
      if (options.documents) {
        allPromises.push(syncService.syncWithServer({
          endpoint: 'documents-sync.php',
          loadEndpoint: 'documents-load.php',
          data: options.documents,
          userId: currentUser
        }));
      }

      // Synchroniser les membres si fournis
      if (options.membres) {
        allPromises.push(syncService.syncWithServer({
          endpoint: 'membres-sync.php',
          loadEndpoint: 'membres-load.php',
          data: options.membres,
          userId: currentUser,
          dataName: 'membres'
        }));
      }

      // Synchroniser les exigences si fournies
      if (options.exigences) {
        allPromises.push(syncService.syncWithServer({
          endpoint: 'exigences-sync.php',
          loadEndpoint: 'exigences-load.php',
          data: options.exigences,
          userId: currentUser,
          dataName: 'exigences'
        }));
      }

      // Synchroniser la bibliothèque si fournie
      if (options.bibliotheque) {
        allPromises.push(syncService.syncWithServer({
          endpoint: 'bibliotheque-sync.php',
          loadEndpoint: 'bibliotheque-load.php',
          data: options.bibliotheque,
          userId: currentUser,
          dataName: 'ressources'
        }));
      }

      // Attendre que toutes les synchronisations soient terminées
      const results = await Promise.all(allPromises);
      const success = results.every(result => result === true);

      if (success) {
        setLastGlobalSync(new Date());
        toast({
          title: "Synchronisation globale réussie",
          description: "Toutes les données ont été synchronisées avec le serveur",
        });
      } else {
        toast({
          title: "Synchronisation partielle",
          description: "Certaines données n'ont pas pu être synchronisées",
          variant: "destructive"
        });
      }

      return success;
    } catch (error) {
      console.error("Erreur lors de la synchronisation globale:", error);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsGlobalSyncing(false);
    }
  }, [isOnline, isGlobalSyncing, syncService, toast]);

  return {
    syncAllData,
    isGlobalSyncing,
    lastGlobalSync,
    isOnline,
    ...syncService
  };
};
