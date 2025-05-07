
import { useCallback, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useGlobalSync } from '@/hooks/useGlobalSync';

export const useSynchronization = () => {
  const { toast } = useToast();
  const { syncWithServer, isSyncing, isOnline, lastSynced, hasUnsyncedData } = useGlobalSync();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncAttemptRef = useRef<number>(0);
  
  // Fonction pour gérer la synchronisation manuelle
  const handleSync = useCallback(async () => {
    if (isSyncing) return false;
    
    lastSyncAttemptRef.current = Date.now();
    const success = await syncWithServer();
    
    if (success) {
      toast({
        title: "Synchronisation réussie",
        description: "Toutes les données ont été synchronisées avec le serveur",
      });
    } else if (isOnline) {
      toast({
        title: "Échec de la synchronisation",
        description: "La synchronisation avec le serveur a échoué. Veuillez réessayer ultérieurement.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Synchronisation impossible",
        description: "Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet.",
        variant: "destructive",
      });
    }
    
    return success;
  }, [syncWithServer, isSyncing, isOnline, toast]);

  // Synchronisation automatique toutes les 15 secondes si des données non synchronisées existent
  useEffect(() => {
    const setupAutoSync = () => {
      // Nettoyer tout intervalle existant
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // Définir un nouvel intervalle uniquement si en ligne et avec des données non synchronisées
      if (isOnline && hasUnsyncedData) {
        syncTimeoutRef.current = setTimeout(async () => {
          // Ne synchroniser que si la dernière tentative remonte à plus de 5 secondes
          // Cela évite les synchronisations trop fréquentes
          const now = Date.now();
          if (now - lastSyncAttemptRef.current > 5000) {
            console.log("Synchronisation automatique déclenchée");
            await syncWithServer();
            setupAutoSync(); // Replanifier après synchronisation
          }
        }, 15000); // 15 secondes
      }
    };
    
    setupAutoSync();
    
    // Nettoyage lors du démontage
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, hasUnsyncedData, syncWithServer]);
  
  // Déclencher une synchronisation automatique lors des changements de connectivité
  useEffect(() => {
    if (isOnline && hasUnsyncedData) {
      const now = Date.now();
      // Synchroniser automatiquement lorsque l'état de connexion change vers "en ligne"
      if (now - lastSyncAttemptRef.current > 5000) {
        console.log("Synchronisation automatique suite à reconnexion");
        syncWithServer();
        lastSyncAttemptRef.current = now;
      }
    }
  }, [isOnline, hasUnsyncedData, syncWithServer]);

  return {
    handleSync,
    isSyncing,
    isOnline,
    lastSynced,
    hasUnsyncedData
  };
};
