
import React, { useState, useEffect, useRef } from 'react';
import { dataSyncManager } from '@/services/sync/DataSyncManager';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLocation } from 'react-router-dom';

const GlobalSyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState({
    activeSyncCount: 0,
    pendingChangesCount: 0,
    failedSyncCount: 0
  });
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  
  // Référence pour suivre les synchronisations déjà traitées
  const processedSyncs = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    console.log("GlobalSyncManager: Initialisation du gestionnaire de synchronisation globale");
    
    // Vérifier périodiquement l'état global de synchronisation
    const intervalId = setInterval(() => {
      try {
        const status = dataSyncManager.getGlobalSyncStatus();
        setSyncStatus({
          activeSyncCount: status.activeSyncCount,
          pendingChangesCount: status.pendingChangesCount,
          failedSyncCount: status.failedSyncCount
        });
        
        // Si des synchronisations ont échoué, afficher un toast mais pas trop souvent
        if (status.failedSyncCount > 0 && Math.random() < 0.1) {
          toast({
            title: "Synchronisation en attente",
            description: `${status.failedSyncCount} table(s) n'ont pas pu être synchronisée(s).`,
            variant: "destructive"
          });
        }
        
        // Vérifier s'il y a des données en attente à synchroniser
        if (isOnline && status.pendingChangesCount > 0 && status.activeSyncCount === 0) {
          syncPendingChanges();
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut de synchronisation:", error);
      }
    }, 5000);
    
    // Écouter les événements de modification de données
    const handleDataUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.table) {
        const { table, data } = event.detail;
        console.log(`GlobalSyncManager: Événement de mise à jour détecté pour ${table}`);
        
        // Synchroniser immédiatement si en ligne
        if (isOnline) {
          dataSyncManager.syncTable(table, data).catch(err => {
            console.error(`Erreur lors de la synchronisation de ${table}:`, err);
          });
        }
      }
    };
    
    // Ajouter un écouteur d'événement personnalisé
    window.addEventListener('dataUpdate', handleDataUpdate as EventListener);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('dataUpdate', handleDataUpdate as EventListener);
    };
  }, [toast, isOnline]);
  
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
        syncPendingChanges();
      }
    }
  }, [location.pathname, isOnline]);
  
  const syncPendingChanges = async () => {
    try {
      console.log("GlobalSyncManager: Synchronisation des données en attente");
      const results = await dataSyncManager.syncAllPendingChanges();
      
      const failedTables = Object.entries(results)
        .filter(([_, result]) => !result.success)
        .map(([table]) => table);
      
      if (failedTables.length > 0) {
        console.warn("GlobalSyncManager: Certaines tables n'ont pas pu être synchronisées:", failedTables);
        
        toast({
          title: "Synchronisation partielle",
          description: `${failedTables.length} table(s) n'ont pas pu être synchronisée(s).`,
          variant: "destructive" 
        });
      } else if (Object.keys(results).length > 0) {
        console.log("GlobalSyncManager: Toutes les données en attente ont été synchronisées avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation des données en attente:", error);
    }
  };
  
  return null; // Ce composant n'affiche rien, il gère uniquement la logique en arrière-plan
};

export default GlobalSyncManager;
