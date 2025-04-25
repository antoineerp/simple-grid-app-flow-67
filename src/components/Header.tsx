
import React from 'react';
import { Link } from 'react-router-dom';
import { ModeToggle } from '@/components/ui/mode-toggle';
import SyncStatusIndicator from './common/SyncStatusIndicator';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useHeader } from '@/hooks/useHeader';
import UserMenu from './header/UserMenu';

const Header: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const {
    user,
    isDatabaseConnected,
    isSyncing,
    lastSynced,
    syncError,
    handleLogout,
    handleForceSync
  } = useHeader();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/pilotage" className="text-xl font-semibold dark:text-white">
          Dashboard
        </Link>

        <div className="flex items-center space-x-4">
          <SyncStatusIndicator
            isSyncing={isSyncing}
            isOnline={isOnline}
            lastSynced={lastSynced}
            hasError={syncError}
          />
          
          <ModeToggle />
          
          <UserMenu 
            user={user}
            isDatabaseConnected={isDatabaseConnected}
            handleForceSync={handleForceSync}
            handleLogout={handleLogout}
            isOnline={isOnline}
            isSyncing={isSyncing}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
