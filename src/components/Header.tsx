import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthHeaders, getCurrentUser, isConnected } from '@/services/auth/authService';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MenuIcon, User, LogOut, Settings, Database } from "lucide-react";
import { ModeToggle } from './ui/mode-toggle';
import SyncStatusIndicator from './common/SyncStatusIndicator';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import { forceReloadUserProfile } from '@/services/sync';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const isOnline = useNetworkStatus();
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
      const connected = await isConnected();
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>
                    <MenuIcon className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user && (
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>{user?.email}</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleForceSync} disabled={!isOnline || isSyncing}>
                <CloudSun className="mr-2 h-4 w-4" />
                <span>
                  {isSyncing ? 'Synchronisation...' : 'Forcer la synchronisation'}
                </span>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Link to="/database-test" className="flex items-center w-full">
                  <Database className="mr-2 h-4 w-4" />
                  <span>
                    {isDatabaseConnected ? 'Base de données OK' : 'Tester la base de données'}
                  </span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Link to="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
