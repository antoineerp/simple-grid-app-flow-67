
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderPlus, RefreshCw } from 'lucide-react';
import SyncIndicator from '@/components/common/SyncIndicator';

interface BibliothequeHeaderProps {
  onSearch: (term: string) => void;
  onAddDocument: () => void;
  onAddGroup: () => void;
  onSync: () => Promise<void>;
  isSyncing?: boolean;
  isOnline?: boolean;
  syncFailed?: boolean;
  lastSynced?: Date | null;
  currentUser?: string;
  showOnlyErrors?: boolean;
}

const BibliothequeHeader: React.FC<BibliothequeHeaderProps> = ({
  onSearch,
  onAddDocument,
  onAddGroup,
  onSync,
  isSyncing = false,
  isOnline = true,
  syncFailed = false,
  lastSynced = null,
  currentUser = 'default',
  showOnlyErrors = true
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Bibliothèque de Documents</h1>
        
        <div className="flex space-x-2">
          <Button
            onClick={onSync}
            variant="outline"
            size="sm"
            disabled={isSyncing}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <SyncIndicator 
          isSyncing={isSyncing}
          isOnline={isOnline}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={onSync}
          showOnlyErrors={showOnlyErrors}
        />
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:flex-grow">
          <Input 
            placeholder="Rechercher un document..." 
            onChange={(e) => onSearch(e.target.value)} 
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onAddGroup}
            className="flex items-center"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Nouveau groupe
          </Button>
          <Button 
            onClick={onAddDocument}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau document
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BibliothequeHeader;
