
import React from 'react';
import { Cloud, Check, CloudSun, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SyncStatusProps = {
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced?: Date | null;
  syncFailed?: boolean;
};

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({ 
  isSyncing, 
  isOnline,
  lastSynced,
  syncFailed = false
}) => {
  const getStatusText = () => {
    if (isSyncing) return "Synchronisation en cours...";
    if (syncFailed) return "Échec de la dernière synchronisation";
    if (!isOnline) return "Hors ligne - Les modifications sont enregistrées localement";
    if (lastSynced) return `Dernière synchronisation: ${lastSynced.toLocaleTimeString()}`;
    return "Synchronisé avec le serveur";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            {isSyncing ? (
              <CloudSun className="h-4 w-4 animate-spin text-blue-500" />
            ) : syncFailed ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : isOnline ? (
              <div className="relative">
                <Cloud className="h-4 w-4 text-green-500" />
                <Check className="h-3 w-3 text-green-500 absolute -bottom-1 -right-1" />
              </div>
            ) : (
              <Cloud className="h-4 w-4 text-amber-500" />
            )}
            <span className="hidden md:inline">{getStatusText()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
          {syncFailed && <p className="text-xs text-red-500">Cliquez sur "Réinitialiser" pour réessayer</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
