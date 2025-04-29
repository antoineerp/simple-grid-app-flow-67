
import React from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusIndicatorProps {
  syncFailed: boolean;
  onReset: () => void;
  isSyncing: boolean;
  lastSynced?: Date | null;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  syncFailed,
  onReset,
  isSyncing,
  lastSynced
}) => {
  if (isSyncing) {
    return (
      <div className="mb-4 flex items-center text-blue-600">
        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
        <span className="text-sm">Synchronisation en cours...</span>
      </div>
    );
  }
  
  if (syncFailed) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>La dernière synchronisation a échoué.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Réessayer
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (lastSynced) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mb-4 flex items-center text-green-600 cursor-help">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Synchronisé</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dernière synchronisation: {lastSynced.toLocaleString()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return null;
};

export default SyncStatusIndicator;
