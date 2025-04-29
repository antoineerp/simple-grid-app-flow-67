
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { useSyncService } from '@/services/core/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface BootLoaderProps {
  children: React.ReactNode;
}

const BootLoader: React.FC<BootLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initialisation...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
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
        
        // On lance les chargements en parallèle
        setDebugInfo(prev => [...prev, 'Début du chargement des données']);
        
        try {
          // Documents
          setDebugInfo(prev => [...prev, 'Chargement des documents...']);
          const documentsResult = await syncService.loadFromServer({
            endpoint: 'documents-sync.php',
            loadEndpoint: 'documents-load.php',
            userId: user
          });
          setDebugInfo(prev => [...prev, `Documents chargés: ${documentsResult ? Array.isArray(documentsResult) ? documentsResult.length : 'Format invalide' : 'Erreur'}`]);
          
          // Exigences
          setDebugInfo(prev => [...prev, 'Chargement des exigences...']);
          const exigencesResult = await syncService.loadFromServer({
            endpoint: 'exigences-sync.php',
            loadEndpoint: 'exigences-load.php',
            userId: user
          });
          setDebugInfo(prev => [...prev, `Exigences chargées: ${exigencesResult ? Array.isArray(exigencesResult) ? exigencesResult.length : 'Format invalide' : 'Erreur'}`]);
          
          console.log('Préchargement des données terminé', { documentsResult, exigencesResult });
        } catch (loadError) {
          console.error("Erreur lors du préchargement:", loadError);
          setDebugInfo(prev => [...prev, `Erreur lors du préchargement: ${loadError instanceof Error ? loadError.message : String(loadError)}`]);
        }
        
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        setDebugInfo(prev => [...prev, `Erreur lors de l'initialisation: ${error instanceof Error ? error.message : String(error)}`]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, [isOnline, toast, syncService]);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-blue mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">{loadingStatus}</h3>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant le chargement initial...</p>
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
