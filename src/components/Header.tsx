
import React, { useState, useEffect } from 'react';
import { ChevronDown, Upload, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import LogoSelector from './LogoSelector';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logo, setLogo] = useState(() => {
    const savedLogo = localStorage.getItem('appLogo');
    return savedLogo || "/lovable-uploads/4425c340-2ce3-416b-abc9-b75906ca8705.png";
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
          <div className="flex items-center space-x-1 cursor-pointer">
            <span className="text-sm font-medium">p71x6d_system</span>
            <ChevronDown className="w-4 h-4" />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
