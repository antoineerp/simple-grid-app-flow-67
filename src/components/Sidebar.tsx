
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems } from './sidebar/sidebarConfig';
import { hasPermission } from '@/types/roles';
import { getCurrentUser } from '@/services/auth/authService';
import { Settings } from 'lucide-react';

const Sidebar = () => {
  const [sidebarImageUrl, setSidebarImageUrl] = useState('');
  const [sidebarLinkUrl, setSidebarLinkUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const user = getCurrentUser();
  const userRole = (user?.role || 'utilisateur');
  const isAdmin = hasPermission(userRole as any, 'accessAdminPanel');
  
  useEffect(() => {
    try {
      // Détection d'environnement plus robuste
      const isLovableEnv = window.location.hostname.includes('lovable');
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Utiliser un préfixe conditionnel basé sur l'environnement
      const prefix = isLovableEnv ? "/public" : "";
      
      // Image par défaut avec gestion de l'environnement
      const defaultImage = isDevelopment 
        ? "/lovable-uploads/swiss-army-knife-logo.png"
        : `${prefix}/lovable-uploads/swiss-army-knife-logo.png`;
      
      // Récupérer les données du localStorage ou utiliser les valeurs par défaut
      const storedImageUrl = localStorage.getItem('sidebarImageUrl');
      const storedLinkUrl = localStorage.getItem('sidebarLinkUrl');
      
      // Appliquer le préfixe au chemin stocké si nécessaire pour Lovable
      let imageUrl = storedImageUrl || defaultImage;
      if (isLovableEnv && imageUrl && !imageUrl.startsWith('/public/')) {
        imageUrl = `/public${imageUrl}`;
      }
      
      setSidebarImageUrl(imageUrl);
      setSidebarLinkUrl(storedLinkUrl || '');
      
      console.log("Sidebar - Image URL définie:", imageUrl);
    } catch (e) {
      console.error("Erreur lors de l'initialisation du Sidebar:", e);
      setImageError(true);
    }
  }, []);

  // Handle image error
  const handleImageError = () => {
    console.error("Sidebar image failed to load:", sidebarImageUrl);
    setImageError(true);
    
    // Essayer plusieurs chemins alternatifs
    const isLovableEnv = window.location.hostname.includes('lovable');
    const fallbackImages = [
      isLovableEnv ? "/public/lovable-uploads/swiss-army-knife-logo.png" : "/lovable-uploads/swiss-army-knife-logo.png",
      isLovableEnv ? "/public/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png" : "/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png"
    ];
    
    // Essayer le premier chemin alternatif
    setSidebarImageUrl(fallbackImages[0]);
  };

  return (
    <aside className="w-64 bg-gray-50 border-r min-h-screen">
      <nav className="flex flex-col p-4">
        {navigationItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
        
        {/* Ajout du bouton d'administration si l'utilisateur a les droits */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <SidebarNavItem
              to="/administration"
              icon={Settings}
              label="Administration"
            />
          </div>
        )}
        
        <div className="mt-auto pt-8 flex items-center justify-center">
          {!imageError && sidebarImageUrl ? (
            sidebarLinkUrl ? (
              <a href={sidebarLinkUrl} target="_blank" rel="noopener noreferrer">
                <img 
                  src={sidebarImageUrl}
                  alt="Logo personnalisé"
                  className="w-24 h-auto opacity-90 transition-all duration-200"
                  onError={handleImageError}
                />
              </a>
            ) : (
              <img 
                src={sidebarImageUrl}
                alt="Logo personnalisé"
                className="w-24 h-auto opacity-90 transition-all duration-200"
                onError={handleImageError}
              />
            )
          ) : (
            <div className="w-24 h-24 flex items-center justify-center text-gray-400">
              <span className="text-sm">Logo non disponible</span>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
