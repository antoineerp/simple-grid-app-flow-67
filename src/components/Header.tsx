
import React, { useState, useEffect } from 'react';
import { ChevronDown, Upload, LogOut, Settings, Database, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logo, setLogo] = useState(() => {
    const savedLogo = localStorage.getItem('appLogo');
    return savedLogo || "/lovable-uploads/4425c340-2ce3-416b-abc9-b75906ca8705.png";
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('userRole') || 'utilisateur';
  });

  useEffect(() => {
    localStorage.setItem('appLogo', logo);
  }, [logo]);

  const handleLogout = () => {
    // Supprimer l'information de connexion
    localStorage.removeItem('isLoggedIn');
    
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
    
    // Rediriger vers la page de connexion
    navigate('/');
  };

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
  };

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center">
          <LogoSelector currentLogo={logo} onLogoChange={handleLogoChange} />
          <Link to="/pilotage" className="text-app-blue text-xl font-semibold ml-4">
            Qualite.cloud - Système de Management de la Qualité
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-app-blue text-white">
                    {userRole === 'administrateur' ? 'AD' : userRole === 'gestionnaire' ? 'GE' : 'UT'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium block">p71x6d_system</span>
                  <span className="text-xs text-gray-500 block">{userRole}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                
                {(userRole === 'administrateur' || userRole === 'admin') && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/administration')}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Administration</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Database className="mr-2 h-4 w-4" />
                      <span>Base de données</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
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
