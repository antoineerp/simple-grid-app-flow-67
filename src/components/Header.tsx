
import React, { useState, useEffect } from 'react';
import { ChevronDown, LogOut, Settings, Database, Users } from 'lucide-react';
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
  getCurrentUser as getDatabaseUser,
} from '@/services/core/databaseConnectionService';
import { logout, getCurrentUser } from '@/services/auth/authService';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logo, setLogo] = useState("/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png");
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getDatabaseUser());
  
  // Obtenir les informations utilisateur depuis le token JWT
  const user = getCurrentUser();
  const userRole = user?.role || 'utilisateur';
  const userDisplayName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Utilisateur';

  useEffect(() => {
    const checkDatabaseUser = () => {
      const dbUser = getDatabaseUser();
      if (dbUser !== currentDatabaseUser) {
        setCurrentDatabaseUser(dbUser);
      }
    };
    
    const interval = setInterval(checkDatabaseUser, 2000);
    
    return () => clearInterval(interval);
  }, [currentDatabaseUser]);

  const handleLogout = () => {
    // Appel à la fonction logout du service d'authentification
    logout();
    
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
    
    // Force la navigation vers la page d'accueil
    window.location.href = '/';
  };

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
  };

  const isAdmin = userRole === 'administrateur' || userRole === 'admin';

  return (
    <header className="w-full border-b bg-white">
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
