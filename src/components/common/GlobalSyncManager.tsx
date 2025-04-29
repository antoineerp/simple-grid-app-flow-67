
import React, { useState, useEffect } from 'react';
import { dataSyncManager } from '@/services/sync/DataSyncManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { CloudOff, AlertTriangle, RotateCw, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const GlobalSyncManager: React.FC = () => {
  const [globalStatus, setGlobalStatus] = useState(() => dataSyncManager.getGlobalSyncStatus());
  const { isOnline } = useNetworkStatus();
  
  // Mettre à jour le statut global périodiquement
  useEffect(() => {
    const intervalId = setInterval(() => {
      setGlobalStatus(dataSyncManager.getGlobalSyncStatus());
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Déterminer quel indicateur afficher
  const anySyncing = globalStatus.activeSyncCount > 0;
  const anyPending = globalStatus.pendingChangesCount > 0;
  const anyFailed = globalStatus.failedSyncCount > 0;
  
  // Mode hors ligne
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
  
  // Erreur de synchronisation
  if (anyFailed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <button 
              className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full shadow-md"
              title="Échec de synchronisation"
            >
              <AlertTriangle size={16} />
              <span className="hidden sm:inline">Échec de synchronisation</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <h4 className="font-medium mb-2">Problèmes de synchronisation</h4>
            <p className="text-sm text-gray-600 mb-4">
              La synchronisation de certaines données a échoué. Cliquez sur le bouton ci-dessous 
              pour réessayer.
            </p>
            <div className="max-h-32 overflow-auto mb-4">
              <ul className="text-xs">
                {globalStatus.failedTables.map(table => (
                  <li key={table} className="mb-1 text-red-600">{table}</li>
                ))}
              </ul>
            </div>
            <Button 
              className="w-full bg-primary text-white"
              onClick={() => dataSyncManager.syncAllPending()}
            >
              <RotateCw size={16} className="mr-2" />
              Réessayer la synchronisation
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
  
  // Modifications en attente
  if (anyPending && !anySyncing) {
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
              Cliquez sur le bouton ci-dessous pour synchroniser maintenant.
            </p>
            <div className="max-h-32 overflow-auto mb-4">
              <ul className="text-xs">
                {globalStatus.pendingTables.map(table => (
                  <li key={table} className="mb-1">{table}</li>
                ))}
              </ul>
            </div>
            <Button 
              className="w-full bg-primary text-white"
              onClick={() => dataSyncManager.syncAllPending()}
            >
              Synchroniser maintenant
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
  
  // Synchronisation en cours
  if (anySyncing) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow-md">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
          <span className="hidden sm:inline">Synchronisation...</span>
        </div>
      </div>
    );
  }
  
  // Tout est synchronisé
  return (
    <div className="fixed bottom-4 right-4 z-50 opacity-70 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full shadow-md">
        <Check size={16} />
        <span className="hidden sm:inline">Synchronisé</span>
      </div>
    </div>
  );
};

export default GlobalSyncManager;
