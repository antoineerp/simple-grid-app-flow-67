
import React, { useState } from 'react';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
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
import { logout, getCurrentUser } from '@/services/auth/authService';
import { UserRole, checkPermission } from '@/types/roles';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logo, setLogo] = useState("/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png");
  const { isOnline } = useNetworkStatus();
  
  // Obtenir l'ID utilisateur depuis le service d'authentification
  const userId = getCurrentUser();
  
  // Utiliser le rôle stocké dans localStorage 
  const userRole = (localStorage.getItem('userRole') || 'utilisateur') as UserRole;
  console.log("Header: rôle utilisateur détecté:", userRole);
  
  // Utiliser un nom d'affichage par défaut
  const userDisplayName = 'Utilisateur';

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

  const handleAdminNavigation = () => {
    console.log("Navigation vers l'administration demandée");
    try {
      navigate('/administration');
    } catch (error) {
      console.error("Erreur lors de la navigation vers l'administration:", error);
      // Fallback en cas d'échec de la navigation
      window.location.href = '/administration';
    }
  };

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
  };

  const canAccessAdminPanel = checkPermission(userRole, 'isAdmin');
  console.log("Header: permission d'accès à l'administration:", canAccessAdminPanel);

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
          {/* Indicateur de statut de connexion */}
          <div className={`px-2 py-1 rounded-full text-xs ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-app-blue text-white">
                    {userRole === 'admin' ? 'AD' : userRole === 'gestionnaire' ? 'GE' : 'UT'}
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

              {canAccessAdminPanel && (
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleAdminNavigation}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Administration</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
              {canAccessAdminPanel && <DropdownMenuSeparator />}
              
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
