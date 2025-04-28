
import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type SyncStatusProps = {
  syncFailed?: boolean;
  onReset?: () => void;
  isSyncing?: boolean;
  isOnline?: boolean;
  lastSynced?: Date;
};

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({ 
  syncFailed = false,
  onReset
}) => {
  if (!syncFailed) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-xs bg-red-50 p-2 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">Échec de la dernière synchronisation</span>
            {onReset && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onReset} 
                className="h-6 text-xs p-1 ml-2 flex items-center"
              >
                <RotateCw className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
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
