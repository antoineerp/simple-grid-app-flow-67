
import React, { useEffect } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { toast } from '@/components/ui/use-toast';

const GlobalSyncManager: React.FC = () => {
  const globalSyncContext = useGlobalSync();
  
  // Utiliser un effet pour démarrer la synchronisation en arrière-plan
  useEffect(() => {
    try {
      console.log("GlobalSyncManager - Initialisation de la synchronisation");
      console.log("GlobalSyncManager - État du contexte:", globalSyncContext);
      
      if (globalSyncContext && typeof globalSyncContext.startSync === 'function') {
        console.log("GlobalSyncManager - Démarrage de la synchronisation en arrière-plan");
        globalSyncContext.startSync();
        
        toast({
          title: "Synchronisation",
          description: "La synchronisation en arrière-plan a été démarrée",
        });
      } else {
        console.error("GlobalSyncManager - La méthode startSync n'est pas disponible dans le contexte");
        
        // Vérification détaillée du contexte
        if (!globalSyncContext) {
          console.error("GlobalSyncManager - Le contexte GlobalSync est undefined");
        } else {
          console.error("GlobalSyncManager - Méthodes disponibles dans le contexte:", Object.keys(globalSyncContext));
        }
      }
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
    }
  }, [globalSyncContext]);
  
  // Ce composant n'a pas de rendu visible
  return null;
};

export default GlobalSyncManager;
