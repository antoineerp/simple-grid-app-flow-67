
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
  const syncService = useSyncService();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const user = getCurrentUser();
        
        // Si l'utilisateur n'est pas connecté, on ne charge pas les données
        if (!user) {
          console.log('Aucun utilisateur connecté, pas de chargement initial');
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
          setIsLoading(false);
          return;
        }
        
        // Préchargement des données essentielles
        setLoadingStatus('Chargement des données...');
        
        // On lance les chargements en parallèle
        const loadPromises = [
          // Documents
          syncService.loadFromServer({
            endpoint: 'documents-sync.php',
            loadEndpoint: 'documents-load.php',
            userId: user
          }).catch(err => {
            console.error("Erreur lors du préchargement des documents:", err);
            return [];
          }),
          
          // Exigences
          syncService.loadFromServer({
            endpoint: 'exigences-sync.php',
            loadEndpoint: 'exigences-load.php',
            userId: user
          }).catch(err => {
            console.error("Erreur lors du préchargement des exigences:", err);
            return [];
          })
        ];
        
        await Promise.all(loadPromises);
        console.log('Préchargement des données terminé');
        
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
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
  
  return <>{children}</>;
};

export default BootLoader;
