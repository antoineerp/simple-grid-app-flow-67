
import React from 'react';
import { CloudSun, AlertCircle, Loader, CheckCircle, CloudOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  queueStatus?: {
    total: number;
    pending: number;
    processing: number;
    failed: number;
    hasFailures: boolean;
  };
  hasUnsyncedData?: boolean;
  onRetry?: () => void;
  onClear?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isSyncing,
  isOnline,
  lastSynced,
  queueStatus = { total: 0, pending: 0, processing: 0, failed: 0, hasFailures: false },
  hasUnsyncedData = false,
  onRetry,
  onClear
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
        description: 'Vous êtes actuellement hors ligne. La synchronisation reprendra automatiquement lorsque la connexion sera rétablie.'
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
    
    if (queueStatus.processing > 0) {
      return {
        icon: <Loader className="h-4 w-4 text-blue-500 animate-spin" />,
        label: `Synchronisation en cours (${queueStatus.processing}/${queueStatus.total})`,
        className: 'text-blue-500',
        description: 'Opérations en cours de traitement...'
      };
    }
    
    if (queueStatus.pending > 0) {
      return {
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        label: `En attente (${queueStatus.pending})`,
        className: 'text-amber-500',
        description: 'Opérations en attente de synchronisation...'
      };
    }
    
    if (queueStatus.hasFailures) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        label: `Échec (${queueStatus.failed})`,
        className: 'text-red-500',
        description: 'Certaines opérations de synchronisation ont échoué.'
      };
    }
    
    if (hasUnsyncedData) {
      return {
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        label: 'Modifications non synchronisées',
        className: 'text-amber-500',
        description: 'Changements locaux non encore synchronisés avec le serveur.'
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
      
      {queueStatus.hasFailures && onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="ml-2"
        >
          Réessayer
        </Button>
      )}
      
      {queueStatus.hasFailures && onClear && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClear}
          className="ml-1"
        >
          Effacer
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
