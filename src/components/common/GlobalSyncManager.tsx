
import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { triggerSync } from '@/services/sync/triggerSync';

const GlobalSyncManager: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  const { syncAll, syncStates, isOnline } = useGlobalSync();
  
  // Référence pour suivre les synchronisations déjà traitées
  const processedSyncs = useRef<Set<string>>(new Set());
  
  // Check for pending changes in localStorage when page loads or path changes
  const syncPendingChanges = () => {
    if (!isOnline) return;
    
    // Find all pending sync tables from localStorage
    const pendingSyncKeys = Object.keys(localStorage).filter(key => key.startsWith('pending_sync_'));
    
    if (pendingSyncKeys.length > 0) {
      console.log(`GlobalSyncManager: Found ${pendingSyncKeys.length} pending sync tables`);
      
      // Only sync if we have pending changes
      syncAll().catch(error => {
        console.error("Erreur lors de la synchronisation des modifications en attente:", error);
      });
    }
  };
  
  useEffect(() => {
    console.log("GlobalSyncManager: Initialisation du gestionnaire de synchronisation globale");
    
    // Initial check for pending changes
    syncPendingChanges();
    
    // Listen for storage changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('pending_sync_')) {
        syncPendingChanges();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncAll, isOnline]);
  
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
      
      syncPendingChanges();
    }
  }, [location.pathname, isOnline, syncAll]);
  
  return null; // Ce composant n'affiche rien, il gère uniquement la logique en arrière-plan
};

export default GlobalSyncManager;
