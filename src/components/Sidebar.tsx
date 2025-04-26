
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  MountainSnow, 
  BookOpen, 
  FileText, 
  Users, 
  Settings, 
  Library,
  Check,
  ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { 
      path: '/pilotage', 
      label: 'Pilotage', 
      icon: <MountainSnow className="h-5 w-5" /> 
    },
    { 
      path: '/exigences', 
      label: 'Exigences', 
      icon: <BookOpen className="h-5 w-5" /> 
    },
    { 
      path: '/gestion-documentaire', 
      label: 'Gestion Documentaire', 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      path: '/ressources-humaines', 
      label: 'Ressources Humaines', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      path: '/collaboration', 
      label: 'Collaboration', 
      icon: <Library className="h-5 w-5" /> 
    },
    { 
      path: '/verification-routes', 
      label: 'Vérification des Routes', 
      icon: <Check className="h-5 w-5" /> 
    },
    { 
      path: '/administration', 
      label: 'Administration', 
      icon: <Settings className="h-5 w-5" /> 
    }
  ];

  return (
    <aside className={cn(
      "bg-gray-900 text-white transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex justify-end p-4">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white p-1 rounded-full"
        >
          <ChevronRight className={cn(
            "h-5 w-5 transition-transform",
            isCollapsed ? "rotate-180" : ""
          )} />
        </button>
      </div>
      
      <nav className="mt-2">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center py-3 px-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-app-blue text-white" 
                    : "text-gray-300 hover:bg-gray-800",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                {item.icon}
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
