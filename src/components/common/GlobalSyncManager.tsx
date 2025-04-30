
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
      
      // Vérification que le contexte existe et contient les méthodes nécessaires
      if (globalSyncContext) {
        console.log("GlobalSyncManager - Méthodes disponibles dans le contexte:", Object.keys(globalSyncContext));
        
        // Si startSync existe, l'utiliser
        if (typeof globalSyncContext.startSync === 'function') {
          console.log("GlobalSyncManager - Démarrage de la synchronisation en arrière-plan");
          globalSyncContext.startSync();
          
          toast({
            title: "Synchronisation",
            description: "La synchronisation en arrière-plan a été démarrée",
          });
        } else {
          console.log("GlobalSyncManager - Synchronisation non disponible ou déjà démarrée");
          
          // Vérifier si d'autres méthodes de synchronisation sont disponibles
          if (typeof globalSyncContext.sync === 'function') {
            console.log("GlobalSyncManager - Utilisation de la méthode sync alternative");
            globalSyncContext.sync();
            
            toast({
              title: "Synchronisation",
              description: "La synchronisation alternative a été démarrée",
            });
          } else if (typeof globalSyncContext.initialize === 'function') {
            console.log("GlobalSyncManager - Utilisation de la méthode initialize");
            globalSyncContext.initialize();
            
            toast({
              title: "Synchronisation",
              description: "L'initialisation de la synchronisation a été démarrée",
            });
          } else {
            console.log("GlobalSyncManager - Aucune méthode de synchronisation disponible");
          }
        }
      } else {
        console.error("GlobalSyncManager - Le contexte GlobalSync est undefined");
      }
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
    }
  }, [globalSyncContext]);
  
  // Ce composant n'a pas de rendu visible
  return null;
};

export default GlobalSyncManager;
