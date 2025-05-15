import React, { useState, useEffect } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl, getFullApiUrl, testApiConnection } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Server, RefreshCw, Bug, Wrench } from 'lucide-react';
import { runApiDiagnostic } from '@/utils/apiDiagnostic';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [version, setVersion] = useState<string>('1.0.7');
  const [isInfomaniak, setIsInfomaniak] = useState<boolean>(false);
  const [isRetesting, setIsRetesting] = useState<boolean>(false);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState<boolean>(false);
  
  const checkApi = async () => {
    try {
      setApiStatus('loading');
      const result = await testApiConnection();
      
      if (result.success) {
        setApiStatus('success');
        setApiMessage(result.message);
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
      setIsRunningDiagnostic(false);
    }
  };
  
  const runDiagnostic = async () => {
    try {
      setIsRunningDiagnostic(true);
      setApiStatus('loading');
      setApiMessage('Diagnostic en cours...');
      
      const result = await runApiDiagnostic();
      
      if (result.success) {
        setApiStatus('success');
        setApiMessage(result.message);
      } else {
        setApiStatus('error');
        setApiMessage(result.message);
      }
      
      setApiDetails(result.details || null);
      
      // Si le problème est lié à env.php, proposer un lien vers l'outil de diagnostic
      if (!result.success && result.details?.envFileStatus === 'missing') {
        setApiDetails({
          ...result.details,
          showDiagnosticLink: true
        });
      }
    } catch (error) {
      setApiStatus('error');
      setApiMessage(error instanceof Error ? error.message : 'Erreur du diagnostic');
    } finally {
      setIsRunningDiagnostic(false);
    }
  };
  
  useEffect(() => {
    // Détecter si nous sommes sur Infomaniak
    const hostname = window.location.hostname;
    const infomaniakDetected = hostname.includes('myd.infomaniak.com') || 
                             hostname.includes('qualiopi.ch');
    setIsInfomaniak(infomaniakDetected);
    
    checkApi();
    setVersion(`1.0.8 - ${new Date().toLocaleDateString()}`);
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
                
                {apiMessage.includes('PHP') && (
                  <div className="mt-2 p-2 bg-orange-100 rounded">
                    <strong>Problème détecté:</strong> Votre serveur semble renvoyer le code PHP au lieu de l'exécuter.
                    Vérifiez que PHP est correctement configuré sur votre serveur.
                  </div>
                )}
                
                {apiMessage.includes('env.php') && (
                  <div className="mt-2 p-2 bg-orange-100 rounded">
                    <strong>Problème détecté:</strong> Le fichier env.php est manquant.
                    Utilisez l'outil de diagnostic pour le créer automatiquement.
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsRetesting(true);
                    checkApi();
                  }}
                  disabled={isRetesting || isRunningDiagnostic}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRetesting ? 'animate-spin' : ''}`} />
                  {isRetesting ? 'Test en cours...' : 'Tester à nouveau'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={runDiagnostic}
                  disabled={isRetesting || isRunningDiagnostic}
                >
                  <Bug className={`h-3 w-3 mr-1 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
                  {isRunningDiagnostic ? 'Diagnostic...' : 'Diagnostic avancé'}
                </Button>
                
                <a href="/api-diagnostic.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">
                    <Wrench className="h-3 w-3 mr-1" />
                    Outil de réparation
                  </Button>
                </a>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
        
        <div className="mt-6 text-xs text-gray-500 border-t pt-4">
          <div className="flex justify-between">
            <span>API: {apiStatus === 'loading' ? 'Vérification...' : apiStatus === 'success' ? '✅ Connectée' : '❌ Erreur'}</span>
            {apiStatus === 'error' && (
              <a 
                href={`${getApiUrl()}/check.php`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-500 hover:underline"
              >
                Vérifier API <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
          </div>
          
          {apiStatus === 'error' && (
            <div className="mt-2 text-xs text-red-500">
              Pour résoudre ce problème, utilisez l'outil de réparation ou vérifiez que votre serveur exécute correctement PHP.
            </div>
          )}
        </div>
      </div>
      
      <div className="fixed bottom-4 right-4 text-xs text-gray-400">
        Version: {version}
      </div>
    </div>
  );
};

export default Index;
