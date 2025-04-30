
import React from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ForceSyncButton } from './ForceSyncButton';

export const SyncStatus: React.FC = () => {
  const { syncStates, isOnline, syncAll } = useGlobalSync();
  
  // Déterminer s'il y a des synchronisations en cours
  const activeSyncs = Object.values(syncStates).filter(state => state.isSyncing);
  const isSyncing = activeSyncs.length > 0;
  
  // Déterminer la date de dernière synchronisation
  const getLatestSyncDate = (): Date | null => {
    let latestDate: Date | null = null;
    
    Object.values(syncStates).forEach(state => {
      if (state.lastSynced && (!latestDate || state.lastSynced > latestDate)) {
        latestDate = state.lastSynced;
      }
    });
    
    return latestDate;
  };
  
  const lastSynced = getLatestSyncDate();
  
  // Formater la date de dernière synchronisation
  const formatLastSynced = (date: Date | null): string => {
    if (!date) return "Jamais";
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Si moins d'une minute
    if (diff < 60000) {
      return "À l'instant";
    }
    
    // Si moins d'une heure
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Il y a ${minutes} min`;
    }
    
    // Si moins d'un jour
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `Il y a ${hours}h`;
    }
    
    // Si plus d'un jour
    const days = Math.floor(diff / 86400000);
    return `Il y a ${days}j`;
  };
  
  const getStatusColor = (): string => {
    if (!isOnline) return "text-red-500";
    
    // Vérifier si une synchronisation a échoué
    const hasSyncFailed = Object.values(syncStates).some(state => state.syncFailed);
    if (hasSyncFailed) return "text-amber-500";
    
    return "text-green-500";
  };
  
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-1 text-xs ${getStatusColor()}`}>
              {isOnline ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span>{isOnline ? "En ligne" : "Hors ligne"}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline 
              ? "Connecté à Internet - Synchronisation base de données Infomaniak activée" 
              : "Déconnecté - Mode hors ligne (données stockées localement)"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 px-2 py-1 text-xs">
              <Clock className="h-3 w-3" />
              <span>{formatLastSynced(lastSynced)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Dernière synchronisation avec Infomaniak: {lastSynced ? lastSynced.toLocaleString() : "Jamais"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <ForceSyncButton showLabel={true} />
    </div>
  );
};
