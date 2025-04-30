
import React, { useEffect } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

const GlobalSyncManager: React.FC = () => {
  const { startBackgroundSync, isInitialized } = useGlobalSync();
  
  // Utiliser un effet pour démarrer la synchronisation en arrière-plan
  useEffect(() => {
    try {
      console.log("GlobalSyncManager - Initialisation de la synchronisation");
      
      if (!isInitialized) {
        console.log("GlobalSyncManager - Démarrage de la synchronisation en arrière-plan");
        startBackgroundSync();
      }
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
    }
  }, [startBackgroundSync, isInitialized]);
  
  // Ce composant n'a pas de rendu visible
  return null;
};

export default GlobalSyncManager;
