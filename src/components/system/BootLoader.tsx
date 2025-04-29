
import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { useSyncService } from '@/services/core/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BootLoaderProps {
  children: React.ReactNode;
}

const BootLoader: React.FC<BootLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initialisation...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [initTimeout, setInitTimeout] = useState<boolean>(false);
  const syncService = useSyncService();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  // Utilisons une référence pour suivre si le composant est monté
  const isMounted = useRef(true);
  
  // Effet pour gérer le timeout de chargement
  useEffect(() => {
    // Si le chargement prend plus de 10 secondes, on continue quand même
    const timeoutId = setTimeout(() => {
      if (isLoading && isMounted.current) {
        console.log('BootLoader: Timeout de chargement dépassé, poursuite de l\'application');
        setInitTimeout(true);
        setIsLoading(false);
        toast({
          title: "Chargement partiel",
          description: "L'application a été chargée partiellement, certaines données pourraient être manquantes.",
          variant: "warning"
        });
      }
    }, 10000); // 10 secondes de timeout
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, toast]);
  
  useEffect(() => {
    // Fonction pour initialiser l'application
    const initializeApp = async () => {
      try {
        // Ne pas continuer si le composant n'est plus monté
        if (!isMounted.current) return;
        
        const user = getCurrentUser();
        console.log("BootLoader: Utilisateur actuel:", user);
        
        if (isMounted.current) {
          setDebugInfo(prev => [...prev, `Utilisateur: ${user ? JSON.stringify(user).substring(0, 100) + '...' : 'Non connecté'}`]);
        }
        
        // Si l'utilisateur n'est pas connecté, on ne charge pas les données
        if (!user) {
          console.log('BootLoader: Aucun utilisateur connecté, pas de chargement initial');
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, 'Aucun utilisateur connecté, pas de chargement initial']);
            setIsLoading(false);
          }
          return;
        }
        
        // Si l'utilisateur est hors-ligne, on affiche un toast d'avertissement
        if (!isOnline) {
          console.log('BootLoader: Mode hors-ligne détecté');
          toast({
            title: "Mode Hors-ligne",
            description: "Vous êtes actuellement hors ligne. L'application fonctionne en mode local.",
            variant: "default"
          });
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, 'Mode Hors-ligne activé']);
            setIsLoading(false);
          }
          return;
        }
        
        // Préchargement des données essentielles
        if (isMounted.current) {
          setLoadingStatus('Chargement des données...');
          setDebugInfo(prev => [...prev, 'Début du chargement des données']);
          console.log('BootLoader: Début du chargement des données');
        }
        
        try {
          let userId = '';
          if (typeof user === 'object' && user !== null) {
            userId = user.identifiant_technique || user.email || '';
          } else if (typeof user === 'string') {
            userId = user;
          }
          
          console.log(`BootLoader: userId identifié: ${userId}`);
          
          if (!userId) {
            console.warn('BootLoader: Identifiant utilisateur non disponible, chargement impossible');
            if (isMounted.current) {
              setIsLoading(false);
            }
            return;
          }
          
          // Documents (premier chargement)
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, 'Chargement des documents...']);
            setLoadingStatus('Chargement des documents...');
            console.log('BootLoader: Chargement des documents...');
          }
          
          const documentsResult = await syncService.loadFromServer({
            endpoint: 'documents-sync.php',
            loadEndpoint: 'documents-load.php',
            userId: userId,
            maxRetries: 1,
            retryDelay: 500
          }).catch(err => {
            console.warn('Erreur lors du chargement des documents:', err);
            return null;
          });
          
          console.log('BootLoader: Résultat du chargement des documents:', documentsResult ? 'OK' : 'Échec');
          
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, `Documents chargés: ${documentsResult ? Array.isArray(documentsResult) ? documentsResult.length : 'Format invalide' : 'Erreur'}`]);
          }
          
          // Si le timeout est déjà déclenché, on arrête le chargement
          if (initTimeout || !isMounted.current) {
            return;
          }
          
          // Attendre un peu avant de lancer le prochain chargement (évite de surcharger le serveur)
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Exigences
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, 'Chargement des exigences...']);
            setLoadingStatus('Chargement des exigences...');
            console.log('BootLoader: Chargement des exigences...');
          }
          
          const exigencesResult = await syncService.loadFromServer({
            endpoint: 'exigences-sync.php',
            loadEndpoint: 'exigences-load.php',
            userId: userId,
            maxRetries: 1,
            retryDelay: 500
          }).catch(err => {
            console.warn('Erreur lors du chargement des exigences:', err);
            return null;
          });
          
          console.log('BootLoader: Résultat du chargement des exigences:', exigencesResult ? 'OK' : 'Échec');
          
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, `Exigences chargées: ${exigencesResult ? Array.isArray(exigencesResult) ? exigencesResult.length : 'Format invalide' : 'Erreur'}`]);
          }
          
          console.log('BootLoader: Préchargement des données terminé avec succès');
        } catch (loadError) {
          console.error("BootLoader: Erreur lors du préchargement:", loadError);
          
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, `Erreur lors du préchargement: ${loadError instanceof Error ? loadError.message : String(loadError)}`]);
            setApiError(loadError instanceof Error ? loadError.message : String(loadError));
            
            // Si on a moins de 3 tentatives, on réessaie
            if (retryCount < 1) {
              setRetryCount(prev => prev + 1);
              setLoadingStatus(`Nouvelle tentative (${retryCount + 1}/2)... `);
              console.log(`BootLoader: Nouvelle tentative ${retryCount + 1}/2`);
              
              // Attendre un peu avant de réessayer
              setTimeout(() => {
                if (isMounted.current) {
                  initializeApp();
                }
              }, 1000);
              return;
            }
            
            console.log('BootLoader: Échec après plusieurs tentatives, poursuite sans les données');
            toast({
              title: "Erreur de chargement",
              description: "Les données n'ont pas pu être chargées. L'application pourrait ne pas fonctionner correctement.",
              variant: "destructive"
            });
          }
        }
        
      } catch (error) {
        console.error('BootLoader: Erreur lors de l\'initialisation de l\'application:', error);
        if (isMounted.current) {
          setDebugInfo(prev => [...prev, `Erreur lors de l'initialisation: ${error instanceof Error ? error.message : String(error)}`]);
          setApiError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          console.log('BootLoader: Initialisation terminée, affichage de l\'application');
        }
      }
    };
    
    // Lancer l'initialisation
    console.log('BootLoader: Démarrage de l\'initialisation');
    initializeApp();
    
    // Nettoyage pour éviter les mises à jour d'état après démontage
    return () => {
      console.log('BootLoader: Démontage du composant');
      isMounted.current = false;
    };
  }, [isOnline, toast, syncService, retryCount, initTimeout]);
  
  // Séparation des effets pour éviter les problèmes de dépendance cyclique
  useEffect(() => {
    if (!isLoading && debugInfo.length > 0) {
      console.log('=== INFORMATIONS DE DÉMARRAGE ===');
      debugInfo.forEach(info => console.log(info));
      console.log('================================');
    }
  }, [isLoading, debugInfo]);

  // Fonction pour réessayer le chargement manuellement
  const handleRetry = () => {
    setRetryCount(0);
    setApiError(null);
    setInitTimeout(false);
    setIsLoading(true);
    setLoadingStatus('Nouvelle tentative...');
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="text-center p-6 max-w-md">
          <Spinner size="lg" color="primary" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{loadingStatus}</h3>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant le chargement initial...</p>
          {retryCount > 0 && (
            <p className="text-sm text-amber-600 mt-2">Tentative {retryCount + 1}/2</p>
          )}
          
          {apiError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                <div className="text-sm">
                  <p className="font-semibold">Erreur détectée:</p>
                  <p className="break-words">{apiError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                    className="mt-2 w-full"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Réessayer le chargement
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => setIsLoading(false)}
            className="mt-4"
          >
            Continuer sans attendre
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BootLoader;
