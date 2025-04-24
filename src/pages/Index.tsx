
import React, { useState, useEffect } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl, testApiConnection } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Info, FileCode, Settings } from 'lucide-react';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error' | 'php-error' | 'raw-php'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [isRetesting, setIsRetesting] = useState<boolean>(false);
  const [phpResponse, setPhpResponse] = useState<string>('');
  const [serverInfo, setServerInfo] = useState<string>('');
  
  const checkApi = async () => {
    try {
      setApiStatus('loading');
      const result = await testApiConnection();
      
      if (result.success) {
        setApiStatus('success');
        setApiMessage(result.message);
        if (result.details?.server_info) {
          setServerInfo(JSON.stringify(result.details.server_info, null, 2));
        }
      } else {
        // Vérifier si la réponse contient du code PHP brut
        if (result.details?.responseText && 
            (result.details.responseText.trim().startsWith('<?php') || 
             result.details.responseText.includes('ob_start()') ||
             result.details.responseText.includes('function cleanUTF8'))) {
          setApiStatus('raw-php');
          setApiMessage("Le serveur renvoie le code PHP au lieu de l'exécuter");
          setPhpResponse(result.details.responseText.substring(0, 200) + '...');
        }
        // Vérifier spécifiquement si c'est une erreur PHP non exécuté
        else if (result.message?.includes('PHP') && result.message?.includes('exécuter')) {
          setApiStatus('php-error');
          setApiMessage("Le serveur ne peut pas exécuter les fichiers PHP. Vérifiez l'installation et la configuration de PHP sur votre serveur.");
        } else {
          setApiStatus('error');
          setApiMessage(result.message);
        }
      }
    } catch (error) {
      // Vérifier si c'est une erreur de PHP non exécuté
      if (error instanceof Error && error.message.includes('PHP') && error.message.includes('exécuter')) {
        setApiStatus('php-error');
        setApiMessage("Le serveur ne peut pas exécuter les fichiers PHP. Vérifiez l'installation et la configuration de PHP sur votre serveur.");
      } else {
        setApiStatus('error');
        setApiMessage(error instanceof Error ? error.message : 'Erreur inconnue');
      }
    } finally {
      setIsRetesting(false);
    }
  };
  
  useEffect(() => {
    checkApi();
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
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full" 
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
        
        {apiStatus === 'raw-php' && (
          <Alert variant="destructive" className="mb-6 border-red-600 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
            <AlertDescription>
              <span className="font-bold">ERREUR CRITIQUE - PHP non exécuté:</span> {apiMessage}
              
              <div className="mt-2 bg-gray-100 p-2 rounded text-xs font-mono text-gray-900 overflow-x-auto">
                {phpResponse}
              </div>
              
              <p className="mt-2 text-sm">
                Le serveur web renvoie le code PHP en texte brut au lieu de l'exécuter.
                Cela indique un problème de configuration du serveur web:
              </p>
              <ul className="list-disc pl-5 text-sm mt-1">
                <li>Vérifiez que PHP est correctement installé et activé sur le serveur</li>
                <li>Assurez-vous que le module PHP est chargé dans la configuration du serveur web</li>
                <li>Vérifiez que les fichiers .php sont configurés pour être exécutés et non servis comme des fichiers statiques</li>
                <li>Si vous utilisez Apache, vérifiez que le module mod_php est installé</li>
                <li>Si vous utilisez Nginx, vérifiez la configuration du FastCGI pour PHP</li>
                <li>Vérifiez les permissions des fichiers PHP (chmod 755)</li>
                <li>Consultez le fichier .htaccess à la racine et dans /api/ pour vous assurer qu'il est correctement configuré</li>
              </ul>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full" 
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
          <Alert variant="destructive" className="mb-6 border-orange-500 bg-orange-50 text-orange-800">
            <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
            <AlertDescription>
              <span className="font-bold">Erreur critique de configuration PHP:</span> {apiMessage}
              
              <p className="mt-2 text-sm">
                Le serveur renvoie le code PHP au lieu de l'exécuter. Vérifiez que:
              </p>
              <ul className="list-disc pl-5 text-sm mt-1">
                <li>PHP est correctement installé sur le serveur</li>
                <li>Les fichiers .php sont configurés pour être exécutés</li>
                <li>Le module PHP est activé dans le serveur web</li>
                <li>Les permissions des fichiers sont appropriées (chmod 755 pour les répertoires et chmod 644 pour les fichiers)</li>
              </ul>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full" 
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

        {apiStatus === 'success' && serverInfo && (
          <Alert variant="default" className="mb-6 border-green-500 bg-green-50 text-green-800">
            <Info className="h-4 w-4 mr-2 text-green-600" />
            <AlertDescription>
              <span className="font-bold">Connexion à l'API réussie</span>
              <p className="text-sm mt-1">Le serveur API est correctement configuré et opérationnel.</p>
              
              <div className="mt-2 bg-gray-100 p-2 rounded text-xs font-mono text-gray-900 overflow-x-auto">
                {serverInfo}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
      </div>
      
      {(apiStatus === 'raw-php' || apiStatus === 'php-error') && (
        <div className="w-full max-w-md space-y-4">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-blue-800 text-sm">
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Besoin d'aide supplémentaire?</p>
                <p className="mt-1">Si vous utilisez un service d'hébergement, contactez leur support technique et mentionnez que:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Les fichiers PHP ne sont pas interprétés</li>
                  <li>Vous avez besoin d'activer l'exécution des scripts PHP</li>
                  <li>Le type MIME correct doit être configuré pour les fichiers .php</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 text-amber-800 text-sm">
            <div className="flex items-start">
              <Settings className="h-5 w-5 mr-2 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">Solutions typiques pour Infomaniak:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Vérifiez que votre hébergement inclut le support PHP</li>
                  <li>Dans le manager Infomaniak, assurez-vous que PHP est activé pour ce domaine</li>
                  <li>Vérifiez que le bon répertoire est configuré comme racine web</li>
                  <li>Si nécessaire, contactez le support d'Infomaniak en mentionnant que "PHP n'est pas exécuté mais renvoyé comme texte brut"</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-slate-800 text-sm">
            <div className="flex items-start">
              <FileCode className="h-5 w-5 mr-2 text-slate-500 mt-0.5" />
              <div>
                <p className="font-medium">Vérifications de fichiers à faire:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Assurez-vous que le fichier <code>.htaccess</code> est présent à la racine et dans le dossier <code>/api/</code></li>
                  <li>Vérifiez les permissions des fichiers PHP: <code>chmod 644 *.php</code></li>
                  <li>Vérifiez les permissions des dossiers: <code>chmod 755 */</code></li>
                </ul>
                <p className="mt-2">Pour tester si PHP fonctionne, créez un fichier <code>test.php</code> à la racine avec ce contenu:</p>
                <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  &lt;?php echo "PHP fonctionne"; ?&gt;
                </pre>
                <p className="mt-1">Puis accédez à <code>https://votre-domaine.com/test.php</code></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
