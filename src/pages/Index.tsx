
import React, { useState, useEffect } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl, getFullApiUrl, testApiConnection } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Server, RefreshCw, FileType, Download } from 'lucide-react';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [version, setVersion] = useState<string>('1.0.7');
  const [isInfomaniak, setIsInfomaniak] = useState<boolean>(false);
  const [isRetesting, setIsRetesting] = useState<boolean>(false);
  const [showAdvancedHelp, setShowAdvancedHelp] = useState<boolean>(false);
  
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
    }
  };
  
  useEffect(() => {
    // Détecter si nous sommes sur Infomaniak
    const hostname = window.location.hostname;
    const infomaniakDetected = hostname.includes('myd.infomaniak.com') || 
                             hostname.includes('qualiopi.ch');
    setIsInfomaniak(infomaniakDetected);
    
    checkApi();
    setVersion(`1.0.7 - ${new Date().toLocaleDateString()}`);
  }, []);

  // Génère du contenu d'aide en fonction de l'hôte
  const getHostingHelp = () => {
    if (isInfomaniak) {
      return (
        <div className="mt-3 text-sm">
          <p className="font-bold">Configuration Infomaniak :</p>
          <ul className="list-disc ml-5 space-y-1 mt-2">
            <li>Vérifiez que PHP est activé dans votre hébergement</li>
            <li>Assurez-vous que le dossier api/ est configuré pour exécuter PHP</li>
            <li>Activez les modules mod_rewrite et mod_headers dans votre configuration</li>
          </ul>
        </div>
      );
    } else {
      return (
        <div className="mt-3 text-sm">
          <p className="font-bold">Conseils généraux :</p>
          <ul className="list-disc ml-5 space-y-1 mt-2">
            <li>Vérifiez que PHP est installé et activé sur votre serveur</li>
            <li>Assurez-vous que le serveur web (Apache/Nginx) est configuré pour traiter les fichiers .php</li>
            <li>Vérifiez les permissions des fichiers dans le dossier /api</li>
          </ul>
        </div>
      );
    }
  };
  
  const renderPhpConfigHelp = () => {
    if (!showAdvancedHelp) return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs border">
        <h4 className="font-semibold">Configuration PHP recommandée</h4>
        <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
          {`# .htaccess
<FilesMatch "\\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

<IfModule mod_php.c>
    php_flag engine on
</IfModule>
          
# php.ini
display_errors = On
error_log = /tmp/php-errors.log
engine = On`}
        </pre>
        
        <div className="mt-3 flex flex-col space-y-2">
          <Button variant="outline" size="sm" className="text-xs flex items-center">
            <FileType className="h-3 w-3 mr-1" />
            Vérifier phpinfo
          </Button>
          <Button variant="outline" size="sm" className="text-xs flex items-center">
            <Download className="h-3 w-3 mr-1" />
            Télécharger fichier de diagnostic
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 mb-6">
        <Logo />
        
        {apiStatus === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              <div className="font-semibold mb-1">Erreur PHP : {apiMessage}</div>
              <div className="mt-2 text-xs">
                <div className="font-semibold">URL d'API actuelle :</div> 
                <code className="bg-gray-100 p-1 rounded">{getFullApiUrl()}</code>
                
                {apiDetails && apiDetails.tip && (
                  <div className="mt-2 p-2 bg-red-100 rounded">
                    <strong>Conseil:</strong> {apiDetails.tip}
                  </div>
                )}
                
                {apiMessage.includes('PHP') && (
                  <div className="mt-2 p-2 bg-orange-100 rounded">
                    <strong>Problème détecté :</strong> Votre serveur renvoie le code PHP au lieu de l'exécuter.
                    Vérifiez que PHP est correctement configuré sur votre serveur.
                  </div>
                )}
                
                {getHostingHelp()}
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 flex-1" 
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
                  className="mt-2 flex-1"
                  onClick={() => setShowAdvancedHelp(!showAdvancedHelp)}
                >
                  <Server className="h-3 w-3 mr-1" />
                  {showAdvancedHelp ? 'Masquer l\'aide' : 'Aide avancée'}
                </Button>
              </div>
              
              {renderPhpConfigHelp()}
            </AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
        
        <div className="mt-6 text-xs text-gray-500 border-t pt-4">
          <div className="flex justify-between">
            <span>API: {apiStatus === 'loading' ? 'Vérification...' : apiStatus === 'success' ? '✅ Connectée' : '❌ Erreur'}</span>
            {apiStatus === 'error' && (
              <a 
                href={`${getApiUrl()}/check-users.php`} 
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
              Pour résoudre ce problème, vérifiez que votre serveur exécute correctement PHP.
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
