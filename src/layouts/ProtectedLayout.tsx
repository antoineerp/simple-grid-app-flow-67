
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getIsLoggedIn } from '@/services/auth/authService';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProtectedLayout: React.FC = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const checkAuth = () => {
    try {
      const isLoggedIn = getIsLoggedIn();
      
      if (!isLoggedIn) {
        console.log('User not authenticated, redirecting to login page');
        navigate('/', { replace: true });
      }
      
      setAuthChecked(true);
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error);
      setAuthError("Une erreur est survenue lors de la vérification de votre session");
      setAuthChecked(true);
    }
  };
  
  useEffect(() => {
    checkAuth();
  }, [navigate]);
  
  const handleRetryAuth = () => {
    setIsRetrying(true);
    setAuthError(null);
    
    // Petit délai pour le feedback visuel
    setTimeout(() => {
      checkAuth();
      setIsRetrying(false);
    }, 1000);
  };

  if (!authChecked) {
    return <div className="flex min-h-screen items-center justify-center">
      <p>Vérification de l'authentification...</p>
    </div>;
  }
  
  if (authError) {
    return <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {authError}
          </AlertDescription>
        </Alert>
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleRetryAuth}
            disabled={isRetrying}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Nouvelle tentative...' : 'Réessayer'}
          </Button>
          <Button 
            variant="default" 
            onClick={() => navigate('/', { replace: true })}
          >
            Retourner à la connexion
          </Button>
        </div>
      </div>
    </div>;
  }

  return <Layout />;
};

export default ProtectedLayout;
