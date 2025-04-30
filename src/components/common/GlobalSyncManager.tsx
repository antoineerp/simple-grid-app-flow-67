
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
        
        // Démarrer la synchronisation globale si elle existe
        if (typeof globalSyncContext.syncAll === 'function') {
          console.log("GlobalSyncManager - Démarrage de la synchronisation en arrière-plan avec syncAll");
          
          // Pour éviter les boucles d'exécution, on utilise setTimeout
          setTimeout(() => {
            globalSyncContext.syncAll().then(results => {
              console.log("GlobalSyncManager - Résultats de la synchronisation:", results);
            }).catch(error => {
              console.error("GlobalSyncManager - Erreur lors de la synchronisation:", error);
            });
          }, 2000);
          
          toast({
            title: "Synchronisation",
            description: "La synchronisation en arrière-plan a été démarrée",
          });
        } else {
          console.log("GlobalSyncManager - La méthode syncAll n'est pas disponible");
          
          // Notification en cas d'échec de synchronisation
          toast({
            title: "Synchronisation",
            description: "La synchronisation en arrière-plan n'a pas pu être démarrée",
            variant: "destructive"
          });
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
