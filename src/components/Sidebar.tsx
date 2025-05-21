
import React from 'react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems, adminNavigationItems } from './sidebar/sidebarConfig';
import { getCurrentUser } from '@/services/auth/authService';
import { useAuth } from '@/hooks/useAuth';
import { checkPermission } from '@/types/roles';

const Sidebar = () => {
  const sidebarImageUrl = '/lovable-uploads/c6d7246d-1cb1-4d6c-8579-dd12df4a1047.png';
  const sidebarLinkUrl = 'https://qualite.cloud';
  const userId = getCurrentUser();
  const { user } = useAuth();
  
  // Get user role from context or localStorage as fallback
  const userRole = user?.role || localStorage.getItem('userRole') || 'utilisateur';
  
  // Check if user has admin permissions
  const isAdmin = checkPermission(userRole, 'isAdmin');

  return (
    <aside className="w-64 bg-gray-50 border-r h-full overflow-y-auto">
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
        
        {/* Items de navigation pour administrateurs */}
        {isAdmin && adminNavigationItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
        
        <div className="mt-auto pt-8 flex items-center justify-center">
          <a href={sidebarLinkUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={sidebarImageUrl}
              alt="Qualite.cloud - Couteau suisse de la qualité"
              className="w-32 h-auto opacity-90 transition-all duration-200 hover:opacity-100"
            />
          </a>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
