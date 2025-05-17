
import React, { useEffect } from 'react';
import { globalSyncManager } from '@/services/sync/GlobalSyncManager';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Démarrer le service de synchronisation global au chargement de l'application
    globalSyncManager.start();
    
    return () => {
      // Arrêter le service à la fermeture de l'application
      globalSyncManager.stop();
    };
  }, []);
  
  return <>{children}</>;
};

export default AppProviders;
