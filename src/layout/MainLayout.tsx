
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  LogOut, 
  BookOpen,
  LayoutDashboard,
  ListChecks,
  Building2
} from 'lucide-react';
import { authService } from '@/services';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de l'application.",
    });
    navigate('/');
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-700">
      {/* Sidebar */}
      <aside className={`bg-gray-800 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4 flex justify-between items-center">
          <h1 className={`font-bold text-lg ${!isSidebarOpen && 'hidden'}`}>FormaCert</h1>
          <Button variant="ghost" size="sm" onClick={toggleSidebar}>
            {isSidebarOpen ? '←' : '→'}
          </Button>
        </div>
        
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <NavLink to="/dashboard" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Tableau de bord</span>}
            </NavLink>
            
            <NavLink to="/documents" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <FileText className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Documents</span>}
            </NavLink>
            
            <NavLink to="/exigences" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <ListChecks className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Exigences</span>}
            </NavLink>
            
            <NavLink to="/ressources-humaines" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <Building2 className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Ressources Humaines</span>}
            </NavLink>
            
            {getCurrentUser() === 'p71x6d_richard' && (
              <NavLink to="/admin" className={({isActive}) => 
                `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
              }>
                <Building2 className="h-4 w-4 mr-2" />
                {isSidebarOpen && <span>Administration</span>}
              </NavLink>
            )}
            
            <NavLink to="/api-docs" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <BookOpen className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Documentation API</span>}
            </NavLink>
          </div>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-white">
            <LogOut className="h-4 w-4 mr-2" />
            {isSidebarOpen && <span>Déconnexion</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
