
import React from 'react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems } from './sidebar/sidebarConfig';

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
          <img 
            src="/lovable-uploads/fa423773-b335-4b1a-8ba6-56b7a83123e3.png"
            alt="Qualite.cloud Swiss Army Knife"
            className="w-24 h-auto opacity-90 transition-all duration-200" // était w-16, maintenant w-24
          />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
