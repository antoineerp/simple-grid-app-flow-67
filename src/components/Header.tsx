
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser, logout } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const user = getCurrentUser();
  const [imageError, setImageError] = useState(false);
  const logoPath = "/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png";
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
    navigate('/');
  };

  // Vérifier si l'utilisateur est administrateur
  const isAdmin = user && typeof user === 'object' && user.role === 'administrateur';
  
  // Vérifier si l'utilisateur est gestionnaire ou administrateur
  const isManagerOrAdmin = user && typeof user === 'object' && 
    (user.role === 'gestionnaire' || user.role === 'administrateur');
  
  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-4 py-2 sticky top-0 z-50 border-b">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo et titre */}
        <div className="flex items-center">
          {!imageError ? (
            <img 
              src={logoPath}
              alt="Formacert Logo" 
              className="h-10 mr-3"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-10 mr-3 flex items-center justify-center">
              <span className="text-xl font-bold text-app-blue">FormaCert</span>
            </div>
          )}
          <div className="text-xl font-bold text-gray-800">QualiOpi</div>
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex space-x-6">
          <button 
            onClick={() => navigate('/pilotage')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Tableau de bord
          </button>
          <button 
            onClick={() => navigate('/gestion-documentaire')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Gestion documentaire
          </button>
          <button 
            onClick={() => navigate('/exigences')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Exigences
          </button>
          {isManagerOrAdmin && (
            <button 
              onClick={() => navigate('/ressources-humaines')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Ressources humaines
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => navigate('/administration')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Administration
            </button>
          )}
        </nav>
        
        {/* Actions utilisateur */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform -translate-y-1/2 translate-x-1/2"></span>
          </Button>
          
          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user && typeof user === 'object' && (
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.nom} {user.prenom}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
