
import React from 'react';
import { Cloud, Check, CloudSun, CloudOff, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SyncStatusProps = {
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced?: Date;
  hasError?: boolean;
};

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({ 
  isSyncing, 
  isOnline,
  lastSynced,
  hasError = false
}) => {
  const getStatusText = () => {
    if (isSyncing) return "Synchronisation en cours...";
    if (hasError) return "Erreur de synchronisation - Les données n'ont pas pu être chargées";
    if (!isOnline) return "Hors ligne - Les modifications sont enregistrées localement";
    if (lastSynced) return `Dernière synchronisation: ${lastSynced.toLocaleTimeString()}`;
    return "Connecté au serveur (aucune synchronisation effectuée)";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            {isSyncing ? (
              <CloudSun className="h-4 w-4 animate-spin text-blue-500" />
            ) : hasError ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : !isOnline ? (
              <CloudOff className="h-4 w-4 text-amber-500" />
            ) : (
              <div className="relative">
                <Cloud className="h-4 w-4 text-green-500" />
                <Check className="h-3 w-3 text-green-500 absolute -bottom-1 -right-1" />
              </div>
            )}
            <span className="hidden md:inline">{getStatusText()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
          {hasError && (
            <p className="text-xs text-red-500 mt-1">
              Vérifiez la configuration du serveur ou les logs pour plus de détails
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
