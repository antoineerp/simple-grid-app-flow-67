
import React, { useState, useEffect } from 'react';
import { hasPendingChanges, forceSync, setSyncEnabled } from '@/services/sync/AutoSyncService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpDown, Check, CloudOff, CloudSync } from 'lucide-react';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import SyncDebugger from '@/components/sync/SyncDebugger';

interface AppSyncManagerProps {
  showControls?: boolean;
  className?: string;
  enableDebugger?: boolean;
}

/**
 * Composant de gestion de la synchronisation pour l'application
 */
const AppSyncManager: React.FC<AppSyncManagerProps> = ({ 
  showControls = true, 
  className = '',
  enableDebugger = true
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasPending, setHasPending] = useState<boolean>(false);
  const [syncEnabled, setSyncEnabledState] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string>(getCurrentUser());

  // Surveiller l'état de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Surveiller l'utilisateur courant
  useEffect(() => {
    const checkUserId = () => {
      const currentUserId = getCurrentUser();
      if (currentUserId !== userId) {
        console.log(`AppSyncManager: Changement d'utilisateur détecté ${userId} -> ${currentUserId}`);
        setUserId(currentUserId);
      }
    };

    checkUserId();

    const handleUserChange = (event: CustomEvent) => {
      if (event.detail?.userId) {
        setUserId(event.detail.userId);
      }
    };

    window.addEventListener('userChanged', handleUserChange as EventListener);
    window.addEventListener('database-user-changed', handleUserChange as EventListener);

    const intervalId = setInterval(checkUserId, 10000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('userChanged', handleUserChange as EventListener);
      window.removeEventListener('database-user-changed', handleUserChange as EventListener);
    };
  }, [userId]);

  // Surveiller l'état de la synchronisation
  useEffect(() => {
    const updateSyncStatus = () => {
      // Vérifier s'il y a des modifications en attente
      const pending = hasPendingChanges(undefined, userId);
      setHasPending(pending);
    };

    // Vérifier immédiatement
    updateSyncStatus();

    // Puis vérifier périodiquement
    const intervalId = setInterval(updateSyncStatus, 5000);

    // Écouter les événements de synchronisation
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
      updateSyncStatus();
    };

    window.addEventListener('sync-start', handleSyncStart);
    window.addEventListener('sync-completed', handleSyncEnd);
    window.addEventListener('sync-success', handleSyncEnd);
    window.addEventListener('data-changed', updateSyncStatus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('sync-start', handleSyncStart);
      window.removeEventListener('sync-completed', handleSyncEnd);
      window.removeEventListener('sync-success', handleSyncEnd);
      window.removeEventListener('data-changed', updateSyncStatus);
    };
  }, [userId]);

  // Gérer le changement d'état de la synchronisation
  const handleSyncToggle = (enabled: boolean) => {
    setSyncEnabledState(enabled);
    setSyncEnabled(enabled);
  };

  // Forcer une synchronisation
  const handleForceSyncNow = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    try {
      const results = await forceSync(userId);
      console.log('AppSyncManager: Résultats de synchronisation forcée:', results);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('AppSyncManager: Erreur lors de la synchronisation forcée:', error);
    } finally {
      setIsSyncing(false);
      
      // Vérifier à nouveau l'état des modifications en attente
      const stillHasPending = hasPendingChanges(undefined, userId);
      setHasPending(stillHasPending);
    }
  };

  if (enableDebugger) {
    return <SyncDebugger />;
  }

  // Si les contrôles sont désactivés, afficher seulement un badge d'état
  if (!showControls) {
    return (
      <div className={`flex items-center justify-end gap-2 ${className}`}>
        <Badge variant={hasPending ? "outline" : "default"} className="text-xs">
          {hasPending ? (
            <>
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Modifications en attente
            </>
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              Synchronisé
            </>
          )}
        </Badge>
        {lastSyncTime && (
          <span className="text-xs text-muted-foreground">
            Dernière synchronisation: {lastSyncTime.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <Badge variant={isOnline ? "default" : "destructive"}>
          {isOnline ? "En ligne" : "Hors ligne"}
        </Badge>
        <Badge variant={hasPending ? "outline" : "default"}>
          {hasPending ? "Modifications en attente" : "Synchronisé"}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {lastSyncTime && (
          <span className="text-xs text-muted-foreground">
            Dernière synchronisation: {lastSyncTime.toLocaleTimeString()}
          </span>
        )}
        
        <div className="flex items-center gap-2">
          <Switch 
            id="sync-toggle"
            checked={syncEnabled}
            onCheckedChange={handleSyncToggle}
          />
          <Label htmlFor="sync-toggle" className="cursor-pointer">
            Synchronisation auto
          </Label>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleForceSyncNow}
                disabled={!isOnline || isSyncing}
              >
                {isSyncing ? (
                  <CloudSync className="h-4 w-4 mr-2 animate-spin" />
                ) : isOnline ? (
                  <CloudSync className="h-4 w-4 mr-2" />
                ) : (
                  <CloudOff className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? "Synchronisation..." : "Synchroniser maintenant"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isOnline 
                ? "Forcer la synchronisation immédiate avec le serveur" 
                : "Impossible de synchroniser en mode hors ligne"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default AppSyncManager;
