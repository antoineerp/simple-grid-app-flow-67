
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
  
  console.log('Sidebar - User role:', userRole, 'User:', user);

  return (
    <div className="h-full w-64 bg-white shadow-lg flex flex-col">
      {/* Header avec logo */}
      <div className="p-6 border-b border-gray-200">
        <a 
          href={sidebarLinkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <img 
            src={sidebarImageUrl} 
            alt="Qualite.cloud" 
            className="h-8 w-auto mx-auto"
            onError={(e) => {
              console.log('Logo image failed to load, showing text instead');
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.style.display = 'block';
            }}
          />
          <div className="text-lg font-semibold text-gray-800 text-center hidden">
            Qualite.cloud
          </div>
        </a>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 py-4 space-y-1">
        {navigationItems.map((item) => (
          <SidebarNavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Navigation Admin - UNIQUEMENT pour les admins */}
      {checkPermission(userRole, 'manage_users') && (
        <div className="border-t border-gray-200 py-4">
          <div className="px-6 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Administration
            </h3>
          </div>
          <div className="space-y-1">
            {adminNavigationItems.map((item) => (
              <SidebarNavItem key={item.path} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Footer avec utilisateur connecté */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-sm text-gray-600">
          <div>Connecté en tant que:</div>
          <div className="font-medium text-gray-900 truncate">
            {user?.email || userId || 'Utilisateur'}
          </div>
          <div className="text-xs text-gray-500">
            Rôle: {userRole}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
