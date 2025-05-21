
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

interface DataSyncManagerProps<T> {
  data: T[];
  loadFromServer: (forceRefresh?: boolean) => Promise<T[]>;
  syncWithServer: (data: T[]) => Promise<boolean>;
  setData: (data: T[]) => void;
  lastSynced: Date | null;
  setLastSynced: (date: Date | null) => void;
  children?: React.ReactNode;
}

/**
 * Composant réutilisable pour gérer la synchronisation des données
 * À utiliser dans les pages qui ont besoin de synchroniser des données avec le serveur
 */
export function DataSyncManager<T>({
  data,
  loadFromServer,
  syncWithServer,
  setData,
  lastSynced,
  setLastSynced,
  children
}: DataSyncManagerProps<T>) {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const currentUser = getCurrentUser();

  // Charger les données au démarrage
  useEffect(() => {
    const initialLoad = async () => {
      setIsSyncing(true);
      try {
        console.log(`DataSyncManager: Chargement initial des données pour l'utilisateur ${currentUser}`);
        
        // Essayer de charger depuis le serveur
        const loadedData = await loadFromServer(true);
        setData(loadedData);
        setLastSynced(new Date());
        setSyncFailed(false);
        
        console.log(`DataSyncManager: Chargement initial réussi (${loadedData.length} éléments) pour l'utilisateur ${currentUser}`);
      } catch (error) {
        console.error(`DataSyncManager: Erreur lors du chargement initial pour l'utilisateur ${currentUser}:`, error);
        setSyncFailed(true);
      } finally {
        setIsSyncing(false);
      }
    };

    initialLoad();
  }, [currentUser]); // Ajout de currentUser comme dépendance pour recharger si l'utilisateur change

  // Fonction pour forcer une synchronisation manuelle
  const handleSync = async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Mode hors ligne",
        description: "Impossible de synchroniser en mode hors ligne"
      });
      return;
    }

    setIsSyncing(true);
    try {
      console.log(`DataSyncManager: Synchronisation manuelle pour l'utilisateur ${currentUser}`);
      
      // D'abord synchroniser les données actuelles avec le serveur
      const syncSuccess = await syncWithServer(data);
      
      if (syncSuccess) {
        // Puis recharger depuis le serveur pour obtenir les dernières modifications
        const freshData = await loadFromServer(true);
        setData(freshData);
        setLastSynced(new Date());
        setSyncFailed(false);
        
        toast({
          title: "Synchronisation réussie",
          description: `${freshData.length} éléments synchronisés pour ${currentUser}`
        });
        
        console.log(`DataSyncManager: Synchronisation manuelle réussie (${freshData.length} éléments) pour l'utilisateur ${currentUser}`);
      } else {
        setSyncFailed(true);
        console.error(`DataSyncManager: Échec de la synchronisation avec le serveur pour l'utilisateur ${currentUser}`);
      }
    } catch (error) {
      console.error(`DataSyncManager: Erreur lors de la synchronisation manuelle pour l'utilisateur ${currentUser}:`, error);
      setSyncFailed(true);
      
      toast({
        variant: "destructive",
        title: "Échec de la synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-4 gap-2">
        <div className="text-sm text-muted-foreground">
          {lastSynced ? (
            <span>Dernière synchronisation: {lastSynced.toLocaleTimeString()} (Utilisateur: {currentUser.split('_')[1] || currentUser})</span>
          ) : (
            <span>Jamais synchronisé</span>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          {isSyncing ? "Synchronisation..." : "Synchroniser"}
        </Button>
      </div>
      
      {syncFailed && !isSyncing && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded mb-4 text-sm">
          La dernière synchronisation a échoué. Vos modifications sont enregistrées localement uniquement.
        </div>
      )}
      
      {!isOnline && (
        <div className="bg-gray-50 border border-gray-200 text-gray-800 p-2 rounded mb-4 text-sm">
          Mode hors ligne actif. Les modifications seront enregistrées localement.
        </div>
      )}
      
      {children}
    </div>
  );
}
