
import React from 'react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems, adminNavigationItems } from './sidebar/sidebarConfig';
import { hasPermission, UserRole } from '@/types/roles';
import { getCurrentUser } from '@/services/auth/authService';

const Sidebar = () => {
  const sidebarImageUrl = localStorage.getItem('sidebarImageUrl') || '/lovable-uploads/swiss-army-knife-logo.png';
  const sidebarLinkUrl = localStorage.getItem('sidebarLinkUrl') || '';
  const user = getCurrentUser();
  const userRole = (user?.role || 'utilisateur') as UserRole;

  const canAccessAdmin = user && hasPermission[userRole]?.isAdmin;

  return (
    <aside className="w-64 bg-gray-50 border-r min-h-screen">
      <nav className="flex flex-col p-4">
        {/* Items de navigation standards */}
        {navigationItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
        
        {/* Items de navigation admin conditionnels */}
        {canAccessAdmin && adminNavigationItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
        
        <div className="mt-auto pt-8 flex items-center justify-center">
          {sidebarLinkUrl ? (
            <a href={sidebarLinkUrl} target="_blank" rel="noopener noreferrer">
              <img 
                src={sidebarImageUrl}
                alt="Logo personnalisé"
                className="w-24 h-auto opacity-90 transition-all duration-200"
              />
            </a>
          ) : (
            <img 
              src={sidebarImageUrl}
              alt="Logo personnalisé"
              className="w-24 h-auto opacity-90 transition-all duration-200"
            />
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
