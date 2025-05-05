
import React, { useState } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [version, setVersion] = useState<string>('1.0.7');
  const [isInfomaniak, setIsInfomaniak] = useState<boolean>(false);
  const [isRetesting, setIsRetesting] = useState<boolean>(false);
  
  // Ne plus faire de vérification automatique au chargement de la page
  
  const checkApi = async () => {
    try {
      setApiStatus('loading');
      
      const response = await fetch(`${getApiUrl()}/ping.php`);
      const data = await response.json();
      
      if (data.success) {
        setApiStatus('success');
        setApiMessage(data.message);
      } else {
        setApiStatus('error');
        setApiMessage(data.message || 'Erreur de connexion à l\'API');
      }
      
      setApiDetails(data.details || null);
    } catch (error) {
      setApiStatus('error');
      setApiMessage(error instanceof Error ? error.message : 'Erreur inconnue');
      setApiDetails(null);
    } finally {
      setIsRetesting(false);
    }
  };
  
  useState(() => {
    // Détecter si nous sommes sur Infomaniak
    const hostname = window.location.hostname;
    const infomaniakDetected = hostname.includes('myd.infomaniak.com') || 
                             hostname.includes('qualiopi.ch');
    setIsInfomaniak(infomaniakDetected);
    
    // Définir la version
    setVersion(`1.0.7 - ${new Date().toLocaleDateString()}`);
  });

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
                URL d'API actuelle: <span className="font-mono">{getApiUrl()}</span>
                
                {apiDetails && apiDetails.tip && (
                  <div className="mt-1 p-2 bg-red-100 rounded">
                    <strong>Conseil:</strong> {apiDetails.tip}
                  </div>
                )}
                
                {apiMessage.includes('PHP') && (
                  <div className="mt-2 p-2 bg-orange-100 rounded">
                    <strong>Problème détecté:</strong> Votre serveur semble renvoyer le code PHP au lieu de l'exécuter.
                    Vérifiez que PHP est correctement configuré sur votre serveur.
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
                {isRetesting ? 'Test en cours...' : 'Tester la connexion'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
        
        <div className="mt-6 text-xs text-gray-500 border-t pt-4">
          <div className="flex justify-between">
            <span>API: {apiStatus === 'idle' ? 'Non testée' : apiStatus === 'loading' ? 'Vérification...' : apiStatus === 'success' ? '✅ Connectée' : '❌ Erreur'}</span>
            <a 
              href={`${getApiUrl()}/check-users.php`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-500 hover:underline"
            >
              Vérifier utilisateurs <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-4 right-4 text-xs text-gray-400">
        Version: {version}
      </div>
    </div>
  );
};

export default Index;
