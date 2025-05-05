
import React from 'react';
import { AlertTriangle, RotateCw, Check, CloudOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type SyncStatusProps = {
  syncFailed?: boolean;
  onReset?: () => void;
  isSyncing?: boolean;
  isOnline?: boolean;
  lastSynced?: Date | null;
};

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({ 
  syncFailed = false,
  onReset,
  isSyncing = false,
  isOnline = true,
  lastSynced = null
}) => {
  // Ne rien afficher si on est hors ligne et que la synchronisation n'a pas échoué
  if (!isOnline && !syncFailed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-md">
              <CloudOff className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">Mode hors ligne</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Vous êtes actuellement en mode hors ligne</p>
            <p className="text-xs text-gray-500">La synchronisation sera disponible lorsque vous serez en ligne</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Ne rien afficher si tout est normal et qu'on n'est pas en synchronisation
  if (!syncFailed && !isSyncing && !lastSynced) return null;

  const formattedDate = lastSynced 
    ? format(lastSynced, "dd MMMM yyyy à HH:mm:ss", { locale: fr }) 
    : 'Jamais';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 text-xs ${
            syncFailed ? 'bg-red-50' : 
            isSyncing ? 'bg-blue-50' : 
            'bg-green-50'
          } p-2 rounded-md`}>
            {syncFailed ? (
              <>
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-500">Échec de la dernière synchronisation</span>
              </>
            ) : isSyncing ? (
              <>
                <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-blue-500">Synchronisation en cours...</span>
              </>
            ) : lastSynced ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Dernière synchronisation: {formattedDate}</span>
              </>
            ) : null}
            
            {onReset && syncFailed && (
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
          {syncFailed ? (
            <>
              <p>Échec de la dernière synchronisation</p>
              <p className="text-xs text-red-500">Cliquez sur "Réinitialiser" pour réessayer</p>
            </>
          ) : isSyncing ? (
            <p>Synchronisation en cours</p>
          ) : lastSynced ? (
            <p>Dernière synchronisation réussie le {formattedDate}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
