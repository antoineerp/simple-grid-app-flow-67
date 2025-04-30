
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
  
  // Initialiser le mode de synchronisation au démarrage (priorité serveur)
  useEffect(() => {
    console.log("GlobalSyncManager: Initialisation du gestionnaire de synchronisation globale");
    console.log("Mode de synchronisation: PRIORITÉ SERVEUR - Base de données Infomaniak");
    
    const interval = setInterval(() => {
      // Vérifier et synchroniser périodiquement les modifications en attente
      if (isOnline && triggerSync.hasPendingChanges()) {
        console.log("GlobalSyncManager: Vérification périodique des synchronisations en attente");
        syncAll().catch(error => {
          console.error("Erreur lors de la synchronisation périodique:", error);
        });
      }
    }, 60000); // Vérifier toutes les minutes
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Vérifier les données en attente de synchronisation
  const checkPendingSyncs = () => {
    const hasPending = triggerSync.hasPendingChanges();
    setIsSyncPending(hasPending);
    return hasPending;
  };
  
  // Synchroniser les changements en attente
  const syncPendingChanges = () => {
    if (!isOnline) {
      console.log("GlobalSyncManager: Mode hors ligne, synchronisation impossible");
      return;
    }
    
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
        // Synchroniser toutes les modifications en attente avec la base de données Infomaniak
        syncAll().catch(error => {
          console.error("Erreur lors de la synchronisation des modifications en attente:", error);
        });
        syncTimeoutRef.current = null;
      }, 5000); // 5 secondes de délai
    }
  };
  
  // Écouter les événements de changement de données
  useEffect(() => {
    // Callback pour les événements dataUpdate
    const handleDataUpdate = (e: CustomEvent) => {
      console.log("GlobalSyncManager: Événement de mise à jour des données reçu", e.detail);
      checkPendingSyncs();
      
      // Tenter une synchronisation immédiate
      if (isOnline) {
        syncPendingChanges();
      }
    };
    
    // Callback pour les changements de localStorage (communication entre onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('sync_pending_') || e.key.startsWith('pending_sync_'))) {
        console.log("GlobalSyncManager: Changement de stockage détecté", e.key);
        checkPendingSyncs();
        
        // Tenter une synchronisation immédiate
        if (isOnline) {
          syncPendingChanges();
        }
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
        
        // Afficher une notification pour informer l'utilisateur
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: `La synchronisation de ${e.detail.tableName} avec Infomaniak a échoué. Les données sont sauvegardées localement.`
        });
      }
    };
    
    // Callback pour les changements d'état de connexion
    const handleOnline = () => {
      console.log("GlobalSyncManager: Connexion Internet détectée");
      
      // Tenter de synchroniser les données en attente
      setTimeout(() => {
        syncAll().catch(error => {
          console.error("Erreur lors de la synchronisation après retour en ligne:", error);
        });
      }, 2000); // Attendre 2 secondes pour que la connexion se stabilise
      
      toast({
        title: "Connexion rétablie",
        description: "Synchronisation avec la base de données Infomaniak activée"
      });
    };
    
    const handleOffline = () => {
      console.log("GlobalSyncManager: Connexion Internet perdue");
      
      toast({
        variant: "destructive",
        title: "Connexion perdue",
        description: "Mode hors ligne activé. Les modifications seront synchronisées automatiquement lors du retour de la connexion."
      });
    };
    
    // Vérification initiale
    checkPendingSyncs();
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('dataUpdate', handleDataUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('syncComplete', handleSyncComplete as EventListener);
    window.addEventListener('syncError', handleSyncError as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Tentative de synchronisation initiale pour les données en attente
    if (isOnline) {
      // Retarder légèrement pour laisser le temps à l'application de se charger
      setTimeout(() => {
        syncAll().catch(error => {
          console.error("Erreur lors de la synchronisation initiale:", error);
        });
      }, 3000);
    }
    
    // Retirer les écouteurs lors du démontage du composant
    return () => {
      window.removeEventListener('dataUpdate', handleDataUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('syncComplete', handleSyncComplete as EventListener);
      window.removeEventListener('syncError', handleSyncError as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Nettoyer le timeout s'il existe
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, toast, syncAll]);
  
  // Effectuer une synchronisation lorsque isSyncPending change
  useEffect(() => {
    if (isSyncPending && isOnline) {
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
  
  return null; // Ce composant n'affiche rien, il gère uniquement la logique en arrière-plan
};

export default GlobalSyncManager;
