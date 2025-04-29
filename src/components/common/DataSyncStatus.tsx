
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, RotateCw, Check, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

// Correction : définir correctement le type SyncStatus
type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface DataSyncStatusProps {
  status: SyncStatus;
  lastSynced: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
  isOnline: boolean;
  onSync?: () => void;
}

const DataSyncStatus: React.FC<DataSyncStatusProps> = ({
  status,
  lastSynced,
  lastError,
  pendingChanges,
  isOnline,
  onSync
}) => {
  // Ne rien afficher si tout est normal et qu'on n'est pas en synchronisation
  if (status === 'idle' && !pendingChanges && !lastSynced) return null;
  
  // Mode hors ligne
  if (!isOnline) {
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
  
  const formattedDate = lastSynced 
    ? format(lastSynced, "dd MMMM yyyy à HH:mm:ss", { locale: fr }) 
    : 'Jamais';
  
  let statusComponent;
  
  if (status === 'error') {
    // Échec de synchronisation
    statusComponent = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-xs bg-red-50 p-2 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-500">Échec de synchronisation</span>
              {onSync && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onSync} 
                  className="h-6 text-xs p-1 ml-2 flex items-center"
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  Réessayer
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Erreur: {lastError || "Échec de la synchronisation"}</p>
            <p className="text-xs text-red-500">Cliquez sur "Réessayer" pour tenter à nouveau</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else if (status === 'syncing') {
    // Synchronisation en cours
    statusComponent = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded-md">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
              <span className="text-blue-500">Synchronisation en cours...</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Synchronisation des données en cours</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else if (pendingChanges) {
    // Modifications en attente
    statusComponent = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-xs bg-amber-50 p-2 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-amber-500">Modifications non synchronisées</span>
              {onSync && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onSync} 
                  className="h-6 text-xs p-1 ml-2 flex items-center"
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  Synchroniser
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Des modifications sont en attente de synchronisation</p>
            <p className="text-xs text-amber-500">Cliquez sur "Synchroniser" pour les envoyer</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else if (lastSynced) {
    // Dernière synchronisation
    statusComponent = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-xs bg-green-50 p-2 rounded-md">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-500">Synchronisé: {formattedDate}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dernière synchronisation: {formattedDate}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return statusComponent || null;
};

export default DataSyncStatus;
