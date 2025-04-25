import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { MembresProvider } from '@/contexts/MembresContext';
import { loadUserProfileFromServer } from '@/services/sync';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from 'next-themes';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPhpError, setIsPhpError] = useState(false);
  
  const loadUserData = async () => {
    if (isAuthenticated && !isDataLoaded) {
      console.log("🔄 Chargement initial des données utilisateur");
      try {
        setLoadError(null);
        setIsPhpError(false);
        const userData = await loadUserProfileFromServer();
        if (userData) {
          console.log("✅ Données utilisateur chargées avec succès");
        } else {
          console.warn("⚠️ Aucune donnée utilisateur trouvée ou erreur de chargement");
          setLoadError("Impossible de charger les données utilisateur depuis le serveur");
        }
        setIsDataLoaded(true);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des données utilisateur:", error);
        let errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des données";
        
        if (error instanceof Error && 
            (error.message.includes('PHP n\'est pas exécuté') || 
             error.message.includes('Configuration serveur incorrecte'))) {
          setIsPhpError(true);
          errorMessage = "Erreur de configuration du serveur: PHP n'est pas correctement configuré";
        }
        
        setLoadError(errorMessage);
        setIsDataLoaded(true);
      }
    }
  };
  
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      console.log('Auth status:', isLoggedIn ? 'Logged in' : 'Not logged in');
      console.log('Current path:', location.pathname);
      console.log('Auth token exists:', !!token);
      
      setIsAuthenticated(isLoggedIn);
      
      if (!isLoggedIn && location.pathname !== '/') {
        console.log('Redirecting to home page from', location.pathname);
        navigate('/');
      } else if (isLoggedIn && location.pathname === '/' && !isLoading) {
        console.log('Redirecting to dashboard from home page');
        navigate('/pilotage');
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate, location.pathname, isLoading]);
  
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadUserData();
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (location.pathname === '/' && !isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children || <Outlet />}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MembresProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          {loadError && (
            <Alert variant="destructive" className="mx-4 mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {loadError}
                
                {isPhpError && (
                  <div className="mt-2 text-xs">
                    <p>Le serveur PHP ne semble pas correctement configuré. Votre serveur retourne le code PHP au lieu de l'exécuter.</p>
                    <p className="mt-1">Solutions recommandées:</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Vérifiez que PHP est correctement installé et activé sur votre serveur</li>
                      <li>Assurez-vous que l'extension .php est associée à l'interpréteur PHP</li>
                      <li>Sur un hébergement partagé, contactez votre hébergeur pour activer PHP</li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open('/api/phpinfo.php', '_blank')}
                    >
                      <Server className="h-3 w-3 mr-1" />
                      Tester la configuration PHP
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 bg-gray-50 overflow-auto">
              {children || <Outlet />}
            </main>
          </div>
          <Footer />
        </div>
      </MembresProvider>
    </ThemeProvider>
  );
};

export default Layout;
