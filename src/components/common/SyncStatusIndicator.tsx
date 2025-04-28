
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SyncStatusProps = {
  syncFailed?: boolean;
};

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({ 
  syncFailed = false
}) => {
  if (!syncFailed) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">Erreur de synchronisation</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Échec de la dernière synchronisation</p>
          <p className="text-xs text-red-500">Cliquez sur "Réinitialiser" pour réessayer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
