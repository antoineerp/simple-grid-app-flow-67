
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, CloudOff, Check } from "lucide-react";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { forceSync, hasPendingChanges, setSyncEnabled, SYNC_EVENTS } from '@/services/sync/AutoSyncService';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AppSyncManagerProps {
  showControls?: boolean;
  className?: string;
  showStatus?: boolean;
}

/**
 * Composant de gestion de synchronisation centralisé pour l'application
 */
export function AppSyncManager({
  showControls = true,
  className = "",
  showStatus = true
}: AppSyncManagerProps) {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [syncEnabled, setSyncEnabledState] = useState(true);
  
  // Écouter les événements de synchronisation
  useEffect(() => {
    const handleSyncStart = () => {
      setIsSyncing(true);
    };
    
    const handleSyncCompleted = (event: CustomEvent) => {
      setIsSyncing(false);
      if (event.detail?.timestamp) {
        setLastSynced(new Date(event.detail.timestamp));
      }
    };
    
    const handleSyncSuccess = (event: CustomEvent) => {
      if (event.detail?.timestamp) {
        setLastSynced(new Date(event.detail.timestamp));
      }
    };
    
    const handleDataChanged = () => {
      setPendingChanges(hasPendingChanges());
    };
    
    // Ajouter les écouteurs
    window.addEventListener(SYNC_EVENTS.SYNC_START, handleSyncStart as EventListener);
    window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncCompleted as EventListener);
    window.addEventListener(SYNC_EVENTS.SYNC_SUCCESS, handleSyncSuccess as EventListener);
    window.addEventListener(SYNC_EVENTS.DATA_CHANGED, handleDataChanged as EventListener);
    
    // Vérifier initialement s'il y a des modifications en attente
    setPendingChanges(hasPendingChanges());
    
    // Nettoyage
    return () => {
      window.removeEventListener(SYNC_EVENTS.SYNC_START, handleSyncStart as EventListener);
      window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncCompleted as EventListener);
      window.removeEventListener(SYNC_EVENTS.SYNC_SUCCESS, handleSyncSuccess as EventListener);
      window.removeEventListener(SYNC_EVENTS.DATA_CHANGED, handleDataChanged as EventListener);
    };
  }, []);
  
  // Forcer une synchronisation manuelle
  const handleForceSync = async () => {
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
      const results = await forceSync();
      
      // Compter les succès et les échecs
      const successCount = Object.values(results).filter(Boolean).length;
      const failCount = Object.values(results).filter(result => !result).length;
      
      if (Object.keys(results).length === 0) {
        toast({
          title: "Aucune donnée à synchroniser",
          description: "Toutes vos données sont déjà à jour."
        });
      } else if (successCount > 0 && failCount === 0) {
        toast({
          title: "Synchronisation réussie",
          description: `${successCount} table${successCount > 1 ? 's' : ''} ${successCount > 1 ? 'ont' : 'a'} été synchronisée${successCount > 1 ? 's' : ''}`
        });
        setLastSynced(new Date());
      } else if (failCount > 0) {
        toast({
          variant: "destructive",
          title: "Synchronisation partiellement réussie",
          description: `${successCount} réussie${successCount > 1 ? 's' : ''}, ${failCount} échec${failCount > 1 ? 's' : ''}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Échec de synchronisation",
          description: "Aucune table n'a pu être synchronisée."
        });
      }
      
      // Mettre à jour l'état des modifications en attente
      setPendingChanges(hasPendingChanges());
    } catch (error) {
      console.error("AppSyncManager: Erreur lors de la synchronisation forcée:", error);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la synchronisation."
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Activer/désactiver la synchronisation
  const toggleSyncEnabled = () => {
    const newState = !syncEnabled;
    setSyncEnabledState(newState);
    setSyncEnabled(newState);
    
    toast({
      title: newState ? "Synchronisation activée" : "Synchronisation désactivée",
      description: newState 
        ? "La synchronisation automatique des données est maintenant active." 
        : "La synchronisation automatique est désactivée. Vos données sont sauvegardées localement uniquement."
    });
  };
  
  // N'afficher rien si on ne veut pas le statut ni les contrôles
  if (!showStatus && !showControls) {
    return null;
  }
  
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {showStatus && (
        <div className="flex items-center text-xs text-muted-foreground justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Badge variant={syncEnabled ? "default" : "outline"}>
                {syncEnabled ? "Synchronisation active" : "Synchronisation désactivée"}
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <CloudOff className="h-3 w-3" />
                Mode hors ligne
              </Badge>
            )}
            
            {pendingChanges && (
              <Badge variant="secondary">
                Modifications en attente
              </Badge>
            )}
          </div>
          
          <div>
            {lastSynced ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-500" />
                Synchronisé {formatDistanceToNow(lastSynced, { addSuffix: true, locale: fr })}
              </span>
            ) : (
              <span>Jamais synchronisé</span>
            )}
          </div>
        </div>
      )}
      
      {showControls && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSyncEnabled}
            disabled={isSyncing}
          >
            {syncEnabled ? "Désactiver" : "Activer"} synchronisation
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={isSyncing || !isOnline || !syncEnabled}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {isSyncing ? "Synchronisation..." : "Synchroniser maintenant"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default AppSyncManager;
