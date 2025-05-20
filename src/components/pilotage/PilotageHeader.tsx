
import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SyncStatus from '@/components/SyncStatus';

interface PilotageHeaderProps {
  onExport: () => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
  syncFailed?: boolean;
  lastSynced?: Date | null;
  isOnline?: boolean;
}

const PilotageHeader: React.FC<PilotageHeaderProps> = ({ 
  onExport, 
  onSync, 
  isSyncing = false,
  syncFailed = false,
  lastSynced = null,
  isOnline = true
}) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <h1 className="text-3xl font-bold text-app-blue">Pilotage</h1>
      </div>
      <div className="flex items-center space-x-2">
        {onSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="mr-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
          </Button>
        )}
        
        {isOnline && lastSynced && (
          <SyncStatus
            lastSynced={lastSynced}
            isSyncing={isSyncing}
            syncFailed={syncFailed}
            className="mr-2"
          />
        )}
        
        <button 
          onClick={onExport}
          className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
          title="Exporter en PDF"
        >
          <FileText className="h-6 w-6 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
};

export default PilotageHeader;
