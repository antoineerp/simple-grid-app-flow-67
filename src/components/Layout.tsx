
import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { MembresProvider } from '@/contexts/MembresContext';
import { getIsLoggedIn, getAuthToken, getCurrentUser } from '@/services/auth/authService';
import { initializeCurrentUser } from '@/services/core/databaseConnectionService';
import GlobalSyncManager from './common/GlobalSyncManager';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Utilisation de useCallback pour éviter les re-rendus inutiles
  const checkAuth = useCallback(() => {
    const isLoggedIn = getIsLoggedIn();
    const hasToken = !!getAuthToken();
    const user = getCurrentUser();
    
    console.log('Auth status:', isLoggedIn ? 'Logged in' : 'Not logged in');
    console.log('Current path:', location.pathname);
    console.log('Auth token exists:', hasToken);
    console.log('Current user:', user);
    
    setIsAuthenticated(isLoggedIn && hasToken);
    
    // Si l'utilisateur n'est pas connecté et n'est pas déjà sur la page d'accueil, rediriger vers la page d'accueil
    if ((!isLoggedIn || !hasToken) && location.pathname !== '/') {
      console.log('Redirecting to home page from', location.pathname);
      navigate('/', { replace: true });
    } else if (isLoggedIn && hasToken && location.pathname === '/' && !isLoading) {
      // Si l'utilisateur est connecté et se trouve sur la page d'accueil, rediriger vers le tableau de bord
      console.log('Redirecting to dashboard from home page');
      navigate('/pilotage', { replace: true });
    }
    
    setIsLoading(false);
  }, [navigate, location.pathname, isLoading]);
  
  useEffect(() => {
    // Initialiser l'utilisateur courant pour la base de données
    initializeCurrentUser();
    
    // Vérifier si l'utilisateur est connecté
    checkAuth();
    
    // Pas de dépendance à checkAuth car elle est déjà mémorisée avec useCallback
  }, [location.pathname, checkAuth]);

  // Si le composant est en cours de chargement, afficher un loader ou rien
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
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
            {/* Ajouter le gestionnaire de synchronisation global en haut de chaque page */}
            {isAuthenticated && (
              <div className="p-2 border-b bg-white shadow-sm">
                <GlobalSyncManager showControls={false} showStatus={true} />
              </div>
            )}
            {children || <Outlet />}
          </main>
        </div>
        <Footer />
      </div>
    </MembresProvider>
  );
};

export default Layout;
