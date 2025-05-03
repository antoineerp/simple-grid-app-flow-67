
import React from 'react';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';

interface SyncIndicatorProps {
  isSyncing: boolean;
  isOnline: boolean;
  syncFailed: boolean;
  lastSynced: Date | null;
  onSync: () => void;
  showOnlyErrors?: boolean;
  tableName?: string;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing,
  isOnline,
  syncFailed,
  lastSynced,
  onSync,
  showOnlyErrors = false,
  tableName = ''
}) => {
  // Formater la date de dernière synchronisation
  const formatLastSynced = (date: Date | null): string => {
    if (!date) return "Jamais";
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Si moins d'une minute
    if (diff < 60000) {
      return "À l'instant";
    }
    
    // Si moins d'une heure
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Il y a ${minutes} min`;
    }
    
    // Si moins d'un jour
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `Il y a ${hours}h`;
    }
    
    // Si plus d'un jour
    const days = Math.floor(diff / 86400000);
    return `Il y a ${days}j`;
  };

  // Ne rien afficher s'il n'y a pas d'erreurs et qu'on est en mode erreurs seulement
  if (showOnlyErrors && !syncFailed && !isSyncing) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return "text-red-500";
    if (syncFailed) return "text-amber-500";
    if (isSyncing) return "text-blue-500";
    return "text-green-500";
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-md border ${syncFailed ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${getStatusColor()}`}>
              {syncFailed ? (
                <AlertTriangle className="h-4 w-4" />
              ) : isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>
                {syncFailed 
                  ? "Échec de synchronisation" 
                  : isSyncing 
                    ? "Synchronisation en cours..." 
                    : `Dernière synchronisation: ${formatLastSynced(lastSynced)}`
                }
                {tableName && ` (${tableName})`}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {syncFailed 
              ? "La dernière tentative de synchronisation a échoué. Cliquez sur Réessayer."
              : isSyncing 
                ? "Synchronisation en cours avec la base de données..."
                : `Dernière synchronisation: ${lastSynced ? lastSynced.toLocaleString() : 'Jamais'}`
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onSync}
        disabled={isSyncing}
        title="Forcer une synchronisation"
        className={`${showOnlyErrors && !syncFailed ? 'hidden' : ''}`}
      >
        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
        {syncFailed ? "Réessayer" : "Synchroniser"}
      </Button>
    </div>
  );
};

export default SyncIndicator;
