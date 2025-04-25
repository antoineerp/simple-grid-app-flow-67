
import React, { useState, useEffect } from 'react';
import { ChevronDown, Upload, LogOut, Settings, Database, Users, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import LogoSelector from './LogoSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getCurrentUser
} from '@/services/core/databaseConnectionService';
import SyncStatusIndicator from './common/SyncStatusIndicator';
import { forceReloadUserProfile } from '@/services/sync/userProfileSync';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logo, setLogo] = useState(() => {
    const savedLogo = localStorage.getItem('appLogo');
    return savedLogo || "/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png";
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('userRole') || 'utilisateur';
  });
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getCurrentUser());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  
  // New state for storing user display name
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    // Try to get user name from localStorage, fallback to technical identifier
    return localStorage.getItem('userName') || 
           localStorage.getItem('currentUser') || 
           'Utilisateur';
  });

  useEffect(() => {
    localStorage.setItem('appLogo', logo);
    
    const checkDatabaseUser = () => {
      const dbUser = getCurrentUser();
      if (dbUser !== currentDatabaseUser) {
        setCurrentDatabaseUser(dbUser);
      }
    };
    
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    const interval = setInterval(checkDatabaseUser, 2000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [logo, currentDatabaseUser]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentDatabaseUser');
    localStorage.removeItem('userName');
    
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
    
    navigate('/');
  };

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
  };
  
  const handleForceSync = async () => {
    if (isOnline) {
      setIsSyncing(true);
      try {
        await forceReloadUserProfile();
        setLastSynced(new Date());
        toast({
          title: "Synchronisation terminée",
          description: "Vos données ont été rechargées depuis le serveur",
        });
      } catch (error) {
        toast({
          title: "Échec de la synchronisation",
          description: "Impossible de recharger vos données",
          variant: "destructive"
        });
      } finally {
        setIsSyncing(false);
      }
    } else {
      toast({
        title: "Hors ligne",
        description: "Impossible de synchroniser en mode hors ligne",
        variant: "destructive"
      });
    }
  };

  const isAdmin = userRole === 'administrateur' || userRole === 'admin';

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center w-full">
          <LogoSelector currentLogo={logo} onLogoChange={handleLogoChange} />
          <div className="text-app-blue text-xl font-semibold text-center w-full absolute left-0">
            Qualite.cloud - Système de Management de la Qualité
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {currentDatabaseUser && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
              <Database className="w-3 h-3 mr-1" />
              <span>DB: {currentDatabaseUser}</span>
            </div>
          )}
          
          <div className="cursor-pointer" onClick={handleForceSync}>
            <SyncStatusIndicator 
              isSyncing={isSyncing} 
              isOnline={isOnline}
              lastSynced={lastSynced}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-app-blue text-white">
                    {isAdmin ? 'AD' : userRole === 'gestionnaire' ? 'GE' : 'UT'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium block">{userDisplayName}</span>
                  <span className="text-xs text-gray-500 block">{userRole}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {isAdmin && (
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/administration')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Administration</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
              {isAdmin && <DropdownMenuSeparator />}
              
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
