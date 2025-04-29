
import React, { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

const GlobalSyncManager: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  const { syncAll, syncStates, isOnline } = useGlobalSync();
  
  // Référence pour suivre les synchronisations déjà traitées
  const processedSyncs = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    console.log("GlobalSyncManager: Initialisation du gestionnaire de synchronisation globale");
    
    // Vérifier périodiquement si une synchronisation est nécessaire
    const intervalId = setInterval(() => {
      if (isOnline) {
        // Vérifier s'il y a des tables avec des erreurs de synchronisation
        const failedTables = Object.entries(syncStates)
          .filter(([_, state]) => state.syncFailed)
          .map(([tableName]) => tableName);
        
        if (failedTables.length > 0 && Math.random() < 0.1) {
          toast({
            title: "Synchronisation en attente",
            description: `${failedTables.length} table(s) n'ont pas pu être synchronisée(s).`,
            variant: "destructive"
          });
        }
        
        // Essayer de synchroniser périodiquement
        if (Math.random() < 0.05) { // 5% de chance pour ne pas synchroniser trop souvent
          syncAll().catch(error => {
            console.error("Erreur lors de la synchronisation automatique:", error);
          });
        }
      }
    }, 60000); // Vérification toutes les minutes
    
    return () => {
      clearInterval(intervalId);
    };
  }, [toast, isOnline, syncStates, syncAll]);
  
  // Synchroniser les données en attente quand on change de page
  useEffect(() => {
    // Si c'est le premier chargement, juste enregistrer le chemin
    if (previousPath.current === null) {
      previousPath.current = location.pathname;
      return;
    }
    
    // Si le chemin a changé, tenter de synchroniser les données en attente
    if (previousPath.current !== location.pathname) {
      console.log(`GlobalSyncManager: Changement de page détecté (${previousPath.current} -> ${location.pathname})`);
      previousPath.current = location.pathname;
      
      if (isOnline) {
        syncAll().catch(error => {
          console.error("Erreur lors de la synchronisation au changement de page:", error);
        });
      }
    }
  }, [location.pathname, isOnline, syncAll]);
  
  return null; // Ce composant n'affiche rien, il gère uniquement la logique en arrière-plan
};

export default GlobalSyncManager;
