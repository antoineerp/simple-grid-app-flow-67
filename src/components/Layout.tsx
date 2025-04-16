
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

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

  // Si nous sommes sur la page d'accueil ou non authentifié, ne pas afficher le header et la sidebar
  if (location.pathname === '/' || !isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
