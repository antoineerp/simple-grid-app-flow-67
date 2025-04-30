
import React, { useEffect, useState } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { toast } from '@/components/ui/use-toast';
import SyncIndicator from './SyncIndicator';

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, syncStates } = useGlobalSync();
  const [showError, setShowError] = useState(false);
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const [syncTimer, setSyncTimer] = useState<NodeJS.Timeout | null>(null);
  
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
        if (isOnline && !syncingInProgress) {
          console.log("GlobalSyncManager - Exécution de la synchronisation périodique");
          // Ne pas mettre à jour syncingInProgress ici pour éviter d'afficher l'indicateur
          syncAll().catch(error => {
            console.error("GlobalSyncManager - Erreur lors de la synchronisation périodique:", error);
          });
        }
      }, 300000); // 5 minutes
      
      setSyncTimer(intervalId);
      
      return () => {
        clearTimeout(timeoutId);
        if (syncTimer) clearInterval(syncTimer);
      };
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
      setShowError(true);
    }
  }, [syncAll, isOnline]);
  
  // S'assurer que l'indicateur de synchronisation disparaît après 30 secondes maximum
  // Cela évite qu'il reste bloqué indéfiniment
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (syncingInProgress) {
      timeoutId = setTimeout(() => {
        console.log("GlobalSyncManager - Timeout de synchronisation atteint, réinitialisation de l'état");
        setSyncingInProgress(false);
      }, 30000); // 30 secondes maximum
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [syncingInProgress]);
  
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
            try {
              await syncAll();
              setSyncingInProgress(false);
              return Promise.resolve();
            } catch (error) {
              console.error("Erreur lors de la synchronisation manuelle:", error);
              setSyncingInProgress(false);
              return Promise.reject(error);
            }
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
            setSyncingInProgress(true);
            try {
              await syncAll();
              setSyncingInProgress(false);
              return Promise.resolve();
            } catch (error) {
              console.error("Erreur lors de la synchronisation manuelle:", error);
              setSyncingInProgress(false);
              return Promise.reject(error);
            }
          }}
        />
      </div>
    );
  }
  
  return null;
};

export default GlobalSyncManager;
