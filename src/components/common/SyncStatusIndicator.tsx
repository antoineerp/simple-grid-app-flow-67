
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  syncFailed: boolean;
  lastSynced?: Date | null;
  onReset?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isSyncing,
  syncFailed,
  lastSynced,
  onReset
}) => {
  const renderIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="animate-spin h-4 w-4" />;
    }
    
    if (syncFailed) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };
  
  const renderLastSyncedText = () => {
    if (!lastSynced) return "Jamais synchronisé";
    
    return `Dernière synchronisation: ${formatDistanceToNow(lastSynced, { 
      addSuffix: true,
      locale: fr
    })}`;
  };
  
  return (
    <div className={`
      flex items-center justify-between p-2 mb-4 rounded-md text-sm
      ${syncFailed ? 'bg-red-50' : 'bg-gray-50'}
    `}>
      <div className="flex items-center">
        {renderIcon()}
        <span className="ml-2">
          {isSyncing ? "Synchronisation en cours..." : renderLastSyncedText()}
        </span>
      </div>
      
      {syncFailed && onReset && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          disabled={isSyncing}
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Réessayer
        </Button>
      )}
      
      {!syncFailed && !isSyncing && (
        <Clock className="h-4 w-4 text-gray-400" />
      )}
    </div>
  );
};

export default SyncStatusIndicator;
