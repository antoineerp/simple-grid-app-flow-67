
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { useSyncService } from '@/services/core/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Spinner } from '@/components/ui/spinner';

interface BootLoaderProps {
  children: React.ReactNode;
}

const BootLoader: React.FC<BootLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initialisation...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const syncService = useSyncService();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  // Utilisons une référence pour suivre si le composant est monté
  const isMounted = React.useRef(true);
  
  useEffect(() => {
    // Nettoyage lors du démontage
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ne pas continuer si le composant n'est plus monté
        if (!isMounted.current) return;
        
        const user = getCurrentUser();
        
        if (isMounted.current) {
          setDebugInfo(prev => [...prev, `Utilisateur: ${user ? JSON.stringify(user) : 'Non connecté'}`]);
        }
        
        // Si l'utilisateur n'est pas connecté, on ne charge pas les données
        if (!user) {
          console.log('Aucun utilisateur connecté, pas de chargement initial');
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, 'Aucun utilisateur connecté, pas de chargement initial']);
            setIsLoading(false);
          }
          return;
        }
        
        // Si l'utilisateur est hors-ligne, on affiche un toast d'avertissement
        if (!isOnline) {
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
        }
        
        try {
          // Documents (premier chargement)
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, 'Chargement des documents...']);
            setLoadingStatus('Chargement des documents...');
          }
          
          const documentsResult = await syncService.loadFromServer({
            endpoint: 'documents-sync.php',
            loadEndpoint: 'documents-load.php',
            userId: user,
            retryDelay: 1000 // Attendre 1s entre les tentatives
          });
          
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, `Documents chargés: ${documentsResult ? Array.isArray(documentsResult) ? documentsResult.length : 'Format invalide' : 'Erreur'}`]);
          }
          
          // Attendre un peu avant de lancer le prochain chargement (évite de surcharger le serveur)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Exigences
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, 'Chargement des exigences...']);
            setLoadingStatus('Chargement des exigences...');
          }
          
          const exigencesResult = await syncService.loadFromServer({
            endpoint: 'exigences-sync.php',
            loadEndpoint: 'exigences-load.php',
            userId: user,
            retryDelay: 1000
          });
          
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, `Exigences chargées: ${exigencesResult ? Array.isArray(exigencesResult) ? exigencesResult.length : 'Format invalide' : 'Erreur'}`]);
          }
          
          console.log('Préchargement des données terminé', { documentsResult, exigencesResult });
        } catch (loadError) {
          console.error("Erreur lors du préchargement:", loadError);
          
          if (isMounted.current) {
            setDebugInfo(prev => [...prev, `Erreur lors du préchargement: ${loadError instanceof Error ? loadError.message : String(loadError)}`]);
            
            // Si on a moins de 3 tentatives, on réessaie
            if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              setLoadingStatus(`Nouvelle tentative (${retryCount + 1}/3)... `);
              setTimeout(() => {
                if (isMounted.current) {
                  initializeApp();
                }
              }, 2000);
              return;
            }
            
            toast({
              title: "Erreur de chargement",
              description: "Les données n'ont pas pu être chargées. L'application pourrait ne pas fonctionner correctement.",
              variant: "destructive"
            });
          }
        }
        
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        if (isMounted.current) {
          setDebugInfo(prev => [...prev, `Erreur lors de l'initialisation: ${error instanceof Error ? error.message : String(error)}`]);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    initializeApp();
    
    // Nettoyage pour éviter les mises à jour d'état après démontage
    return () => {
      isMounted.current = false;
    };
  }, [isOnline, toast, syncService, retryCount]);
  
  // Séparation des effets pour éviter les problèmes de dépendance cyclique
  useEffect(() => {
    if (!isLoading && debugInfo.length > 0) {
      console.log('=== INFORMATIONS DE DÉMARRAGE ===');
      debugInfo.forEach(info => console.log(info));
      console.log('================================');
    }
  }, [isLoading, debugInfo]);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="text-center">
          <Spinner size="lg" color="primary" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{loadingStatus}</h3>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant le chargement initial...</p>
          {retryCount > 0 && (
            <p className="text-sm text-amber-600 mt-2">Tentative {retryCount}/3</p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BootLoader;
