
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudOff, CloudSync, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncContext } from '@/hooks/useSyncContext';
import { syncRegistry, isTableTracked } from '@/services/sync/SyncRegistry';

interface SyncStatusIndicatorProps {
  tableName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  tableName,
  showLabel = false,
  size = 'md',
  className
}) => {
  const { isOnline } = useNetworkStatus();
  const { syncStates, monitorStatus } = useSyncContext();
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing' | 'error' | 'success'>('online');
  
  // Déterminer l'état de la synchronisation
  useEffect(() => {
    if (!isOnline) {
      setStatus('offline');
      return;
    }
    
    // Si une table spécifique est surveillée
    if (tableName) {
      const normalizedTableName = syncRegistry.normalizeTableName(tableName);
      const tableState = syncStates[normalizedTableName];
      
      if (tableState?.isSyncing) {
        setStatus('syncing');
      } else if (tableState?.syncFailed) {
        setStatus('error');
      } else {
        setStatus('success');
      }
    } else {
      // État global de synchronisation
      const isAnySyncing = Object.values(syncStates).some(state => state?.isSyncing);
      const isAnyFailed = Object.values(syncStates).some(state => state?.syncFailed);
      
      if (isAnySyncing) {
        setStatus('syncing');
      } else if (isAnyFailed) {
        setStatus('error');
      } else {
        setStatus('success');
      }
    }
  }, [isOnline, syncStates, tableName]);
  
  // Déterminer la taille des icônes
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  
  // Déterminer les classes CSS en fonction du statut
  const badgeVariant = status === 'offline' ? 'outline' : 'secondary';
  const badgeClass = cn(
    "flex items-center gap-1",
    status === 'offline' && "bg-gray-50 text-gray-500 border-gray-200",
    status === 'syncing' && "bg-blue-50 text-blue-700 border-blue-200",
    status === 'error' && "bg-red-50 text-red-700 border-red-200",
    status === 'success' && "bg-green-50 text-green-700 border-green-200",
    className
  );
  
  // Si la table n'est pas suivie, afficher un indicateur spécial
  if (tableName && !isTableTracked(tableName)) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200 flex items-center gap-1">
        <CloudOff className={iconSize} />
        {showLabel && <span>Non suivi</span>}
      </Badge>
    );
  }

  return (
    <Badge variant={badgeVariant} className={badgeClass}>
      {status === 'offline' && <CloudOff className={iconSize} />}
      {status === 'syncing' && <CloudSync className={`${iconSize} animate-spin`} />}
      {status === 'error' && <AlertCircle className={iconSize} />}
      {status === 'success' && <CheckCircle className={iconSize} />}
      {status === 'online' && <Cloud className={iconSize} />}
      
      {showLabel && (
        <span>
          {status === 'offline' && "Hors ligne"}
          {status === 'syncing' && "Synchronisation..."}
          {status === 'error' && "Erreur de synchronisation"}
          {status === 'success' && "Synchronisé"}
          {status === 'online' && "En ligne"}
        </span>
      )}
    </Badge>
  );
};

export default SyncStatusIndicator;
