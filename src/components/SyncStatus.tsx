
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, CloudOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface SyncStatusProps {
  lastSynced: Date | null;
  isSyncing: boolean;
  syncFailed: boolean;
  className?: string;
}

const SyncStatus = ({ lastSynced, isSyncing, syncFailed, className = '' }: SyncStatusProps) => {
  const { isOnline } = useNetworkStatus();
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Format relative time
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastSynced) {
        setTimeAgo('jamais');
        return;
      }
      
      const now = new Date();
      const diffMs = now.getTime() - lastSynced.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHrs = Math.floor(diffMin / 60);
      
      if (diffSec < 60) {
        setTimeAgo("à l'instant");
      } else if (diffMin < 60) {
        setTimeAgo(`il y a ${diffMin} min`);
      } else if (diffHrs < 24) {
        setTimeAgo(`il y a ${diffHrs} h`);
      } else {
        const options: Intl.DateTimeFormatOptions = { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        };
        setTimeAgo(new Intl.DateTimeFormat('fr-FR', options).format(lastSynced));
      }
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    
    return () => clearInterval(interval);
  }, [lastSynced]);

  let icon = null;
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  let text = '';
  
  if (!isOnline) {
    icon = <CloudOff className="h-4 w-4 mr-1" />;
    variant = 'outline';
    text = 'Hors ligne';
  } else if (isSyncing) {
    icon = <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
    variant = 'secondary';
    text = 'Synchronisation...';
  } else if (syncFailed) {
    icon = <AlertCircle className="h-4 w-4 mr-1" />;
    variant = 'destructive';
    text = 'Échec de synchronisation';
  } else if (lastSynced) {
    icon = <CheckCircle className="h-4 w-4 mr-1" />;
    variant = 'default';
    text = `Synchronisé ${timeAgo}`;
  } else {
    icon = <AlertCircle className="h-4 w-4 mr-1" />;
    variant = 'outline';
    text = 'Jamais synchronisé';
  }

  return (
    <Badge variant={variant} className={`flex items-center ${className}`}>
      {icon}
      <span>{text}</span>
    </Badge>
  );
};

export default SyncStatus;
