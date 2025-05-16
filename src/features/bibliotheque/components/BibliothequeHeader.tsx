
import React from 'react';
import { CloudSun, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BibliothequeHeaderProps {
  onSync: () => Promise<void>;
  syncFailed?: boolean;
  isSyncing?: boolean;
  isOnline?: boolean;
  lastSynced?: Date | null;
}

export const BibliothequeHeader: React.FC<BibliothequeHeaderProps> = ({
  onSync,
  syncFailed = false,
  isSyncing = false,
  isOnline = navigator.onLine,
  lastSynced = null
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-app-blue">Bibliothèque de documents</h1>
        
        {/* Bouton de synchronisation invisible mais fonctionnel */}
        <Button
          onClick={onSync}
          variant="outline"
          size="sm"
          className="hidden"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
      {/* Indicateur de synchronisation est maintenant complètement supprimé */}
    </div>
  );
};
