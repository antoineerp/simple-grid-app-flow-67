
import React from 'react';
import { useSyncContext } from '../../context/SyncContext';

const GlobalSyncManager: React.FC = () => {
  // Utiliser le hook dans un try/catch pour éviter les erreurs fatales
  let syncContext;
  try {
    syncContext = useSyncContext();
  } catch (error) {
    console.error("GlobalSyncManager - Erreur lors de l'utilisation du contexte:", error);
    return null; // Retourner null en cas d'erreur pour éviter de planter l'application
  }
  
  React.useEffect(() => {
    console.log("GlobalSyncManager - Composant monté");
    
    if (syncContext) {
      console.log("État de synchronisation:", syncContext.syncStatus);
    } else {
      console.log("GlobalSyncManager - Contexte non disponible");
    }
    
    // Créer un élément dans le DOM pour indiquer l'initialisation
    const syncInitElement = document.createElement('div');
    syncInitElement.id = 'global-sync-manager-initialized';
    syncInitElement.style.display = 'none';
    document.body.appendChild(syncInitElement);
    
    return () => {
      console.log("GlobalSyncManager - Composant démonté");
      
      // Nettoyer le marqueur DOM lors du démontage
      const element = document.getElementById('global-sync-manager-initialized');
      if (element) {
        document.body.removeChild(element);
      }
    };
  }, [syncContext]);
  
  // Rendered component doesn't need to display anything
  return null;
};

export default GlobalSyncManager;
