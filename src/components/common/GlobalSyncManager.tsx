
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/useSync';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface GlobalSyncManagerProps {
  autoSync?: boolean;
  showControls?: boolean;
  showStatus?: boolean;
  data?: Record<string, any[]>;
}

/**
 * Composant global pour gérer la synchronisation de toutes les données de l'application
 */
const GlobalSyncManager: React.FC<GlobalSyncManagerProps> = ({
  autoSync = true,
  showControls = true,
  showStatus = true,
  data = {}
}) => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  // Utiliser le hook de synchronisation global (maintenant useSync au lieu de useGlobalSync)
  const syncHook = useSync("global-sync");
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<Date | null>(null);

  // Effet pour suivre l'état de la synchronisation
  useEffect(() => {
    setIsGlobalSyncing(syncHook.isSyncing);
  }, [syncHook.isSyncing]);

  // Effet pour mettre à jour la dernière date de synchronisation
  useEffect(() => {
    if (syncHook.lastSynced) {
      setLastGlobalSync(syncHook.lastSynced);
    }
  }, [syncHook.lastSynced]);

  // Fonction pour effectuer une synchronisation manuelle
  const handleManualSync = async () => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation est impossible en mode hors ligne",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Synchronisation",
      description: "Synchronisation des données en cours...",
    });
    
    try {
      // Synchroniser les différents types de données
      if (data.documents && data.documents.length > 0) {
        await syncHook.syncWithServer(data.documents, {
          endpoint: 'documents-sync.php',
          userId: 'system'
        });
      }
      
      if (data.exigences && data.exigences.length > 0) {
        await syncHook.syncWithServer(data.exigences, {
          endpoint: 'exigences-sync.php',
          userId: 'system'
        });
      }
      
      if (data.membres && data.membres.length > 0) {
        await syncHook.syncWithServer(data.membres, {
          endpoint: 'membres-sync.php',
          userId: 'system'
        });
      }

      setLastGlobalSync(new Date());
      
      toast({
        title: "Synchronisation réussie",
        description: "Toutes les données ont été synchronisées avec le serveur"
      });
    } catch (error) {
      console.error("Erreur lors de la synchronisation manuelle:", error);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur lors de la synchronisation",
        variant: "destructive"
      });
    }
  };

  // Si on ne montre ni les contrôles ni le statut, le composant est invisible
  if (!showControls && !showStatus) return null;

  return (
    <div className="flex flex-col gap-2">
      {showStatus && (
        <SyncStatusIndicator 
          syncFailed={syncHook.syncFailed} 
          isSyncing={isGlobalSyncing}
          isOnline={isOnline}
          lastSynced={lastGlobalSync}
          webSocketStatus={wsStatus}
          onReset={syncHook.resetSyncStatus}
        />
      )}
      
      {showControls && (
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isGlobalSyncing || !isOnline}
            className="gap-1"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isGlobalSyncing ? 'animate-spin' : ''}`} />
            Synchroniser maintenant
          </Button>
        </div>
      )}
    </div>
  );
};

export default GlobalSyncManager;
