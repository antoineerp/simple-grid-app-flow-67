
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { MembresProvider } from '@/contexts/MembresContext';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const isLoggedIn = token !== null;
      
      console.log('Auth status:', isLoggedIn ? 'Logged in' : 'Not logged in');
      console.log('Current path:', location.pathname);
      console.log('Auth token exists:', !!token);
      
      setIsAuthenticated(isLoggedIn);
      
      // Si l'utilisateur n'est pas connecté et n'est pas déjà sur la page d'accueil, rediriger vers la page d'accueil
      if (!isLoggedIn && location.pathname !== '/') {
        console.log('Redirecting to home page from', location.pathname);
        navigate('/');
      } else if (isLoggedIn && location.pathname === '/') {
        // Si l'utilisateur est connecté et se trouve sur la page d'accueil, rediriger vers le tableau de bord
        console.log('Redirecting to dashboard from home page');
        navigate('/pilotage');
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate, location.pathname]);

  // Si le composant est en cours de chargement, afficher un loader ou rien
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  // Si nous sommes sur la page d'accueil ou non authentifié, ne pas afficher le header, sidebar et footer
  if (location.pathname === '/' || !isAuthenticated) {
    return children || <Outlet />;
  }

  return (
    <MembresProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 bg-gray-50 overflow-auto">
            {children || <Outlet />}
          </main>
        </div>
        <Footer />
      </div>
    </MembresProvider>
  );
};

export default Layout;
