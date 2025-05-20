
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, CloudOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';

interface SyncIndicatorProps {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed?: boolean;
  className?: string;
  onSync?: () => Promise<void>;
  showButton?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SyncIndicator = ({ 
  isSyncing, 
  lastSynced, 
  syncFailed = false,
  className = '',
  onSync,
  showButton = true,
  label = 'Synchroniser',
  size = 'md'
}: SyncIndicatorProps) => {
  const { isOnline } = useNetworkStatus();

  // Format relative time
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    
    if (diffSec < 60) {
      return "à l'instant";
    } else if (diffMin < 60) {
      return `il y a ${diffMin} min`;
    } else if (diffHrs < 24) {
      return `il y a ${diffHrs} h`;
    } else {
      const options: Intl.DateTimeFormatOptions = { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      return new Intl.DateTimeFormat('fr-FR', options).format(date);
    }
  };

  // Déterminer le contenu du badge
  let statusIcon = null;
  let statusText = '';
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  
  if (!isOnline) {
    statusIcon = <CloudOff className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />;
    statusText = 'Hors ligne';
    variant = 'outline';
  } else if (isSyncing) {
    statusIcon = <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1 animate-spin`} />;
    statusText = 'Synchronisation...';
    variant = 'secondary';
  } else if (syncFailed) {
    statusIcon = <AlertCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />;
    statusText = 'Échec sync';
    variant = 'destructive';
  } else if (lastSynced) {
    statusIcon = <CheckCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />;
    statusText = `Synchro ${formatTimeAgo(lastSynced)}`;
    variant = 'default';
  } else {
    statusIcon = <AlertCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />;
    statusText = 'Non synchronisé';
    variant = 'outline';
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={variant} className={`flex items-center ${size === 'sm' ? 'text-xs py-0' : ''}`}>
        {statusIcon}
        <span>{statusText}</span>
      </Badge>
      
      {showButton && onSync && (
        <Button 
          variant="outline" 
          size={size === 'sm' ? 'sm' : 'default'} 
          onClick={onSync}
          disabled={isSyncing || !isOnline}
          className={size === 'sm' ? 'h-7 px-2 text-xs' : ''}
        >
          {isSyncing ? (
            <>
              <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1 animate-spin`} />
              <span>Synchro...</span>
            </>
          ) : (
            <>{label}</>
          )}
        </Button>
      )}
    </div>
  );
};

export default SyncIndicator;
