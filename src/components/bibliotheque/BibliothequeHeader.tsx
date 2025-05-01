
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FolderPlus, RefreshCw } from 'lucide-react';

interface BibliothequeHeaderProps {
  onSearch: (term: string) => void;
  onAddDocument: () => void;
  onAddGroup: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  isOnline?: boolean;
  syncFailed?: boolean;
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
  currentUser,
  showOnlyErrors = false
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bibliothèque de Documents</h1>
        {currentUser && (
          <div className="text-sm text-gray-500">
            Utilisateur: {currentUser}
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 items-center">
        <Input
          type="text"
          placeholder="Rechercher un document..."
          className="flex-grow"
          onChange={(e) => onSearch(e.target.value)}
        />
        
        {onSync && (
          <Button
            onClick={onSync}
            variant="outline"
            size="sm"
            disabled={isSyncing || !isOnline}
            className={`${syncFailed && !showOnlyErrors ? 'border-red-500' : ''}`}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
          </Button>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onAddGroup}>
          <FolderPlus className="h-4 w-4 mr-1" />
          Nouveau groupe
        </Button>
        <Button onClick={onAddDocument}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau document
        </Button>
      </div>
    </div>
  );
};

export default BibliothequeHeader;
