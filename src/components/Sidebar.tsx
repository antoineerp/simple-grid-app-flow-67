
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
            src="/lovable-uploads/swiss-army-knife-logo.png" 
            alt="Swiss Army Knife Logo" 
            className="w-48 h-48 object-contain" 
          />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
