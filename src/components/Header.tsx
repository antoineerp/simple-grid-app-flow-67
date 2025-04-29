
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser, logout } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent } from "@/components/ui/sheet";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const user = getCurrentUser();
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
    navigate('/');
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const navigateAndCloseMobile = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
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
          <div className="text-xl font-bold text-gray-800 mr-10">QualiOpi</div>
          
          {/* Menu de navigation - Desktop */}
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
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Administration
              </button>
            )}
          </nav>
        </div>
        
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
          
          {/* Bouton de menu mobile */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileMenu}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Menu mobile */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[250px] sm:w-[300px]">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center py-4 border-b">
              <span className="font-bold text-lg">QualiOpi</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col space-y-4 pt-4">
              <button 
                onClick={() => navigateAndCloseMobile('/pilotage')}
                className="text-left px-2 py-2 hover:bg-gray-100 rounded-md"
              >
                Tableau de bord
              </button>
              <button 
                onClick={() => navigateAndCloseMobile('/gestion-documentaire')}
                className="text-left px-2 py-2 hover:bg-gray-100 rounded-md"
              >
                Gestion documentaire
              </button>
              <button 
                onClick={() => navigateAndCloseMobile('/exigences')}
                className="text-left px-2 py-2 hover:bg-gray-100 rounded-md"
              >
                Exigences
              </button>
              {isManagerOrAdmin && (
                <button 
                  onClick={() => navigateAndCloseMobile('/ressources-humaines')}
                  className="text-left px-2 py-2 hover:bg-gray-100 rounded-md"
                >
                  Ressources humaines
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={() => navigateAndCloseMobile('/admin')}
                  className="text-left px-2 py-2 hover:bg-gray-100 rounded-md"
                >
                  Administration
                </button>
              )}
            </nav>
            <div className="mt-auto border-t py-4">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-2 py-2 text-red-500 hover:bg-red-50 rounded-md"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Header;
