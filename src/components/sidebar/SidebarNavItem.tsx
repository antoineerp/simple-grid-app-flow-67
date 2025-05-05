
import React from 'react';
import { NavLink } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

const SidebarNavItem = ({ to, icon: Icon, label }: SidebarNavItemProps) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center p-3 mb-1 rounded hover:bg-app-light-blue
        ${isActive ? 'active-sidebar-item' : ''}
      `}
    >
      <Icon className="mr-3 h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

export default SidebarNavItem;
