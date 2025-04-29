
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSync } from '@/hooks/useSync';
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
  
  // Utiliser le hook de synchronisation global
  const globalSync = useGlobalSync();

  // Effectuer une synchronisation en réponse à un changement d'état du réseau
  useEffect(() => {
    if (isOnline && autoSync) {
      // Si nous venons de repasser en ligne, synchroniser toutes les données
      const syncOnReconnect = async () => {
        console.log("Reconnexion détectée, synchronisation des données");
        await globalSync.syncAllData(data);
      };
      
      syncOnReconnect();
    }
  }, [isOnline, autoSync, data, globalSync]);

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
      const result = await globalSync.syncAllData(data);
      
      if (result) {
        toast({
          title: "Synchronisation réussie",
          description: "Toutes les données ont été synchronisées avec le serveur"
        });
      }
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
          syncFailed={false} 
          isSyncing={globalSync.isGlobalSyncing}
          isOnline={isOnline}
          lastSynced={globalSync.lastGlobalSync}
          webSocketStatus={globalSync.webSocketStatus as 'connected' | 'disconnected' | 'connecting'}
        />
      )}
      
      {showControls && (
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={globalSync.isGlobalSyncing || !isOnline}
            className="gap-1"
          >
            <RotateCw className={`h-3.5 w-3.5 ${globalSync.isGlobalSyncing ? 'animate-spin' : ''}`} />
            Synchroniser maintenant
          </Button>
        </div>
      )}
    </div>
  );
};

export default GlobalSyncManager;
