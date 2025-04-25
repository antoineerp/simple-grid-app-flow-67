
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/services/auth/authService';
import { isConnectedToDatabase } from '@/services/core/databaseConnectionService';
import { forceReloadUserProfile } from '@/services/sync';

export const useHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    const checkDatabaseConnection = async () => {
      const connected = await isConnectedToDatabase();
      setIsDatabaseConnected(connected);
    };
    
    checkDatabaseConnection();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncError(false);
    
    try {
      await forceReloadUserProfile();
      setLastSynced(new Date());
      console.log("✅ Synchronisation manuelle réussie");
    } catch (error) {
      console.error("❌ Erreur lors de la synchronisation manuelle:", error);
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    user,
    isDatabaseConnected,
    isSyncing,
    lastSynced,
    syncError,
    handleLogout,
    handleForceSync
  };
};
