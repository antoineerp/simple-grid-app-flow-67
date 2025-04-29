
import React from 'react';
import { CloudSun, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SyncIndicator from '@/components/common/SyncIndicator';

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
      </div>
      
      {/* Only show the SyncIndicator if there's an error or we're offline */}
      <div className="mb-4">
        <SyncIndicator
          isSyncing={isSyncing}
          isOnline={isOnline}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={onSync}
          showOnlyErrors={true}
        />
      </div>
    </div>
  );
};
