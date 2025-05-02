
/**
 * Composant de surveillance de l'état de la connexion réseau
 * Affiche une notification lorsque la connexion change
 */
import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { unifiedSync } from '@/services/sync/UnifiedSyncService';

const NetworkStatusMonitor: React.FC = () => {
  const { toast } = useToast();

  useEffect(() => {
    // État initial de la connexion
    let isOnline = navigator.onLine;
    
    // Gestionnaires d'événements
    const handleOnline = () => {
      if (!isOnline) {
        // La connexion vient d'être rétablie
        toast({
          title: "Connexion rétablie",
          description: "L'application est maintenant connectée au réseau.",
          variant: "default"
        });
        
        // Déclencher un événement pour informer l'application
        const event = new Event('connectivity-restored');
        window.dispatchEvent(event);
        
        // Mettre à jour l'état
        isOnline = true;
      }
    };
    
    const handleOffline = () => {
      if (isOnline) {
        // La connexion vient d'être perdue
        toast({
          title: "Connexion perdue",
          description: "L'application fonctionne maintenant en mode hors ligne.",
          variant: "warning"
        });
        
        // Déclencher un événement pour informer l'application
        const event = new Event('connectivity-lost');
        window.dispatchEvent(event);
        
        // Mettre à jour l'état
        isOnline = false;
      }
    };
    
    // Enregistrer les écouteurs d'événements
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Nettoyer les écouteurs d'événements lors du démontage
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Écouter les changements de connectivité
  useEffect(() => {
    // Écouter l'événement de rétablissement de la connectivité
    const handleConnectivityRestored = () => {
      // Tentative de synchronisation des données en attente
      console.log("Connectivité rétablie, vérification des données non synchronisées...");
      
      // On pourrait ici déclencher une synchronisation des données en attente
      // Pour l'instant, on ne fait rien automatiquement
    };
    
    // Enregistrer l'écouteur d'événements
    window.addEventListener('connectivity-restored', handleConnectivityRestored);
    
    // Nettoyer l'écouteur d'événements lors du démontage
    return () => {
      window.removeEventListener('connectivity-restored', handleConnectivityRestored);
    };
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
};

export default NetworkStatusMonitor;
