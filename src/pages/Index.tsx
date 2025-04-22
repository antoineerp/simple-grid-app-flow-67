
import React, { useState, useEffect } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl, getFullApiUrl } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Info, Server } from 'lucide-react';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [version, setVersion] = useState<string>('1.0.7');
  const [isInfomaniak, setIsInfomaniak] = useState<boolean>(false);
  
  useEffect(() => {
    // Détecter si nous sommes sur Infomaniak
    const hostname = window.location.hostname;
    const infomaniakDetected = hostname.includes('myd.infomaniak.com') || 
                             hostname.includes('qualiopi.ch') || 
                             hostname.includes('p71x6d');
    setIsInfomaniak(infomaniakDetected);
    
    const checkApi = async () => {
      try {
        const timestamp = new Date().getTime();
        const apiUrl = getApiUrl();
        console.log('Vérification de l\'API avec URL:', apiUrl);
        
        const response = await fetch(`${apiUrl}/index.php?_=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        const data = await response.text();
        let jsonData;
        
        try {
          jsonData = JSON.parse(data);
          setApiStatus('success');
          setApiMessage(jsonData.message || 'API accessible');
        } catch (e) {
          // Si la réponse n'est pas du JSON valide
          setApiStatus('error');
          setApiMessage('La réponse du serveur n\'est pas un JSON valide');
          console.error('Réponse non-JSON:', data);
        }
      } catch (error) {
        setApiStatus('error');
        setApiMessage(error instanceof Error ? error.message : 'Erreur inconnue');
      }
    };
    
    checkApi();
    
    // Nouvelle date pour mettre à jour la version
    setVersion(`1.0.7 - ${new Date().toLocaleDateString()}`);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 mb-6">
        <Logo />
        
        {apiStatus === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Connexion à l'API impossible: {apiMessage}
              <div className="mt-2 text-xs">
                URL d'API actuelle: {getFullApiUrl()}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Alert variant={isInfomaniak ? "default" : "warning"} className="mb-6">
          <Info className="h-4 w-4 mr-2" />
          <AlertDescription>
            <div className="text-xs">
              {isInfomaniak ? (
                <>
                  <div className="flex items-center mb-1">
                    <Server className="h-3 w-3 mr-1" />
                    <span className="font-medium">Infomaniak détecté</span>
                  </div>
                  URL d'API: <strong>{getFullApiUrl()}</strong>
                </>
              ) : (
                <>URL d'API: <strong>{getFullApiUrl()}</strong></>
              )}
            </div>
          </AlertDescription>
        </Alert>
        
        <LoginForm />
        
        <div className="mt-6 text-xs text-gray-500 border-t pt-4">
          <div className="flex justify-between">
            <span>API: {apiStatus === 'loading' ? 'Vérification...' : apiStatus === 'success' ? '✅ Connectée' : '❌ Erreur'}</span>
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
