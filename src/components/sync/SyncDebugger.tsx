
import React, { useState, useEffect } from 'react';
import { hasPendingChanges, getLastSynced } from '@/services/sync/AutoSyncService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, CheckCircle, ChevronDown, Database, Wifi, WifiOff } from 'lucide-react';

// Tables à surveiller pour la synchronisation
const MONITORED_TABLES = [
  'membres',
  'exigences',
  'documents',
  'collaboration',
  'test_table',
  'diagnostics'
];

interface SyncTableStatus {
  tableName: string;
  hasPending: boolean;
  lastSynced: Date | null;
}

const SyncDebugger: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [userId, setUserId] = useState<string>(getCurrentUser());
  const [open, setOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<SyncTableStatus[]>([]);

  // Surveiller l'état de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Surveiller l'utilisateur courant
  useEffect(() => {
    const handleUserChange = (event: CustomEvent) => {
      if (event.detail?.userId) {
        setUserId(event.detail.userId);
      }
    };

    window.addEventListener('userChanged', handleUserChange as EventListener);
    window.addEventListener('database-user-changed', handleUserChange as EventListener);

    return () => {
      window.removeEventListener('userChanged', handleUserChange as EventListener);
      window.removeEventListener('database-user-changed', handleUserChange as EventListener);
    };
  }, []);

  // Mettre à jour les statuts de synchronisation
  useEffect(() => {
    const updateStatus = () => {
      const newStatus = MONITORED_TABLES.map(tableName => ({
        tableName,
        hasPending: hasPendingChanges(tableName, userId),
        lastSynced: getLastSynced(tableName, userId)
      }));
      setStatus(newStatus);
    };

    updateStatus();
    const intervalId = setInterval(updateStatus, 5000);

    // Écouter les événements de synchronisation
    const handleSyncEvent = () => {
      updateStatus();
    };

    window.addEventListener('sync-start', handleSyncEvent);
    window.addEventListener('sync-completed', handleSyncEvent);
    window.addEventListener('sync-success', handleSyncEvent);
    window.addEventListener('sync-error', handleSyncEvent);
    window.addEventListener('data-changed', handleSyncEvent);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('sync-start', handleSyncEvent);
      window.removeEventListener('sync-completed', handleSyncEvent);
      window.removeEventListener('sync-success', handleSyncEvent);
      window.removeEventListener('sync-error', handleSyncEvent);
      window.removeEventListener('data-changed', handleSyncEvent);
    };
  }, [userId]);

  // Forcer une mise à jour
  const handleRefresh = () => {
    window.dispatchEvent(new CustomEvent('force-sync-required'));
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "outline" : "destructive"}>
            {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Badge>
          <Badge variant="outline">
            <Database className="h-3 w-3 mr-1" />
            ID: {userId}
          </Badge>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <span className="mr-2">État synchronisation</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'transform rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <Card className="mt-2">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex justify-between">
              <span>Statut de synchronisation par table</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Forcer la synchronisation
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {status.map((item) => (
                <div key={item.tableName} className="border rounded p-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{item.tableName}</div>
                    <Badge variant={item.hasPending ? "destructive" : "default"}>
                      {item.hasPending ? (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {item.hasPending ? 'En attente' : 'Synchronisé'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Dernière synchro: {item.lastSynced ? new Date(item.lastSynced).toLocaleString() : 'Jamais'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SyncDebugger;
