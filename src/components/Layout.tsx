
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { MembresProvider } from '@/contexts/MembresContext';
import { getIsLoggedIn, getAuthToken, getCurrentUser } from '@/services/auth/authService';
import { initializeCurrentUser } from '@/services/core/databaseConnectionService';
import { triggerSync } from '@/services/sync/triggerSync';
import SyncIndicator from './common/SyncIndicator';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    isOnline: navigator.onLine,
    syncFailed: false,
    lastSynced: null as Date | null
  });
  
  // Gestionnaire d'événements pour l'état de la connexion
  useEffect(() => {
    const handleOnlineStatus = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  
  useEffect(() => {
    // Initialiser l'utilisateur courant pour la base de données
    initializeCurrentUser();
    
    // Vérifier si l'utilisateur est connecté
    const checkAuth = () => {
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
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate]);

  // Synchronisation globale des données en attente
  const handleSyncAll = async (): Promise<void> => {
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      const results = await triggerSync.synchronizeAllPending();
      setSyncStatus({
        isSyncing: false,
        isOnline: navigator.onLine,
        syncFailed: Object.values(results).includes(false),
        lastSynced: new Date()
      });
      return Promise.resolve();
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false, syncFailed: true }));
      console.error("Erreur lors de la synchronisation globale:", error);
      return Promise.reject(error);
    }
  };

  // Si le composant est en cours de chargement, afficher un loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <span className="ml-3">Chargement...</span>
      </div>
    );
  }

  // Si nous sommes sur la page d'accueil et non authentifié, ne pas afficher le header, sidebar et footer
  if (location.pathname === '/' && !isAuthenticated) {
    return children || <Outlet />;
  }

  // Afficher le layout complet pour les pages authentifiées
  return (
    <MembresProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 bg-gray-50 overflow-auto p-4">
            {children || <Outlet />}
          </main>
        </div>
        {isAuthenticated && (
          <div className="fixed bottom-4 right-4">
            <div className="bg-white shadow-lg rounded-lg p-2 border border-gray-200">
              <SyncIndicator
                isSyncing={syncStatus.isSyncing}
                isOnline={syncStatus.isOnline}
                syncFailed={syncStatus.syncFailed}
                lastSynced={syncStatus.lastSynced}
                onSync={handleSyncAll}
                compact={true}
                className="min-w-[80px]"
              />
            </div>
          </div>
        )}
        <Footer />
      </div>
    </MembresProvider>
  );
};

export default Layout;
