
import React, { useEffect, useState } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { toast } from '@/components/ui/use-toast';
import SyncIndicator from './SyncIndicator';

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, syncStates } = useGlobalSync();
  const [showError, setShowError] = useState(false);
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  
  // Utiliser un effet pour démarrer la synchronisation en arrière-plan
  useEffect(() => {
    try {
      console.log("GlobalSyncManager - Initialisation de la synchronisation");
      
      // Déclencher la première synchronisation après 2 secondes
      const timeoutId = setTimeout(() => {
        console.log("GlobalSyncManager - Démarrage de la synchronisation initiale");
        setSyncingInProgress(true);
        
        syncAll()
          .then(results => {
            console.log("GlobalSyncManager - Résultats de la synchronisation initiale:", results);
            setSyncingInProgress(false);
            
            const successCount = Object.values(results).filter(Boolean).length;
            const totalCount = Object.keys(results).length;
            
            if (successCount > 0) {
              toast({
                title: "Synchronisation initiale terminée",
                description: `${successCount}/${totalCount} tables ont été synchronisées avec Infomaniak`,
              });
            } else if (totalCount > 0) {
              toast({
                variant: "destructive",
                title: "Échec de synchronisation",
                description: "Aucune table n'a pu être synchronisée avec Infomaniak. Vérifiez votre connexion."
              });
              setShowError(true);
            }
          })
          .catch(error => {
            console.error("GlobalSyncManager - Erreur lors de la synchronisation initiale:", error);
            setSyncingInProgress(false);
            setShowError(true);
            
            toast({
              variant: "destructive",
              title: "Erreur de synchronisation",
              description: "Une erreur s'est produite lors de la synchronisation avec Infomaniak."
            });
          });
      }, 2000);
      
      // Planifier des synchronisations périodiques (toutes les 5 minutes)
      const intervalId = setInterval(() => {
        if (isOnline) {
          console.log("GlobalSyncManager - Exécution de la synchronisation périodique");
          syncAll().catch(error => {
            console.error("GlobalSyncManager - Erreur lors de la synchronisation périodique:", error);
          });
        }
      }, 300000); // 5 minutes
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
      setShowError(true);
    }
  }, [syncAll, isOnline]);
  
  // Vérifier si une synchronisation a échoué
  const hasSyncFailed = Object.values(syncStates).some(state => state.syncFailed);
  
  // Ne pas rendre le composant s'il n'y a pas d'erreur à afficher
  if (!showError && !hasSyncFailed && !syncingInProgress) {
    return null;
  }
  
  // Si une synchronisation est en cours, afficher l'indicateur de synchronisation
  if (syncingInProgress) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <SyncIndicator 
          isSyncing={true}
          isOnline={isOnline}
          syncFailed={false}
          lastSynced={null}
          onSync={async () => {
            // Transformer en fonction async
            await syncAll();
            return Promise.resolve();
          }}
        />
      </div>
    );
  }
  
  // Si une synchronisation a échoué, afficher l'indicateur d'erreur
  if (hasSyncFailed) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <SyncIndicator 
          isSyncing={false}
          isOnline={isOnline}
          syncFailed={true}
          lastSynced={null}
          onSync={async () => {
            // Transformer en fonction async qui retourne une promesse
            setSyncingInProgress(true);
            try {
              await syncAll();
            } finally {
              setSyncingInProgress(false);
            }
          }}
        />
      </div>
    );
  }
  
  return null;
};

export default GlobalSyncManager;
