
import React from 'react';
import { Button } from "@/components/ui/button";
import { Cloud, CloudSun, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGlobalSync } from '@/hooks/useGlobalSync';

const GlobalSyncStatus: React.FC = () => {
  const { 
    syncWithServer, 
    isSyncing, 
    isOnline, 
    lastSynced 
  } = useGlobalSync();

  const getStatusText = () => {
    if (isSyncing) return "Synchronisation en cours...";
    if (!isOnline) return "Hors ligne - Les modifications sont enregistrées localement";
    if (lastSynced) return `Dernière synchronisation: ${lastSynced.toLocaleTimeString()}`;
    return "Cliquez pour synchroniser";
  };

  const handleSync = () => {
    if (!isSyncing) {
      syncWithServer();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {isSyncing ? (
                <CloudSun className="h-4 w-4 animate-spin text-blue-500" />
              ) : isOnline ? (
                <div className="relative">
                  <Cloud className="h-4 w-4 text-green-500" />
                  {lastSynced && <Check className="h-3 w-3 text-green-500 absolute -bottom-1 -right-1" />}
                </div>
              ) : (
                <Cloud className="h-4 w-4 text-amber-500" />
              )}
              <span className="hidden md:inline">{getStatusText()}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing || !isOnline}
        className="flex items-center text-xs"
      >
        <CloudSun className="h-4 w-4 mr-1" />
        Synchroniser
      </Button>
    </div>
  );
};

export default GlobalSyncStatus;
