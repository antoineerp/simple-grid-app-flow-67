
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
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const user = getCurrentUser();
        
        setDebugInfo(prev => [...prev, `Utilisateur: ${user ? JSON.stringify(user) : 'Non connecté'}`]);
        
        // Si l'utilisateur n'est pas connecté, on ne charge pas les données
        if (!user) {
          console.log('Aucun utilisateur connecté, pas de chargement initial');
          setDebugInfo(prev => [...prev, 'Aucun utilisateur connecté, pas de chargement initial']);
          setIsLoading(false);
          return;
        }
        
        // Si l'utilisateur est hors-ligne, on affiche un toast d'avertissement
        if (!isOnline) {
          toast({
            title: "Mode Hors-ligne",
            description: "Vous êtes actuellement hors ligne. L'application fonctionne en mode local.",
            variant: "default"
          });
          setDebugInfo(prev => [...prev, 'Mode Hors-ligne activé']);
          setIsLoading(false);
          return;
        }
        
        // Préchargement des données essentielles
        setLoadingStatus('Chargement des données...');
        
        // On lance les chargements de manière séquentielle pour réduire la charge
        setDebugInfo(prev => [...prev, 'Début du chargement des données']);
        
        try {
          // Documents (premier chargement)
          setDebugInfo(prev => [...prev, 'Chargement des documents...']);
          setLoadingStatus('Chargement des documents...');
          
          const documentsResult = await syncService.loadFromServer({
            endpoint: 'documents-sync.php',
            loadEndpoint: 'documents-load.php',
            userId: user,
            retryDelay: 1000 // Attendre 1s entre les tentatives
          });
          
          setDebugInfo(prev => [...prev, `Documents chargés: ${documentsResult ? Array.isArray(documentsResult) ? documentsResult.length : 'Format invalide' : 'Erreur'}`]);
          
          // Attendre un peu avant de lancer le prochain chargement (évite de surcharger le serveur)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Exigences
          setDebugInfo(prev => [...prev, 'Chargement des exigences...']);
          setLoadingStatus('Chargement des exigences...');
          
          const exigencesResult = await syncService.loadFromServer({
            endpoint: 'exigences-sync.php',
            loadEndpoint: 'exigences-load.php',
            userId: user,
            retryDelay: 1000
          });
          
          setDebugInfo(prev => [...prev, `Exigences chargées: ${exigencesResult ? Array.isArray(exigencesResult) ? exigencesResult.length : 'Format invalide' : 'Erreur'}`]);
          
          console.log('Préchargement des données terminé', { documentsResult, exigencesResult });
        } catch (loadError) {
          console.error("Erreur lors du préchargement:", loadError);
          setDebugInfo(prev => [...prev, `Erreur lors du préchargement: ${loadError instanceof Error ? loadError.message : String(loadError)}`]);
          
          // Si on a moins de 3 tentatives, on réessaie
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setLoadingStatus(`Nouvelle tentative (${retryCount + 1}/3)... `);
            await new Promise(resolve => setTimeout(resolve, 2000));
            initializeApp(); // Relancer l'initialisation
            return;
          }
          
          toast({
            title: "Erreur de chargement",
            description: "Les données n'ont pas pu être chargées. L'application pourrait ne pas fonctionner correctement.",
            variant: "destructive"
          });
        }
        
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        setDebugInfo(prev => [...prev, `Erreur lors de l'initialisation: ${error instanceof Error ? error.message : String(error)}`]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, [isOnline, toast, syncService, retryCount]);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-blue mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">{loadingStatus}</h3>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant le chargement initial...</p>
          {retryCount > 0 && (
            <p className="text-sm text-amber-600 mt-2">Tentative {retryCount}/3</p>
          )}
        </div>
      </div>
    );
  }

  // Log debugging info to console once loading is complete
  useEffect(() => {
    if (!isLoading && debugInfo.length > 0) {
      console.log('=== INFORMATIONS DE DÉMARRAGE ===');
      debugInfo.forEach(info => console.log(info));
      console.log('================================');
    }
  }, [isLoading, debugInfo]);
  
  return <>{children}</>;
};

export default BootLoader;
