import React, { useState, useEffect } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl, getFullApiUrl, testApiConnection } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Server, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { diagnoseApiConnection, checkPhpServerStatus } from '@/services/sync';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error' | 'php-error' | 'php-success'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [version, setVersion] = useState<string>('1.0.7');
  const [isInfomaniak, setIsInfomaniak] = useState<boolean>(false);
  const [isRetesting, setIsRetesting] = useState<boolean>(false);
  
  const checkApi = async () => {
    try {
      setApiStatus('loading');
      
      // Premier test général de l'API avec testApiConnection
      const result = await testApiConnection();
      
      // Si l'API générale répond, faire un diagnostic spécifique pour PHP
      if (result.success) {
        try {
          const phpStatus = await checkPhpServerStatus();
          
          if (phpStatus.isWorking) {
            setApiStatus('php-success');
            setApiMessage("API connectée et PHP correctement exécuté");
          } else if (phpStatus.errorCode === 'PHP_EXECUTION_ERROR') {
            setApiStatus('php-error');
            setApiMessage("Erreur de configuration PHP: le code PHP est renvoyé au lieu d'être exécuté");
            setApiDetails({
              detail: phpStatus.detail,
              tip: "Vérifiez la configuration PHP sur votre serveur."
            });
          } else {
            setApiStatus('error');
            setApiMessage(phpStatus.detail);
          }
        } catch (diagError) {
          // Si le diagnostic échoue, on garde quand même le succès du test général
          setApiStatus('success');
          setApiMessage(result.message + " (Diagnostic avancé indisponible)");
        }
      } else {
        setApiStatus('error');
        setApiMessage(result.message);
        setApiDetails(result.details || null);
      }
    } catch (error) {
      setApiStatus('error');
      setApiMessage(error instanceof Error ? error.message : 'Erreur inconnue');
      setApiDetails(null);
    } finally {
      setIsRetesting(false);
    }
  };
  
  useEffect(() => {
    // Détecter si nous sommes sur Infomaniak
    const hostname = window.location.hostname;
    const infomaniakDetected = hostname.includes('myd.infomaniak.com') || 
                             hostname.includes('qualiopi.ch');
    setIsInfomaniak(infomaniakDetected);
    
    checkApi();
    setVersion(`1.0.9 - ${new Date().toLocaleDateString()}`);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 mb-6">
        <Logo />
        
        {apiStatus === 'php-success' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <div className="font-semibold mb-1 text-green-700">API PHP opérationnelle</div>
              <div className="text-xs text-green-600">
                Le serveur PHP répond correctement et est prêt à être utilisé.
              </div>
            </AlertDescription>
          </Alert>
        )}
        
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
        
        {apiStatus === 'php-error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              <div className="font-semibold mb-1">Erreur de configuration du serveur PHP</div>
              <div className="mt-2">
                <p>Le serveur PHP n'exécute pas correctement le code PHP. Au lieu de l'exécuter, il renvoie le code source.</p>
                {apiDetails?.detail && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono">
                    {apiDetails.detail}
                  </div>
                )}
                <p className="mt-2 text-sm font-semibold">Solutions possibles:</p>
                <ul className="list-disc pl-5 text-xs mt-1">
                  <li>Vérifiez que PHP est correctement installé et configuré sur votre serveur</li>
                  <li>Vérifiez que les fichiers .php sont bien associés à l'interpréteur PHP</li>
                  {isInfomaniak && (
                    <li>Sur Infomaniak, vérifiez que le mode PHP est activé pour votre hébergement</li>
                  )}
                </ul>
              </div>
              
              <div className="flex space-x-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsRetesting(true);
                    checkApi();
                  }}
                  disabled={isRetesting}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRetesting ? 'animate-spin' : ''}`} />
                  {isRetesting ? 'Test en cours...' : 'Tester à nouveau'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`${getApiUrl()}/phpinfo.php`, '_blank')}
                >
                  <Server className="h-3 w-3 mr-1" />
                  Info PHP
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
        
        <div className="mt-6 text-xs text-gray-500 border-t pt-4">
          <div className="flex justify-between">
            <span>
              API: {apiStatus === 'loading' ? 'Vérification...' : 
                    apiStatus === 'php-success' ? '✅ Connectée et fonctionnelle' :
                    apiStatus === 'success' ? '✅ Connectée' : 
                    apiStatus === 'php-error' ? '❌ Erreur PHP' : '❌ Erreur'}
            </span>
            {(apiStatus === 'error' || apiStatus === 'php-error') && (
              <a 
                href={`${getApiUrl()}/phpinfo.php`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-500 hover:underline"
              >
                Info PHP <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
          </div>
          
          {(apiStatus === 'error' || apiStatus === 'php-error') && (
            <div className="mt-2 text-xs text-red-500">
              Pour résoudre ce problème, vérifiez que votre serveur exécute correctement PHP.
              {isInfomaniak && " Sur Infomaniak, vérifiez les paramètres d'hébergement."}
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
