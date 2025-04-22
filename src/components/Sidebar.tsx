
import React, { useState } from 'react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems } from './sidebar/sidebarConfig';

const Sidebar = () => {
  const [logoSrc, setLogoSrc] = useState('/lovable-uploads/50481013-f813-47b1-84d2-82c297771514.png');
  const [logoError, setLogoError] = useState(false);

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("Swiss Army Knife logo failed to load, trying fallback");
    
    if (!logoError) {
      setLogoError(true);
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
