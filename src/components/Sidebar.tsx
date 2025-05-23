
import React from 'react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import { navigationItems, adminNavigationItems } from './sidebar/sidebarConfig';
import { getCurrentUser } from '@/services/auth/authService';
import { useAuth } from '@/hooks/useAuth';
import { checkPermission } from '@/types/roles';
import { UserRole } from '@/types/roles';

const Sidebar = () => {
  // Utilisation d'une URL absolue pour l'image
  const sidebarImageUrl = 'https://qualite.cloud/assets/images/logo-qualite-cloud.png';
  const sidebarLinkUrl = 'https://qualite.cloud';
  const userId = getCurrentUser();
  const { user } = useAuth();
  
  // Get user role from context or localStorage as fallback
  const userRoleString = user?.role || localStorage.getItem('userRole') || 'utilisateur';
  
  // Convert string to UserRole type
  const userRole = userRoleString as UserRole;
  
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
        
        {/* Items de navigation pour administrateurs uniquement */}
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
              onError={(e) => {
                console.log("Erreur de chargement de l'image du sidebar");
                const target = e.target as HTMLImageElement;
                // Fallback vers une autre image ou masquer en cas d'erreur
                target.style.display = 'none';
              }}
            />
          </a>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
