import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  BookOpen,
  LayoutDashboard,
  ListChecks,
  UserCog,
  Building2
} from 'lucide-react';
import { authService } from '@/services';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

const MainLayout: React.FC = () => {
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
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar}>
        <Sidebar.Header>
          <Button variant="ghost" onClick={toggleSidebar}>
            FormaCert
          </Button>
        </Sidebar.Header>
        <Sidebar.Body>
          <Sidebar.Nav>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "active-link" : ""}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Tableau de bord
            </NavLink>
            <NavLink to="/documents" className={({isActive}) => isActive ? "active-link" : ""}>
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </NavLink>
            <NavLink to="/exigences" className={({isActive}) => isActive ? "active-link" : ""}>
              <ListChecks className="h-4 w-4 mr-2" />
              Exigences
            </NavLink>
            <NavLink to="/ressources-humaines" className={({isActive}) => isActive ? "active-link" : ""}>
              <Building2 className="h-4 w-4 mr-2" />
              Ressources Humaines
            </NavLink>
            {getCurrentUser() === 'p71x6d_richard' && (
              <NavLink to="/admin/users" className={({isActive}) => isActive ? "active-link" : ""}>
                <Users className="h-4 w-4 mr-2" />
                Gestion des utilisateurs
              </NavLink>
            )}
            <NavLink to="/api-docs" className={({isActive}) => isActive ? "active-link" : ""}>
              <BookOpen className="h-4 w-4 mr-2" />
              Documentation API
            </NavLink>
          </Sidebar.Nav>
        </Sidebar.Body>
        <Sidebar.Footer>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </Sidebar.Footer>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
