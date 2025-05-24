
// Sidebar simplifié et propre
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Users, 
  FileText, 
  Settings,
  Shield,
  BookOpen,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import type { NavItem } from '@/types';

const navigationItems: NavItem[] = [
  { path: '/dashboard', label: 'Tableau de bord', icon: Home },
  { path: '/pilotage', label: 'Pilotage', icon: BarChart3 },
  { path: '/membres', label: 'Membres', icon: Users },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/bibliotheque', label: 'Bibliothèque', icon: BookOpen },
  { path: '/collaboration', label: 'Collaboration', icon: MessageSquare },
  { path: '/settings', label: 'Paramètres', icon: Settings }
];

const adminNavigationItems: NavItem[] = [
  { path: '/admin', label: 'Administration', icon: Shield }
];

export function Sidebar() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="h-full w-64 bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-xl font-bold text-gray-800">
          Qualité.cloud
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Admin Section */}
      {isAdmin && (
        <div className="border-t border-gray-200 py-4">
          <div className="px-6 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Administration
            </h3>
          </div>
          <div className="space-y-1">
            {adminNavigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-sm text-gray-600">
          <div>Connecté en tant que:</div>
          <div className="font-medium text-gray-900 truncate">
            {user?.email || 'Utilisateur'}
          </div>
          <div className="text-xs text-gray-500">
            Rôle: {user?.role}
          </div>
        </div>
      </div>
    </div>
  );
}
