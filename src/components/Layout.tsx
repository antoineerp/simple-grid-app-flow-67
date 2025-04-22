
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
  
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = localStorage.getItem('authToken') !== null;
    const token = localStorage.getItem('authToken');
    
    console.log('Auth status:', isLoggedIn ? 'Logged in' : 'Not logged in');
    console.log('Current path:', location.pathname);
    
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
  }, [navigate, location.pathname]);

  // If we are on the home page or not authenticated, don't show header, sidebar, and footer
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
