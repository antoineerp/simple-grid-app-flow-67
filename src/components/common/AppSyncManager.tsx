
import React, { useState, useEffect } from 'react';

// Interface for the component props
interface AppSyncManagerProps {
  showControls?: boolean;
  className?: string;
  enableDebugger?: boolean;
}

// Export the component with correct name
export function AppSyncManager({
  showControls = true,
  className = '',
  enableDebugger = false
}: AppSyncManagerProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Handle sync status updates
  useEffect(() => {
    const updateSyncStatus = (event: CustomEvent) => {
      setSyncStatus(event.detail.status);
      if (event.detail.status === 'success') {
        setLastSync(new Date());
      }
    };

    // Add event listener for sync status updates
    window.addEventListener('syncStatusChanged', updateSyncStatus as EventListener);
    
    // Set up periodic sync check
    const intervalId = setInterval(() => {
      console.log('Checking sync status...');
      // Sync check logic here
    }, 30000); // Check every 30 seconds
    
    // Properly clean up the interval on unmount
    return () => {
      window.removeEventListener('syncStatusChanged', updateSyncStatus as EventListener);
      clearInterval(intervalId);
    };
  }, []);

  // Trigger manual sync
  const triggerSync = () => {
    setSyncStatus('syncing');
    // Sync logic would go here
    console.log('Manual sync triggered');
    
    // Simulate sync completion
    setTimeout(() => {
      setSyncStatus('success');
      setLastSync(new Date());
    }, 1500);
  };

  return (
    <div className={`sync-manager ${className}`}>
      {showControls && (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2">
            <div 
              className={`h-3 w-3 rounded-full ${
                syncStatus === 'idle' ? 'bg-gray-300' :
                syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
                syncStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm">
              {syncStatus === 'idle' ? 'En attente' :
               syncStatus === 'syncing' ? 'Synchronisation...' :
               syncStatus === 'success' ? 'Synchronisé' : 'Erreur de synchronisation'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="text-xs text-gray-500">
                Dernière sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={triggerSync}
              disabled={syncStatus === 'syncing'}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              Synchroniser
            </button>
          </div>
        </div>
      )}
      
      {!showControls && (
        <div className="flex items-center justify-end text-xs text-gray-500">
          <div className={`h-2 w-2 rounded-full mr-1 ${
            syncStatus === 'success' ? 'bg-green-500' : 
            syncStatus === 'error' ? 'bg-red-500' : 
            syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
          }`} />
          {lastSync ? `Dernière sync: ${lastSync.toLocaleTimeString()}` : 'Jamais synchronisé'}
        </div>
      )}
      
      {enableDebugger && (
        <div className="mt-2 text-xs bg-gray-50 p-2 rounded-md">
          <details>
            <summary>Debug Sync Info</summary>
            <div className="mt-2 space-y-1">
              <p>Status: {syncStatus}</p>
              <p>Last Sync: {lastSync ? lastSync.toISOString() : 'N/A'}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// Default export as well for convenience
export default AppSyncManager;
