
import React from 'react';
import { CloudCheck, CloudOff, CloudSync } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SyncStatusProps = {
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced?: Date;
};

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({ 
  isSyncing, 
  isOnline,
  lastSynced
}) => {
  const getStatusText = () => {
    if (isSyncing) return "Synchronisation en cours...";
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
              <CloudSync className="h-4 w-4 animate-spin text-blue-500" />
            ) : isOnline ? (
              <CloudCheck className="h-4 w-4 text-green-500" />
            ) : (
              <CloudOff className="h-4 w-4 text-amber-500" />
            )}
            <span className="hidden md:inline">{getStatusText()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
