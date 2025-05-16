
import React from 'react';

const GlobalSyncManager: React.FC = () => {
  // Simplified version that doesn't cause errors
  React.useEffect(() => {
    console.log("GlobalSyncManager - Composant monté");
    
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
  }, []);
  
  // Rendered component doesn't need to display anything
  return null;
};

export default GlobalSyncManager;
