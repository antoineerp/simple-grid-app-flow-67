
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  
  useEffect(() => {
    // Vérifier l'authentification qu'une seule fois au premier chargement
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      console.log('Auth status initial check:', isLoggedIn ? 'Logged in' : 'Not logged in');
      console.log('Current path:', location.pathname);
      
      setIsAuthenticated(isLoggedIn);
      
      // Marquer la vérification initiale comme terminée
      setInitialCheckComplete(true);
      
      return isLoggedIn;
    };
    
    checkAuth();
  }, []);
  
  // Gérer les redirections une fois la vérification initiale terminée
  useEffect(() => {
    if (!initialCheckComplete) return;
    
    if (isAuthenticated === false && location.pathname !== '/') {
      console.log('Redirecting to home page from', location.pathname);
      navigate('/');
    } else if (isAuthenticated === true && location.pathname === '/') {
      console.log('Redirecting to dashboard from home page');
      navigate('/pilotage');
    }
  }, [isAuthenticated, location.pathname, initialCheckComplete, navigate]);

  // Afficher un loader pendant la vérification initiale
  if (!initialCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  // Si nous sommes sur la page d'accueil et non authentifié, ne pas afficher le header, sidebar et footer
  if (location.pathname === '/' && !isAuthenticated) {
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
