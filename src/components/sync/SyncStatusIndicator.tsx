
import React from 'react';
import { RefreshCw, CloudOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  lastSynced: Date | null;
  isOnline: boolean;
  syncFailed: boolean;
  onSyncClick?: () => void;
}

// Indicateur de statut de synchronisation qui est maintenant invisible selon votre demande
const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = () => {
  // Ne rien afficher du tout
  return null;
};

export default SyncStatusIndicator;
