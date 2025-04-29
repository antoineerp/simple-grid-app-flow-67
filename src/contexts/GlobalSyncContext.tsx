
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { triggerSync } from '@/services/sync/triggerSync';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
}

interface GlobalSyncContextType {
  // États de synchronisation par table
  syncStates: Record<string, SyncState>;
  
  // Méthode pour synchroniser une table spécifique
  syncTable: <T>(tableName: string, data: T[]) => Promise<boolean>;
  
  // Méthode pour synchroniser toutes les tables
  syncAll: () => Promise<Record<string, boolean>>;
  
  // Méthode pour mettre à jour l'état de synchronisation d'une table
  updateSyncState: (tableName: string, state: Partial<SyncState>) => void;
  
  // État de connexion
  isOnline: boolean;
}

// Création du contexte avec des valeurs par défaut
const GlobalSyncContext = createContext<GlobalSyncContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useGlobalSync = () => {
  const context = useContext(GlobalSyncContext);
  if (context === undefined) {
    throw new Error("useGlobalSync doit être utilisé à l'intérieur d'un GlobalSyncProvider");
  }
  return context;
};

// Provider du contexte
export const GlobalSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  // Méthode pour mettre à jour l'état de synchronisation d'une table
  const updateSyncState = (tableName: string, state: Partial<SyncState>) => {
    setSyncStates(prev => ({
      ...prev,
      [tableName]: {
        ...(prev[tableName] || { isSyncing: false, lastSynced: null, syncFailed: false }),
        ...state
      }
    }));
  };
  
  // Méthode pour synchroniser une table spécifique
  const syncTable = async <T,>(tableName: string, data: T[]): Promise<boolean> => {
    if (!isOnline) {
      toast({ 
        title: "Mode hors ligne", 
        description: "La synchronisation n'est pas disponible en mode hors ligne" 
      });
      return false;
    }
    
    // Vérifier si la synchronisation est déjà en cours pour cette table
    if (syncStates[tableName]?.isSyncing) {
      toast({ 
        title: "Synchronisation en cours", 
        description: "Une synchronisation est déjà en cours pour cette table" 
      });
      return false;
    }
    
    // Mettre à jour l'état pour indiquer que la synchronisation est en cours
    updateSyncState(tableName, { isSyncing: true });
    
    try {
      const result = await triggerSync.triggerTableSync(tableName, data);
      
      // Mettre à jour l'état avec le résultat
      updateSyncState(tableName, {
        isSyncing: false,
        lastSynced: new Date(),
        syncFailed: !result
      });
      
      if (!result) {
        toast({
          title: "Échec de la synchronisation",
          description: `La synchronisation de ${tableName} a échoué`,
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Mettre à jour l'état en cas d'erreur
      updateSyncState(tableName, {
        isSyncing: false,
        syncFailed: true
      });
      
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Méthode pour synchroniser toutes les tables
  const syncAll = async (): Promise<Record<string, boolean>> => {
    if (!isOnline) {
      toast({ 
        title: "Mode hors ligne", 
        description: "La synchronisation n'est pas disponible en mode hors ligne" 
      });
      return {};
    }
    
    try {
      const results = await triggerSync.synchronizeAllPending();
      
      // Mettre à jour l'état de chaque table
      Object.entries(results).forEach(([tableName, result]) => {
        updateSyncState(tableName, {
          isSyncing: false,
          lastSynced: new Date(),
          syncFailed: !result
        });
      });
      
      const failedCount = Object.values(results).filter(r => !r).length;
      
      if (failedCount > 0) {
        toast({
          title: "Synchronisation partielle",
          description: `${failedCount} table(s) n'ont pas pu être synchronisées`,
          variant: "destructive"
        });
      } else if (Object.keys(results).length > 0) {
        toast({
          title: "Synchronisation réussie",
          description: "Toutes les tables ont été synchronisées"
        });
      }
      
      return results;
    } catch (error) {
      console.error("Erreur lors de la synchronisation globale:", error);
      
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
      
      return {};
    }
  };
  
  // Charger l'état de synchronisation initial depuis localStorage
  useEffect(() => {
    const loadSyncStates = () => {
      try {
        const userId = currentUser || 'p71x6d_system';
        const storedStates = localStorage.getItem(`sync_states_${userId}`);
        
        if (storedStates) {
          const parsedStates = JSON.parse(storedStates);
          
          // Convertir les dates de type string en objets Date
          Object.keys(parsedStates).forEach(tableName => {
            if (parsedStates[tableName].lastSynced) {
              parsedStates[tableName].lastSynced = new Date(parsedStates[tableName].lastSynced);
            }
          });
          
          setSyncStates(parsedStates);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des états de synchronisation:", error);
      }
    };
    
    loadSyncStates();
  }, [currentUser]);
  
  // Sauvegarder l'état de synchronisation dans localStorage lorsqu'il change
  useEffect(() => {
    const saveSyncStates = () => {
      try {
        const userId = currentUser || 'p71x6d_system';
        localStorage.setItem(`sync_states_${userId}`, JSON.stringify(syncStates));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des états de synchronisation:", error);
      }
    };
    
    saveSyncStates();
  }, [syncStates, currentUser]);
  
  // Créer l'objet de contexte avec toutes les valeurs
  const value: GlobalSyncContextType = {
    syncStates,
    syncTable,
    syncAll,
    updateSyncState,
    isOnline
  };
  
  return (
    <GlobalSyncContext.Provider value={value}>
      {children}
    </GlobalSyncContext.Provider>
  );
};
