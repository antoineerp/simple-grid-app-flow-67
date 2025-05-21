
import { useState, useEffect } from 'react';
import { useAutoSync } from '@/services/sync/AutoSyncService';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

/**
 * Hook pour utiliser le service de synchronisation automatique simplifié
 * Remplace différents hooks de synchronisation spécifiques par une solution unifiée
 */
export function useAutoSyncData<T>(tableName: string, options?: {
  showToasts?: boolean;
  initialLoad?: boolean;
  userId?: string; // Permettre l'override de l'utilisateur pour des cas spéciaux
}) {
  // Utiliser l'ID utilisateur fourni ou récupérer l'utilisateur courant
  const userId = options?.userId || getCurrentUser();
  
  const {
    data,
    setData: saveData,
    isSyncing,
    isOnline,
    lastSynced,
    syncWithServer: forceSync,
    hasPendingChanges
  } = useAutoSync<T>(tableName, userId); // Passer l'ID utilisateur explicitement
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Effectuer le chargement initial
  useEffect(() => {
    console.log(`useAutoSyncData: Initialisation pour ${tableName} et utilisateur ${userId}`);
    setIsLoading(false);
  }, [data, tableName, userId]);
  
  // Fonction pour sauvegarder les données avec notification optionnelle
  const setData = (newData: T[]) => {
    console.log(`useAutoSyncData: Sauvegarde de ${newData.length} éléments pour ${tableName} (utilisateur: ${userId})`);
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
    console.log(`useAutoSyncData: Synchronisation manuelle pour ${tableName} (utilisateur: ${userId})`);
    const result = await forceSync();
    
    if (options?.showToasts) {
      if (result) {
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur."
        });
      } else if (!isOnline) {
        toast({
          variant: "destructive",
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
    hasPendingChanges: hasPendingChanges(),
    userId // Exposer l'ID utilisateur pour plus de transparence
  };
}
