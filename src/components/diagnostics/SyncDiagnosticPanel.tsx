
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSyncContext } from '@/contexts/SyncContext';
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SyncDiagnosticPanelProps {
  onForceSync?: () => Promise<void>;
}

const SyncDiagnosticPanel: React.FC<SyncDiagnosticPanelProps> = ({ onForceSync }) => {
  const { 
    isOnline, 
    lastSynced, 
    isSyncing,
    syncErrors,
    syncAll
  } = useSyncContext();

  // Déterminer le statut global
  const globalIsSyncing = Object.values(isSyncing).some(status => status);
  const globalHasError = Object.values(syncErrors).some(error => !!error);
  const globalLastSynced = Object.values(lastSynced).reduce((latest, date) => 
    date && (!latest || date > latest) ? date : latest, null as Date | null);

  const handleForceSync = async () => {
    if (onForceSync) {
      await onForceSync();
    } else {
      await syncAll();
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          État de la synchronisation
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "En ligne" : "Hors ligne"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {globalIsSyncing ? (
                <RefreshCcw className="h-5 w-5 text-blue-500 animate-spin" />
              ) : globalHasError ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : globalLastSynced ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              
              <span className="font-medium">
                {globalIsSyncing 
                  ? "Synchronisation en cours..." 
                  : globalHasError 
                    ? "Erreur de synchronisation" 
                    : globalLastSynced 
                      ? "Synchronisé" 
                      : "Jamais synchronisé"}
              </span>
            </div>
            
            {globalLastSynced && !globalIsSyncing && (
              <span className="text-sm text-gray-500">
                Dernière: {globalLastSynced.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {/* Liste des tables synchronisées */}
          <div className="text-sm space-y-1">
            {Object.entries(lastSynced).map(([table, time]) => (
              <div key={table} className="flex items-center justify-between border-t border-gray-100 pt-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{table}</span>
                  {isSyncing[table] && <RefreshCcw className="h-3 w-3 animate-spin text-blue-500" />}
                  {syncErrors[table] && <XCircle className="h-3 w-3 text-red-500" title={syncErrors[table] || ''} />}
                </div>
                <span className="text-xs text-gray-400">
                  {time ? time.toLocaleTimeString() : "Jamais"}
                </span>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={handleForceSync} 
            disabled={globalIsSyncing || !isOnline}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${globalIsSyncing ? 'animate-spin' : ''}`} />
            Forcer la synchronisation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncDiagnosticPanel;
