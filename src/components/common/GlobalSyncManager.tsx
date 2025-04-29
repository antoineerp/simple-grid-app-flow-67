
import React, { useEffect, useState } from 'react';
import { syncService } from '@/services/sync/SyncService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AlertTriangle, CloudOff, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const GlobalSyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  // Vérifier l'état de synchronisation toutes les 5 secondes
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
      
      // Vérifier s'il y a des changements en attente
      const tables = ['documents', 'exigences', 'membres', 'bibliotheque', 'pilotage'];
      const changes: Record<string, boolean> = {};
      
      tables.forEach(table => {
        const failedSync = localStorage.getItem(`sync_failed_${table}`);
        changes[table] = !!failedSync;
      });
      
      setPendingChanges(changes);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Déterminer si une synchronisation est en cours
  const anySyncInProgress = syncStatus.activeSyncs.length > 0 || syncStatus.isSyncing;
  
  // Déterminer s'il y a des changements en attente
  const anyPendingChanges = Object.values(pendingChanges).some(val => val);
  
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <button 
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-md"
              title="Mode hors ligne"
            >
              <CloudOff size={16} />
              <span className="hidden sm:inline">Hors ligne</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <h4 className="font-medium mb-2">Mode hors ligne</h4>
            <p className="text-sm text-gray-600 mb-4">
              Vous êtes actuellement hors ligne. Les modifications sont enregistrées localement et seront 
              synchronisées automatiquement lorsque vous serez de nouveau en ligne.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
  
  if (anyPendingChanges) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <button 
              className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full shadow-md"
              title="Modifications en attente"
            >
              <AlertTriangle size={16} />
              <span className="hidden sm:inline">Modifications en attente</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <h4 className="font-medium mb-2">Modifications en attente</h4>
            <p className="text-sm text-gray-600 mb-4">
              Certaines modifications n'ont pas été synchronisées avec le serveur. 
              Cliquez sur le bouton ci-dessous pour forcer la synchronisation.
            </p>
            <button 
              className="w-full bg-primary text-white py-2 rounded flex items-center justify-center gap-2"
              onClick={() => {
                toast({
                  title: "Synchronisation manuelle",
                  description: "Tentative de synchronisation des modifications en attente..."
                });
                
                Object.keys(pendingChanges).forEach(table => {
                  if (pendingChanges[table]) {
                    syncService.syncTable({ tableName: table, data: [] }, null, "manual")
                      .catch(console.error);
                  }
                });
              }}
            >
              <Save size={16} />
              Synchroniser maintenant
            </button>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
  
  if (anySyncInProgress) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow-md">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
          <span className="hidden sm:inline">Synchronisation...</span>
        </div>
      </div>
    );
  }
  
  // Pas d'affichage si tout est normal
  return null;
};

export default GlobalSyncManager;
