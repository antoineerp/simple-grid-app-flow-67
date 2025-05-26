
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
  Building2,
  BarChart3,
  Users,
  Handshake
} from 'lucide-react';
import { authService } from '@/services/auth/authService';
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
          <h1 className={`font-bold text-lg ${!isSidebarOpen && 'hidden'}`}>Qualité.cloud</h1>
          <Button variant="ghost" size="sm" onClick={toggleSidebar}>
            {isSidebarOpen ? '←' : '→'}
          </Button>
        </div>
        
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <NavLink to="/pilotage" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <BarChart3 className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Pilotage</span>}
            </NavLink>
            
            <NavLink to="/exigences" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <ListChecks className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Exigences</span>}
            </NavLink>
            
            <NavLink to="/gestion-documentaire" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <FileText className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Gestion Documentaire</span>}
            </NavLink>
            
            <NavLink to="/ressources-humaines" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <Users className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Ressources Humaines</span>}
            </NavLink>
            
            <NavLink to="/collaboration" className={({isActive}) => 
              `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }>
              <Handshake className="h-4 w-4 mr-2" />
              {isSidebarOpen && <span>Collaboration</span>}
            </NavLink>
            
            {getCurrentUser() === 'p71x6d_richard' && (
              <NavLink to="/admin" className={({isActive}) => 
                `flex items-center p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
              }>
                <Building2 className="h-4 w-4 mr-2" />
                {isSidebarOpen && <span>Administration</span>}
              </NavLink>
            )}
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
