
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSyncContext } from '../hooks/useSyncContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Check, Wifi, WifiOff } from 'lucide-react';

/**
 * Composant pour déboguer l'état de synchronisation
 */
const SyncDebugger: React.FC = () => {
  const { syncState, isSyncEnabled, isOnline, performGlobalSync, lastGlobalSync } = useSyncContext();

  const getStatusBadge = (tableName: string) => {
    const state = syncState[tableName];
    
    if (!state) {
      return <Badge variant="outline">Non enregistré</Badge>;
    }
    
    if (state.isSyncing) {
      return <Badge className="bg-blue-500">Synchronisation...</Badge>;
    }
    
    if (state.error) {
      return <Badge variant="destructive">Erreur</Badge>;
    }
    
    if (state.syncFailed) {
      return <Badge variant="destructive">Échec</Badge>;
    }
    
    if (state.pendingSync) {
      return <Badge variant="warning">En attente</Badge>;
    }
    
    return <Badge variant="success">Synchronisé</Badge>;
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>État de synchronisation</span>
          <div className="flex items-center space-x-2">
            {isOnline ? 
              <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center">
                <Wifi className="h-3 w-3 mr-1" /> En ligne
              </Badge> :
              <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center">
                <WifiOff className="h-3 w-3 mr-1" /> Hors ligne
              </Badge>
            }
            
            <Badge variant={isSyncEnabled ? "success" : "secondary"}>
              {isSyncEnabled ? "Synchronisation activée" : "Synchronisation désactivée"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Dernière synchronisation globale:</div>
          <div className="font-semibold">
            {lastGlobalSync ? new Date(lastGlobalSync).toLocaleString() : "Jamais"}
          </div>
        </div>
        
        <div className="space-y-2">
          {Object.keys(syncState).map((tableName) => (
            <div key={tableName} className="flex justify-between items-center border-b pb-2">
              <div>
                <div className="font-medium">{tableName}</div>
                <div className="text-xs text-gray-500">
                  {syncState[tableName].lastSynced ? 
                    `Dernière sync: ${new Date(syncState[tableName].lastSynced).toLocaleString()}` : 
                    "Jamais synchronisé"}
                </div>
                {syncState[tableName].error && (
                  <div className="text-xs text-red-500 mt-1">
                    {syncState[tableName].error}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusBadge(tableName)}
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={performGlobalSync}
          disabled={!isSyncEnabled || !isOnline}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Synchroniser toutes les tables
        </Button>
      </CardContent>
    </Card>
  );
};

export default SyncDebugger;
