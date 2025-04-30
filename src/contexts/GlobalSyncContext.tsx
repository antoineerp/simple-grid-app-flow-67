
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const initialSyncDoneRef = useRef<boolean>(false);
  const syncRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Log le mode de synchronisation au démarrage
  useEffect(() => {
    console.log("GlobalSyncContext: Mode de synchronisation - PRIORITÉ SERVEUR (Base de données Infomaniak)");
    console.log(`GlobalSyncContext: Statut de la connexion - ${isOnline ? "En ligne" : "Hors ligne"}`);
    
    // Si la connexion change, vérifier et synchroniser
    if (isOnline && !initialSyncDoneRef.current) {
      console.log("GlobalSyncContext: Connexion établie, déclenchement de synchronisation initiale");
      initialSyncDoneRef.current = true;
      
      // Laisser un peu de temps pour initialiser
      setTimeout(() => {
        syncAll().catch(error => {
          console.error("GlobalSyncContext: Erreur lors de la synchronisation initiale:", error);
        });
      }, 2000);
    }
  }, [isOnline]);
  
  // Méthode pour mettre à jour l'état de synchronisation d'une table
  const updateSyncState = useCallback((tableName: string, state: Partial<SyncState>) => {
    setSyncStates(prev => ({
      ...prev,
      [tableName]: {
        ...(prev[tableName] || { isSyncing: false, lastSynced: null, syncFailed: false }),
        ...state
      }
    }));
  }, []);
  
  // Méthode pour synchroniser une table spécifique
  const syncTable = useCallback(async <T,>(tableName: string, data: T[]): Promise<boolean> => {
    if (!isOnline) {
      console.log(`GlobalSyncContext: Tentative de synchronisation de ${tableName} en mode hors ligne`);
      // Sauvegarder quand même dans localStorage pour éviter la perte de données
      const userId = currentUser || 'p71x6d_system';
      localStorage.setItem(`${tableName}_${userId}`, JSON.stringify(data));
      
      toast({ 
        title: "Mode hors ligne", 
        description: `Les données de ${tableName} sont sauvegardées localement et seront synchronisées automatiquement lorsque la connexion sera rétablie.` 
      });
      return false;
    }
    
    // Vérifier si la synchronisation est déjà en cours pour cette table
    if (syncStates[tableName]?.isSyncing) {
      console.log(`GlobalSyncContext: Synchronisation déjà en cours pour ${tableName}`);
      return false;
    }
    
    // Mettre à jour l'état pour indiquer que la synchronisation est en cours
    updateSyncState(tableName, { isSyncing: true });
    console.log(`GlobalSyncContext: Début de la synchronisation de ${tableName} avec Infomaniak`);
    
    try {
      const result = await triggerSync.triggerTableSync(tableName, data);
      
      // Mettre à jour l'état avec le résultat
      updateSyncState(tableName, {
        isSyncing: false,
        lastSynced: result ? new Date() : syncStates[tableName]?.lastSynced || null,
        syncFailed: !result
      });
      
      if (!result) {
        console.error(`GlobalSyncContext: Échec de la synchronisation de ${tableName} avec Infomaniak`);
        
        toast({
          title: "Échec de la synchronisation",
          description: `La synchronisation de ${tableName} avec Infomaniak a échoué. Nouvelle tentative sera effectuée automatiquement.`,
          variant: "destructive"
        });
        
        // Planifier une nouvelle tentative dans 60 secondes
        if (syncRetryTimeoutRef.current) {
          clearTimeout(syncRetryTimeoutRef.current);
        }
        
        syncRetryTimeoutRef.current = setTimeout(() => {
          console.log(`GlobalSyncContext: Nouvelle tentative de synchronisation pour ${tableName}`);
          syncTable(data, tableName).catch(console.error);
        }, 60000);
      } else {
        console.log(`GlobalSyncContext: Synchronisation réussie de ${tableName} avec Infomaniak`);
      }
      
      return result;
    } catch (error) {
      console.error(`GlobalSyncContext: Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Mettre à jour l'état en cas d'erreur
      updateSyncState(tableName, {
        isSyncing: false,
        syncFailed: true
      });
      
      // Sauvegarder dans localStorage comme solution de secours
      const userId = currentUser || 'p71x6d_system';
      localStorage.setItem(`${tableName}_${userId}`, JSON.stringify(data));
      localStorage.setItem(`sync_pending_${tableName}`, new Date().toISOString());
      
      toast({
        title: "Erreur de synchronisation",
        description: `Une erreur est survenue lors de la synchronisation de ${tableName} avec Infomaniak. Nouvelle tentative sera effectuée automatiquement.`,
        variant: "destructive"
      });
      
      // Planifier une nouvelle tentative dans 60 secondes
      if (syncRetryTimeoutRef.current) {
        clearTimeout(syncRetryTimeoutRef.current);
      }
      
      syncRetryTimeoutRef.current = setTimeout(() => {
        console.log(`GlobalSyncContext: Nouvelle tentative de synchronisation pour ${tableName} après erreur`);
        syncTable(data, tableName).catch(console.error);
      }, 60000);
      
      return false;
    }
  }, [isOnline, syncStates, updateSyncState, currentUser, toast]);
  
  // Méthode pour synchroniser toutes les tables
  const syncAll = useCallback(async (): Promise<Record<string, boolean>> => {
    if (!isOnline) {
      console.log("GlobalSyncContext: Tentative de synchronisation globale en mode hors ligne");
      toast({ 
        title: "Mode hors ligne", 
        description: "La synchronisation avec Infomaniak n'est pas disponible en mode hors ligne. Les données sont sauvegardées localement." 
      });
      return {};
    }
    
    console.log("GlobalSyncContext: Début de synchronisation globale avec Infomaniak");
    
    try {
      const results = await triggerSync.synchronizeAllPending();
      
      // Mettre à jour l'état de chaque table
      Object.entries(results).forEach(([tableName, result]) => {
        updateSyncState(tableName, {
          isSyncing: false,
          lastSynced: result ? new Date() : syncStates[tableName]?.lastSynced || null,
          syncFailed: !result
        });
      });
      
      const failedCount = Object.values(results).filter(r => !r).length;
      const totalCount = Object.keys(results).length;
      
      if (failedCount > 0) {
        console.warn(`GlobalSyncContext: ${failedCount}/${totalCount} tables n'ont pas pu être synchronisées avec Infomaniak`);
        
        toast({
          title: "Synchronisation partielle",
          description: `${failedCount}/${totalCount} tables n'ont pas pu être synchronisées avec Infomaniak. Nouvelle tentative automatique dans 1 minute.`,
          variant: "destructive"
        });
        
        // Planifier une nouvelle tentative dans 60 secondes
        if (syncRetryTimeoutRef.current) {
          clearTimeout(syncRetryTimeoutRef.current);
        }
        
        syncRetryTimeoutRef.current = setTimeout(() => {
          console.log(`GlobalSyncContext: Nouvelle tentative de synchronisation globale`);
          syncAll().catch(console.error);
        }, 60000);
      } else if (totalCount > 0) {
        console.log(`GlobalSyncContext: ${totalCount} tables synchronisées avec succès avec Infomaniak`);
        
        toast({
          title: "Synchronisation réussie",
          description: `${totalCount} tables ont été synchronisées avec Infomaniak`
        });
      } else {
        console.log("GlobalSyncContext: Aucune table à synchroniser");
      }
      
      return results;
    } catch (error) {
      console.error("GlobalSyncContext: Erreur lors de la synchronisation globale avec Infomaniak:", error);
      
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation globale avec Infomaniak. Nouvelle tentative automatique dans 1 minute.",
        variant: "destructive"
      });
      
      // Planifier une nouvelle tentative dans 60 secondes
      if (syncRetryTimeoutRef.current) {
        clearTimeout(syncRetryTimeoutRef.current);
      }
      
      syncRetryTimeoutRef.current = setTimeout(() => {
        console.log(`GlobalSyncContext: Nouvelle tentative de synchronisation globale après erreur`);
        syncAll().catch(console.error);
      }, 60000);
      
      return {};
    }
  }, [isOnline, updateSyncState, syncStates, toast]);
  
  // Charger l'état de synchronisation initial depuis localStorage et tenter une première synchronisation
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
          console.log("GlobalSyncContext: États de synchronisation chargés depuis localStorage");
        }
        
        // Tenter une synchronisation initiale si en ligne
        if (isOnline) {
          console.log("GlobalSyncContext: Tentative de synchronisation initiale avec Infomaniak");
          initialSyncDoneRef.current = true;
          
          setTimeout(() => {
            syncAll().catch(error => {
              console.error("GlobalSyncContext: Erreur lors de la synchronisation initiale:", error);
            });
          }, 2000);
        }
      } catch (error) {
        console.error("GlobalSyncContext: Erreur lors du chargement des états de synchronisation:", error);
      }
    };
    
    loadSyncStates();
    
    // Mettre en place un intervalle pour la synchronisation périodique (toutes les 5 minutes)
    const intervalId = setInterval(() => {
      if (isOnline) {
        console.log("GlobalSyncContext: Synchronisation périodique déclenchée");
        syncAll().catch(error => {
          console.error("GlobalSyncContext: Erreur lors de la synchronisation périodique:", error);
        });
      }
    }, 300000); // 5 minutes
    
    // Nettoyage lors du démontage du composant
    return () => {
      clearInterval(intervalId);
      if (syncRetryTimeoutRef.current) {
        clearTimeout(syncRetryTimeoutRef.current);
      }
    };
  }, [currentUser, isOnline, syncAll]);
  
  // Sauvegarder l'état de synchronisation dans localStorage lorsqu'il change
  useEffect(() => {
    const saveSyncStates = () => {
      try {
        const userId = currentUser || 'p71x6d_system';
        localStorage.setItem(`sync_states_${userId}`, JSON.stringify(syncStates));
      } catch (error) {
        console.error("GlobalSyncContext: Erreur lors de la sauvegarde des états de synchronisation:", error);
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
