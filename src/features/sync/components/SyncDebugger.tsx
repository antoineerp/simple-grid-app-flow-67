
import React, { useState, useEffect } from 'react';
import { useSyncContext } from '../hooks/useSyncContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle, 
  Cloud, 
  CloudOff, 
  RefreshCw,
  X, 
  ChevronDown, 
  ChevronUp,
  Activity
} from 'lucide-react';

interface SyncDebuggerProps {
  enabled?: boolean;
}

const SyncDebugger: React.FC<SyncDebuggerProps> = ({ enabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { syncStates, isOnline, monitorStatus, forceProcessQueue } = useSyncContext();
  const [syncStats, setSyncStats] = useState({
    pendingCount: 0,
    failedCount: 0,
    syncingCount: 0
  });
  
  // Ne rien afficher si désactivé
  if (!enabled) return null;
  
  // Calculer les statistiques à partir des états
  useEffect(() => {
    const pendingCount = Object.values(syncStates).filter(s => s.pendingSync).length;
    const failedCount = Object.values(syncStates).filter(s => s.syncFailed).length;
    const syncingCount = Object.values(syncStates).filter(s => s.isSyncing).length;
    
    setSyncStats({
      pendingCount,
      failedCount,
      syncingCount
    });
  }, [syncStates]);
  
  return (
    <div className="fixed bottom-2 right-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Barre de titre toujours visible */}
      <div 
        className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">Sync Debug</span>
          {syncStats.syncingCount > 0 && (
            <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Cloud className="h-3 w-3 text-green-500" />
          ) : (
            <CloudOff className="h-3 w-3 text-red-500" />
          )}
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>
      
      {/* Contenu détaillé */}
      {isOpen && (
        <div className="p-2 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <Badge variant={isOnline ? "outline" : "destructive"} className="text-xs">
                {isOnline ? "Online" : "Offline"}
              </Badge>
              <Badge variant="outline" className="ml-1 text-xs">
                Health: {monitorStatus.health}
              </Badge>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2"
              onClick={() => forceProcessQueue()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Force
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className={`p-1 rounded ${syncStats.syncingCount > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <div className="font-medium">{syncStats.syncingCount}</div>
              <div className="text-[10px]">Syncing</div>
            </div>
            <div className={`p-1 rounded ${syncStats.pendingCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <div className="font-medium">{syncStats.pendingCount}</div>
              <div className="text-[10px]">Pending</div>
            </div>
            <div className={`p-1 rounded ${syncStats.failedCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <div className="font-medium">{syncStats.failedCount}</div>
              <div className="text-[10px]">Failed</div>
            </div>
          </div>
          
          <div className="text-[10px] text-gray-500">
            Recent: {monitorStatus.stats.success} success, {monitorStatus.stats.failure} failed
          </div>
          
          <div className="max-h-40 overflow-auto">
            {monitorStatus.recentAttempts.slice(0, 5).map((attempt, idx) => (
              <div key={idx} className="text-[10px] flex items-center">
                {attempt.success ? (
                  <CheckCircle className="h-2 w-2 text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-2 w-2 text-red-500 mr-1 flex-shrink-0" />
                )}
                <span className="truncate">{attempt.tableName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncDebugger;
