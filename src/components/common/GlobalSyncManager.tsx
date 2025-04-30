
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { triggerSync } from '@/services/sync/triggerSync';

const GlobalSyncManager: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  const { syncAll, syncStates, isOnline } = useGlobalSync();
  const [isSyncPending, setIsSyncPending] = useState<boolean>(false);
  
  // Référence pour suivre les synchronisations déjà traitées
  const processedSyncs = useRef<Set<string>>(new Set());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncAttemptRef = useRef<number>(0);
  
  // Vérifier les données en attente de synchronisation
  const checkPendingSyncs = () => {
    const hasPending = triggerSync.hasPendingChanges();
    setIsSyncPending(hasPending);
    return hasPending;
  };
  
  // Synchroniser les changements en attente
  const syncPendingChanges = () => {
    if (!isOnline) return;
    
    // Éviter les synchronisations trop fréquentes (minimum 5 secondes entre les tentatives)
    const now = Date.now();
    if (now - lastSyncAttemptRef.current < 5000) {
      console.log("GlobalSyncManager: Tentative de synchronisation trop fréquente, ignorée");
      return;
    }
    
    lastSyncAttemptRef.current = now;
    
    // Vérifier s'il y a des syncs en attente
    if (checkPendingSyncs()) {
      console.log(`GlobalSyncManager: Des changements en attente détectés, synchronisation...`);
      
      // Annuler tout timer existant
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // Créer un nouveau timer pour ne pas synchroniser trop souvent
      syncTimeoutRef.current = setTimeout(() => {
        // Synchroniser toutes les modifications en attente
        syncAll().catch(error => {
          console.error("Erreur lors de la synchronisation des modifications en attente:", error);
        });
        syncTimeoutRef.current = null;
      }, 5000); // Réduire à 5 secondes pour une réactivité améliorée
    }
  };
  
  // Écouter les événements de changement de données
  useEffect(() => {
    console.log("GlobalSyncManager: Initialisation du gestionnaire de synchronisation globale");
    
    // Callback pour les événements dataUpdate
    const handleDataUpdate = (e: CustomEvent) => {
      console.log("GlobalSyncManager: Événement de mise à jour des données reçu", e.detail);
      checkPendingSyncs();
    };
    
    // Callback pour les changements de localStorage (communication entre onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('sync_pending_') || e.key.startsWith('pending_sync_'))) {
        console.log("GlobalSyncManager: Changement de stockage détecté", e.key);
        checkPendingSyncs();
      }
    };
    
    // Callback pour les événements de synchronisation terminée
    const handleSyncComplete = (e: CustomEvent) => {
      if (e.detail?.tableName) {
        console.log(`GlobalSyncManager: Synchronisation terminée pour ${e.detail.tableName}`);
      }
    };
    
    // Callback pour les événements d'erreur de synchronisation
    const handleSyncError = (e: CustomEvent) => {
      if (e.detail?.tableName) {
        console.error(`GlobalSyncManager: Erreur de synchronisation pour ${e.detail.tableName}`, e.detail.error);
      }
    };
    
    // Vérification initiale
    checkPendingSyncs();
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('dataUpdate', handleDataUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('syncComplete', handleSyncComplete as EventListener);
    window.addEventListener('syncError', handleSyncError as EventListener);
    
    // Tentative de synchronisation initiale pour les données en attente
    if (isOnline) {
      // Retarder légèrement pour laisser le temps à l'application de se charger
      setTimeout(() => {
        syncPendingChanges();
      }, 3000);
    }
    
    // Retirer les écouteurs lors du démontage du composant
    return () => {
      window.removeEventListener('dataUpdate', handleDataUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('syncComplete', handleSyncComplete as EventListener);
      window.removeEventListener('syncError', handleSyncError as EventListener);
      
      // Nettoyer le timeout s'il existe
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
  
  // Effectuer une synchronisation lorsque isSyncPending change
  useEffect(() => {
    if (isSyncPending && isOnline) {
      // Ne pas déclencher la synchronisation trop souvent
      syncPendingChanges();
    }
  }, [isSyncPending, isOnline]);
  
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

  // Vérifier et tenter une synchronisation toutes les minutes si en ligne
  useEffect(() => {
    if (!isOnline) return;
    
    const intervalId = setInterval(() => {
      const hasPending = checkPendingSyncs();
      if (hasPending) {
        console.log("GlobalSyncManager: Tentative de synchronisation périodique");
        syncPendingChanges();
      }
    }, 60000); // Vérifier toutes les 60 secondes
    
    return () => clearInterval(intervalId);
  }, [isOnline]);
  
  return null; // Ce composant n'affiche rien, il gère uniquement la logique en arrière-plan
};

export default GlobalSyncManager;
