
import React, { useEffect, useState } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl, getFullApiUrl, testApiConnection, checkPhpExecution } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Server, RefreshCw, CheckCircle } from 'lucide-react';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [version, setVersion] = useState<string>('1.0.8');
  const [isInfomaniak, setIsInfomaniak] = useState<boolean>(false);
  const [isRetesting, setIsRetesting] = useState<boolean>(false);
  const [phpStatus, setPhpStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [phpVersion, setPhpVersion] = useState<string>('');
  
  const checkApi = async () => {
    try {
      setApiStatus('loading');
      setPhpStatus('loading');
      
      // Vérifier d'abord l'exécution PHP de manière explicite
      const phpResult = await checkPhpExecution();
      setPhpStatus(phpResult ? 'success' : 'error');
      
      if (phpResult) {
        console.log("Exécution PHP vérifiée avec succès");
      } else {
        console.error("Problème d'exécution PHP détecté");
      }
      
      const result = await testApiConnection();
      
      if (result.success) {
        setApiStatus('success');
        setApiMessage(result.message);
        
        // Si nous avons des détails sur la version PHP depuis l'API
        if (result.details && result.details.environment && result.details.environment.version) {
          setPhpVersion(result.details.environment.version);
        }
      } else {
        setApiStatus('error');
        setApiMessage(result.message);
      }
      
      setApiDetails(result.details || null);
    } catch (error) {
      setApiStatus('error');
      setApiMessage(error instanceof Error ? error.message : 'Erreur inconnue');
      setApiDetails(null);
    } finally {
      setIsRetesting(false);
    }
  };
  
  // Utiliser useEffect avec [] pour exécuter une seule fois au chargement initial
  useEffect(() => {
    // Détecter si nous sommes sur Infomaniak
    const hostname = window.location.hostname;
    const infomaniakDetected = hostname.includes('myd.infomaniak.com') || 
                             hostname.includes('qualiopi.ch');
    setIsInfomaniak(infomaniakDetected);
    
    checkApi();
    setVersion(`1.0.8 - ${new Date().toLocaleDateString()}`);
    
    // Éviter les vérifications répétées
    const token = localStorage.getItem('authToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('Index page loaded, auth status:', isLoggedIn ? 'Logged in' : 'Not logged in');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 mb-6">
        <Logo />
        
        {apiStatus === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              <div className="font-semibold mb-1">Connexion à l'API impossible: {apiMessage}</div>
              <div className="mt-2 text-xs">
                URL d'API actuelle: <span className="font-mono">{getFullApiUrl()}</span>
                
                {apiDetails && apiDetails.tip && (
                  <div className="mt-1 p-2 bg-red-100 rounded">
                    <strong>Conseil:</strong> {apiDetails.tip}
                  </div>
                )}
                
                {phpStatus === 'error' && (
                  <div className="mt-1 p-2 bg-red-100 rounded">
                    <strong>Problème détecté:</strong> L'exécution PHP n'est pas active sur le serveur.
                    Vérifiez la configuration Apache et les fichiers .htaccess.
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => {
                  setIsRetesting(true);
                  checkApi();
                }}
                disabled={isRetesting}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRetesting ? 'animate-spin' : ''}`} />
                {isRetesting ? 'Test en cours...' : 'Tester à nouveau'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {phpStatus === 'success' && (
          <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            <AlertDescription>
              <div className="text-green-700">
                Exécution PHP vérifiée avec succès
                {phpVersion && <span className="block text-xs mt-1">Version PHP: {phpVersion}</span>}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {isInfomaniak ? (
          <Alert variant="default" className="mb-6">
            <Server className="h-4 w-4 mr-2" />
            <AlertDescription>
              <div className="text-xs">
                Environnement Infomaniak
                <div className="mt-1">
                  URL d'API: <strong>{getFullApiUrl()}</strong>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}
        
        <LoginForm />
      </div>
      
      <div className="fixed bottom-4 right-4 text-xs text-gray-400">
        Version: {version}
      </div>
    </div>
  );
};

export default Index;
