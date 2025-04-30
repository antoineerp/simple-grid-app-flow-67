
import React, { useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import SyncIndicator from './SyncIndicator';

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, syncStates } = useGlobalSync();
  const [showError, setShowError] = useState(false);
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  
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
            
            if (successCount === 0 && totalCount > 0) {
              console.error("GlobalSyncManager - Échec de synchronisation pour toutes les tables");
              setShowError(true);
            }
          })
          .catch(error => {
            console.error("GlobalSyncManager - Erreur lors de la synchronisation initiale:", error);
            setSyncingInProgress(false);
            setShowError(true);
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
      
      syncTimer.current = intervalId;
      
      return () => {
        clearTimeout(timeoutId);
        if (syncTimer.current) clearInterval(syncTimer.current);
      };
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
      setShowError(true);
    }
  }, [syncAll, isOnline]);
  
  // S'assurer que l'indicateur de synchronisation disparaît après 30 secondes maximum
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
  
  // Seules les erreurs critiques seront affichées
  if (!showError && !hasSyncFailed) {
    return null;
  }
  
  // N'afficher que pour les erreurs critiques qui nécessitent une action utilisateur
  if (hasSyncFailed && isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md hidden">
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
          showOnlyErrors={true}
        />
      </div>
    );
  }
  
  return null;
};

export default GlobalSyncManager;
