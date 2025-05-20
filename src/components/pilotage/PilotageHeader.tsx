
import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';

interface PilotageHeaderProps {
  onExport: () => void;
  onSync?: () => Promise<boolean> | void;
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
        {lastSynced && (
          <p className="text-xs text-gray-500">
            Dernière synchronisation: {new Date(lastSynced).toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex space-x-2">
        {onSync && (
          <button 
            onClick={onSync}
            disabled={isSyncing || !isOnline}
            className={`p-2 rounded-md transition-colors ${
              syncFailed 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-green-600 hover:bg-green-50'
            } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={
              !isOnline 
                ? 'Non disponible en mode hors ligne' 
                : isSyncing 
                  ? 'Synchronisation en cours' 
                  : 'Synchroniser les données'
            }
          >
            <RefreshCw className={`h-6 w-6 stroke-[1.5] ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
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
