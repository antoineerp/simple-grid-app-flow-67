
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

export const SyncDiagnosticPanel: React.FC<{onClose: () => void}> = ({ onClose }) => {
  const { isOnline, syncAll, syncStates } = useGlobalSync();
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">État de la connexion</h3>
        <p>{isOnline ? 'En ligne' : 'Hors ligne'}</p>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">État des synchronisations</h3>
        <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-[200px] text-xs">
          {JSON.stringify(syncStates, null, 2)}
        </pre>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>Fermer</Button>
        <Button onClick={() => syncAll()}>Forcer la synchronisation</Button>
      </div>
    </div>
  );
};
