
import React, { useState } from 'react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems } from './sidebar/sidebarConfig';

const Sidebar = () => {
  const [logoSrc, setLogoSrc] = useState('/lovable-uploads/ae8b819c-8d4d-4435-9e64-898ed7510077.png');
  const [logoError, setLogoError] = useState(false);

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("Swiss Army Knife logo failed to load, trying fallback");
    
    if (!logoError) {
      setLogoError(true);
      
      // Essayer avec /public/
      const publicPath = `/public${logoSrc}`;
      setLogoSrc(publicPath);
      
      // Si nous sommes sur qualiopi.ch, essayons un chemin avec le sous-dossier
      if (window.location.hostname === 'qualiopi.ch') {
        // Extraire le chemin du sous-dossier
        const pathMatch = window.location.pathname.match(/^(\/sites\/[^\/]+)/);
        if (pathMatch && pathMatch[1]) {
          const siteRootPath = `${pathMatch[1]}${logoSrc}`;
          console.log(`Logo failed, trying site root path: ${siteRootPath}`);
          setLogoSrc(siteRootPath);
        }
      }
    } else {
      // Si tout échoue, utiliser le logo SVG de secours
      setLogoSrc("/logo-swiss.svg");
    }
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
        
        <div className="mt-auto pt-8 flex items-center justify-center">
          <img 
            src={logoSrc} 
            alt="Swiss Army Knife Logo" 
            className="w-48 h-48 object-contain" 
            onError={handleLogoError}
          />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
