
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { MembresProvider } from '@/contexts/MembresContext';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsAuthenticated(isLoggedIn);
    
    // Si l'utilisateur n'est pas connecté et n'est pas déjà sur la page d'accueil, rediriger vers la page d'accueil
    if (!isLoggedIn && location.pathname !== '/') {
      navigate('/');
    }
  }, [navigate, location.pathname]);

  // If we are on the home page or not authenticated, don't show header, sidebar, and footer
  if (location.pathname === '/' || !isAuthenticated) {
    return <Outlet />;
  }

  return (
    <MembresProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 bg-gray-50 overflow-auto">
            <Outlet />
          </main>
        </div>
        <Footer />
      </div>
    </MembresProvider>
  );
};

export default Layout;
