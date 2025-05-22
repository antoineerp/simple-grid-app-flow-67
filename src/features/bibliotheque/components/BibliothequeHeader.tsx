
import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SyncIndicator from '@/components/common/SyncIndicator';

interface BibliothequeHeaderProps {
  onSync: () => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
  syncFailed: boolean;
  lastSynced: Date | null;
  onExport?: () => void;
}

export function BibliothequeHeader({
  onSync,
  isSyncing,
  isOnline,
  syncFailed,
  lastSynced,
  onExport
}: BibliothequeHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Collaboration</h1>
        </div>
        <div className="flex space-x-2">
          {onExport && (
            <button
              onClick={onExport}
              className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
              title="Exporter en PDF"
            >
              <FileText className="h-6 w-6 stroke-[1.5]" />
            </button>
          )}
        </div>
      </div>

      <SyncIndicator
        isSyncing={isSyncing}
        isOnline={isOnline}
        syncFailed={syncFailed}
        lastSynced={lastSynced}
        onSync={onSync}
        showOnlyErrors={true}
      />
    </div>
  );
}
