
import React, { useState, useEffect } from 'react';
import { dataSyncManager } from '@/services/sync/DataSyncManager';
import { toast } from '@/components/ui/use-toast';

const GlobalSyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState({
    activeSyncCount: 0,
    pendingChangesCount: 0,
    failedSyncCount: 0
  });
  
  useEffect(() => {
    // Vérifier périodiquement l'état global de synchronisation
    const intervalId = setInterval(() => {
      try {
        const status = dataSyncManager.getGlobalSyncStatus();
        setSyncStatus({
          activeSyncCount: status.activeSyncCount,
          pendingChangesCount: status.pendingChangesCount,
          failedSyncCount: status.failedSyncCount
        });
        
        // Si des synchronisations ont échoué, afficher un toast mais pas trop souvent
        if (status.failedSyncCount > 0 && Math.random() < 0.1) {
          toast({
            title: "Synchronisation en attente",
            description: `${status.failedSyncCount} table(s) n'ont pas pu être synchronisée(s).`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut de synchronisation:", error);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return null; // Ce composant n'affiche rien, il gère uniquement la logique en arrière-plan
};

export default GlobalSyncManager;
