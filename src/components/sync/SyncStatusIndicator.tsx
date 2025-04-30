
import React from 'react';
import { RefreshCw, CloudOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  lastSynced: Date | null;
  isOnline: boolean;
  syncFailed: boolean;
  onSyncClick?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isSyncing = false,
  lastSynced = null,
  isOnline = true,
  syncFailed = false,
  onSyncClick
}) => {
  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Jamais';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Il y a quelques secondes';
    if (minutes === 1) return 'Il y a 1 minute';
    if (minutes < 60) return `Il y a ${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Il y a 1 heure';
    if (hours < 24) return `Il y a ${hours} heures`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Il y a 1 jour';
    return `Il y a ${days} jours`;
  };
  
  let icon, color, statusText;
  
  if (isSyncing) {
    icon = <RefreshCw className="h-4 w-4 animate-spin" />;
    color = "text-blue-500";
    statusText = "Synchronisation en cours...";
  } else if (!isOnline) {
    icon = <CloudOff className="h-4 w-4" />;
    color = "text-gray-500";
    statusText = "Mode hors-ligne";
  } else if (syncFailed) {
    icon = <AlertCircle className="h-4 w-4" />;
    color = "text-red-500";
    statusText = "Échec de la synchronisation";
  } else if (lastSynced) {
    icon = <CheckCircle className="h-4 w-4" />;
    color = "text-green-500";
    statusText = `Synchronisé ${formatTimestamp(lastSynced)}`;
  } else {
    icon = <CloudOff className="h-4 w-4" />;
    color = "text-gray-500";
    statusText = "Non synchronisé";
  }
  
  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`flex items-center ${color}`}>
              {icon}
              <span className="ml-2 text-xs hidden md:inline">{statusText}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>État: {statusText}</p>
              {lastSynced && <p>Dernière synchronisation: {lastSynced.toLocaleString()}</p>}
              {!isOnline && <p>Mode hors-ligne activé</p>}
              {syncFailed && <p>Cliquez sur le bouton de synchronisation pour réessayer</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {onSyncClick && isOnline && (
        <Button 
          size="sm" 
          variant="ghost" 
          disabled={isSyncing} 
          onClick={onSyncClick}
          className={`p-1 h-auto ${isSyncing ? 'opacity-50' : ''}`}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
