
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  active?: boolean; // Ajout de la propriété active comme optionnelle
}

const SidebarNavItem = ({ to, icon: Icon, label, active }: SidebarNavItemProps) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center p-3 mb-1 rounded hover:bg-app-light-blue
        ${active || isActive ? 'active-sidebar-item' : ''}
      `}
    >
      <Icon className="mr-3 h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

export default SidebarNavItem;
