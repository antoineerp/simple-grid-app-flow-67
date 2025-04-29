
import React from 'react';
import { AlertTriangle, RotateCw, Check, CloudOff, Wifi, Radio } from 'lucide-react';
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
  onManualSync?: () => void;
  webSocketStatus?: 'connected' | 'disconnected' | 'connecting';
};

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({ 
  syncFailed = false,
  onReset,
  isSyncing = false,
  isOnline = true,
  lastSynced = null,
  onManualSync,
  webSocketStatus = 'disconnected'
}) => {
  // Mode hors ligne
  if (!isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-md">
              <CloudOff className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">Mode hors ligne</span>
              
              {onReset && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onReset} 
                  className="h-6 text-xs p-1 ml-2 flex items-center"
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  Tester
                </Button>
              )}
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

  // WebSocket status
  const wsStatusElement = (
    <span 
      className={`flex items-center ${
        webSocketStatus === 'connected' ? 'text-green-500' : 
        webSocketStatus === 'connecting' ? 'text-amber-500' : 
        'text-gray-400'
      } ml-1 text-xs`}
    >
      <Radio className={`h-3 w-3 mr-1 ${
        webSocketStatus === 'connected' ? 'animate-pulse' : ''
      }`} />
      {webSocketStatus === 'connected' ? 'WS' : ''}
    </span>
  );

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
            
            {wsStatusElement}
            
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
            
            {onManualSync && !isSyncing && isOnline && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onManualSync} 
                className="h-6 text-xs p-1 ml-2 flex items-center"
              >
                <RotateCw className="h-3 w-3 mr-1" />
                Sync
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
          
          {webSocketStatus === 'connected' && (
            <p className="text-xs text-green-500 mt-1">Connexion WebSocket active</p>
          )}
          {webSocketStatus === 'connecting' && (
            <p className="text-xs text-amber-500 mt-1">Connexion WebSocket en cours...</p>
          )}
          {webSocketStatus === 'disconnected' && (
            <p className="text-xs text-gray-400 mt-1">WebSocket déconnecté - Mode API REST</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
