
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, FileCheck, FileText, Users, BookOpen } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-50 border-r min-h-screen">
      <nav className="flex flex-col p-4">
        <NavLink 
          to="/pilotage" 
          className={({ isActive }) => `
            flex items-center p-3 mb-1 rounded hover:bg-app-light-blue
            ${isActive ? 'active-sidebar-item' : ''}
          `}
        >
          <BarChart2 className="mr-3 h-5 w-5" />
          <span>Pilotage</span>
        </NavLink>
        
        <NavLink 
          to="/exigences" 
          className={({ isActive }) => `
            flex items-center p-3 mb-1 rounded hover:bg-app-light-blue
            ${isActive ? 'active-sidebar-item' : ''}
          `}
        >
          <FileCheck className="mr-3 h-5 w-5" />
          <span>Exigences</span>
        </NavLink>
        
        <NavLink 
          to="/gestion-documentaire" 
          className={({ isActive }) => `
            flex items-center p-3 mb-1 rounded hover:bg-app-light-blue
            ${isActive ? 'active-sidebar-item' : ''}
          `}
        >
          <FileText className="mr-3 h-5 w-5" />
          <span>Gestion Documentaire</span>
        </NavLink>
        
        <NavLink 
          to="/ressources-humaines" 
          className={({ isActive }) => `
            flex items-center p-3 mb-1 rounded hover:bg-app-light-blue
            ${isActive ? 'active-sidebar-item' : ''}
          `}
        >
          <Users className="mr-3 h-5 w-5" />
          <span>Ressources Humaines</span>
        </NavLink>
        
        <NavLink 
          to="/bibliotheque" 
          className={({ isActive }) => `
            flex items-center p-3 mb-1 rounded hover:bg-app-light-blue
            ${isActive ? 'active-sidebar-item' : ''}
          `}
        >
          <BookOpen className="mr-3 h-5 w-5" />
          <span>Bibliothèque</span>
        </NavLink>
        
        <div className="mt-auto pt-8 flex items-center justify-center">
          <img 
            src="/lovable-uploads/swiss-army-knife-logo.png" 
            alt="Qualite.cloud Logo" 
            className="w-10 h-10 object-contain" 
          />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
