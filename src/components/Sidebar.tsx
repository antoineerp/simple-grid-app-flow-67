
import React from 'react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems } from './sidebar/sidebarConfig';
import { Knife } from 'lucide-react';  // Importation de l'icône de couteau suisse

const Sidebar = () => {
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
          <Knife 
            size={64} 
            strokeWidth={1.5} 
            className="text-gray-600 opacity-70"
          />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

