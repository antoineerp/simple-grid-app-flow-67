
import { useState, useEffect } from 'react';
import { useAutoSync } from '@/services/sync/AutoSyncService';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook pour utiliser le service de synchronisation automatique simplifié
 * Remplace différents hooks de synchronisation spécifiques par une solution unifiée
 */
export function useAutoSyncData<T>(tableName: string, options?: {
  showToasts?: boolean;
  initialLoad?: boolean;
}) {
  const {
    data,
    setData: saveData,
    isSyncing,
    isOnline,
    lastSynced,
    syncWithServer: forceSync,
    hasPendingChanges
  } = useAutoSync<T>(tableName);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Effectuer le chargement initial
  useEffect(() => {
    setIsLoading(false);
  }, [data]);
  
  // Fonction pour sauvegarder les données avec notification optionnelle
  const setData = (newData: T[]) => {
    saveData(newData);
    
    if (options?.showToasts) {
      toast({
        title: "Données sauvegardées",
        description: `${newData.length} éléments sauvegardés localement${isOnline ? ' et en attente de synchronisation' : ''}.`
      });
    }
  };
  
  // Fonction pour synchroniser manuellement
  const syncWithServer = async () => {
    const result = await forceSync();
    
    if (options?.showToasts) {
      if (result) {
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur."
        });
      } else if (!isOnline) {
        toast({
          variant: "destructive", // Changed from "warning" to "destructive"
          title: "Mode hors ligne",
          description: "Les données seront synchronisées lorsque vous serez en ligne."
        });
      }
    }
    
    return result;
  };
  
  return {
    data,
    setData,
    isLoading,
    isSyncing,
    isOnline,
    lastSynced,
    syncWithServer,
    hasPendingChanges: hasPendingChanges()
  };
}
