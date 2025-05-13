
import React from 'react';
import SyncToolbar from '@/components/common/SyncToolbar';

interface MembresToolbarProps {
  onSync: () => void;
  lastSynced: Date | null;
  isLoading: boolean;
  error: string | null;
}

const MembresToolbar: React.FC<MembresToolbarProps> = ({ 
  onSync, 
  lastSynced, 
  isLoading, 
  error 
}) => {
  return (
    <SyncToolbar
      onSync={onSync}
      lastSynced={lastSynced}
      isLoading={isLoading}
      error={error}
      tableName="membres"
    />
  );
};

export default MembresToolbar;
