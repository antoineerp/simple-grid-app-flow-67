
import React from 'react';
import { useSyncContext } from '@/context/SyncContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDownUp, Check, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SyncStatus: React.FC = () => {
  const { syncStatus } = useSyncContext();
  
  if (syncStatus.isSyncing) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 animate-pulse">
            <ArrowDownUp className="w-3 h-3 mr-1" /> Synchronisation...
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Synchronisation en cours...</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (syncStatus.syncFailed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="w-3 h-3 mr-1" /> Échec de synchronisation
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>La dernière synchronisation a échoué</p>
          {syncStatus.error && <p>{syncStatus.error}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <Check className="w-3 h-3 mr-1" /> 
          {syncStatus.lastSynced 
            ? `Synchronisé ${formatDistanceToNow(new Date(syncStatus.lastSynced), { addSuffix: true, locale: fr })}`
            : "Jamais synchronisé"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {syncStatus.lastSynced 
          ? `Dernière synchronisation: ${new Date(syncStatus.lastSynced).toLocaleString()}`
          : "L'application n'a jamais été synchronisée"}
      </TooltipContent>
    </Tooltip>
  );
};

export default SyncStatus;
