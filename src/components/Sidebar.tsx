
import React from 'react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems } from './sidebar/sidebarConfig';
import { PocketKnife } from 'lucide-react';  // Changed from Knife to PocketKnife

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
          <PocketKnife 
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
