
import React from 'react';
import { CloudOff, CheckCircle, Clock, Loader } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced: Date | null;
  hasUnsyncedData?: boolean;
  onSync?: () => void; // Kept for compatibility but not used for auto-sync
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isSyncing,
  isOnline,
  lastSynced,
  hasUnsyncedData = false
}) => {
  // Formater la date de dernière synchronisation
  const formatLastSynced = () => {
    if (!lastSynced) return 'Jamais';
    
    const now = new Date();
    const diff = now.getTime() - lastSynced.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
      return 'Il y a quelques secondes';
    } else if (minutes < 60) {
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (minutes < 1440) { // moins de 24h
      const hours = Math.floor(minutes / 60);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  };
  
  // Statut de synchronisation
  const getStatusDetails = () => {
    if (!isOnline) {
      return {
        icon: <CloudOff className="h-4 w-4 text-gray-500" />,
        label: 'Hors ligne',
        className: 'text-gray-500',
        description: 'Synchronisation automatique reprendra lorsque la connexion sera rétablie.'
      };
    }
    
    if (isSyncing) {
      return {
        icon: <Loader className="h-4 w-4 text-blue-500 animate-spin" />,
        label: 'Synchronisation en cours',
        className: 'text-blue-500',
        description: 'Synchronisation des données avec le serveur en cours...'
      };
    }
    
    if (hasUnsyncedData) {
      return {
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        label: 'Modifications en attente',
        className: 'text-amber-500',
        description: 'Synchronisation automatique dans quelques secondes...'
      };
    }
    
    return {
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      label: 'Synchronisé',
      className: 'text-green-500',
      description: 'Toutes les données sont synchronisées avec le serveur.'
    };
  };
  
  const status = getStatusDetails();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${status.className}`}>
              {status.icon}
              <span>{status.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="text-gray-500">
        <span className="mx-2">•</span>
        <span>Dernière synchronisation: {formatLastSynced()}</span>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
