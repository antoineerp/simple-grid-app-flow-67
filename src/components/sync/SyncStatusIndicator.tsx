
/**
 * Composant pour afficher le statut de synchronisation
 */
import React from 'react';
import { Loader2, CloudOff, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced: Date | null;
  hasPendingChanges: boolean;
  onSyncClick?: () => void;
  className?: string;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isSyncing,
  isOnline,
  lastSynced,
  hasPendingChanges,
  onSyncClick,
  className
}) => {
  // Formatage du temps écoulé depuis la dernière synchronisation
  const getTimeAgo = (date: Date | null): string => {
    if (!date) return 'Jamais';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `Il y a ${hours}h`;
    } else if (minutes > 0) {
      return `Il y a ${minutes}min`;
    } else {
      return `Il y a ${seconds}s`;
    }
  };
  
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      {!isOnline ? (
        <div className="flex items-center text-amber-500">
          <CloudOff size={14} className="mr-1" />
          <span>Hors ligne</span>
        </div>
      ) : isSyncing ? (
        <div className="flex items-center text-blue-500">
          <Loader2 size={14} className="mr-1 animate-spin" />
          <span>Synchronisation...</span>
        </div>
      ) : hasPendingChanges ? (
        <div className="flex items-center text-amber-500">
          <RefreshCw size={14} className="mr-1" />
          <span>Changements non synchronisés</span>
        </div>
      ) : (
        <div className="flex items-center text-green-500">
          <Check size={14} className="mr-1" />
          <span>Synchronisé {lastSynced ? getTimeAgo(lastSynced) : ''}</span>
        </div>
      )}
      
      {onSyncClick && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2"
          onClick={onSyncClick} 
          disabled={isSyncing || !isOnline}
        >
          <RefreshCw size={14} />
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
