
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
  const pendingSyncTablesRef = useRef<Set<string>>(new Set());
  
  // Log le mode de synchronisation au démarrage
  useEffect(() => {
    console.log("GlobalSyncContext: Mode de synchronisation - PRIORITÉ SERVEUR");
    console.log(`GlobalSyncContext: Statut de la connexion - ${isOnline ? "En ligne" : "Hors ligne"}`);
    
    // Si la connexion change, vérifier et synchroniser
    if (isOnline && !initialSyncDoneRef.current) {
      console.log("GlobalSyncContext: Connexion établie, préparation synchronisation initiale");
      initialSyncDoneRef.current = true;
      
      // Synchronisation après un court délai pour initialisation
      setTimeout(() => {
        syncAll().catch(error => {
          console.error("GlobalSyncContext: Erreur synchronisation initiale:", error);
        });
      }, 2000);
    }
  }, [isOnline]);
  
  // Écouter les changements de route pour re-synchroniser les données si nécessaire
  useEffect(() => {
    const handleRouteChange = () => {
      console.log("GlobalSyncContext: Changement de route détecté, vérification des synchronisations en attente");
      
      if (isOnline && pendingSyncTablesRef.current.size > 0) {
        console.log("GlobalSyncContext: Tables en attente de synchronisation:", Array.from(pendingSyncTablesRef.current));
        
        // Tenter de synchroniser les données en attente après un changement de route
        setTimeout(() => {
          Array.from(pendingSyncTablesRef.current).forEach(tableName => {
            console.log(`GlobalSyncContext: Tentative de re-synchronisation pour ${tableName} après navigation`);
            
            // Récupérer les données depuis localStorage
            try {
              const storageKey = `${tableName}_${currentUser || 'default'}`;
              const storedData = localStorage.getItem(storageKey);
              
              if (storedData) {
                const data = JSON.parse(storedData);
                if (data && data.length > 0) {
                  console.log(`GlobalSyncContext: Données trouvées pour ${tableName}, synchronisation`);
                  
                  syncTable(tableName, data)
                    .then(success => {
                      if (success) {
                        console.log(`GlobalSyncContext: Re-synchronisation réussie pour ${tableName}`);
                        pendingSyncTablesRef.current.delete(tableName);
                      }
                    })
                    .catch(err => console.error(`GlobalSyncContext: Erreur re-synchronisation ${tableName}:`, err));
                }
              }
            } catch (error) {
              console.error(`GlobalSyncContext: Erreur récupération données ${tableName}:`, error);
            }
          });
        }, 500);
      }
    };
    
    // Écouter les événements de changement d'URL
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isOnline, currentUser]);
  
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
  
  // Méthode pour synchroniser une table spécifique - corrigée pour le typage
  const syncTable = useCallback(async <T,>(tableName: string, data: T[]): Promise<boolean> => {
    if (!tableName || !data) {
      console.error("GlobalSyncContext: Tentative de synchronisation avec données/table invalides");
      return false;
    }
    
    if (!isOnline) {
      console.log(`GlobalSyncContext: Mode hors ligne, données ${tableName} sauvegardées localement`);
      
      // Sauvegarder dans localStorage
      try {
        const userId = currentUser || 'default';
        localStorage.setItem(`${tableName}_${userId}`, JSON.stringify(data));
      } catch (error) {
        console.error(`GlobalSyncContext: Erreur sauvegarde locale ${tableName}:`, error);
      }
      
      // Marquer comme en attente de synchronisation
      pendingSyncTablesRef.current.add(tableName);
      
      return false;
    }
    
    // Mettre à jour l'état pour indiquer que la synchronisation est en cours
    updateSyncState(tableName, { isSyncing: true });
    
    try {
      console.log(`GlobalSyncContext: Synchronisation ${tableName} initiée, ${data.length} éléments`);
      
      // Utiliser le service triggerSync pour la synchronisation
      const result = await triggerSync.triggerTableSync(tableName, data);
      
      // Mettre à jour l'état après la synchronisation
      updateSyncState(tableName, { 
        isSyncing: false,
        lastSynced: result ? new Date() : null,
        syncFailed: !result
      });
      
      if (result) {
        console.log(`GlobalSyncContext: Synchronisation ${tableName} réussie`);
        pendingSyncTablesRef.current.delete(tableName); // Retirer de la liste d'attente
      } else {
        console.log(`GlobalSyncContext: Synchronisation ${tableName} échouée, marquée pour réessai`);
        pendingSyncTablesRef.current.add(tableName); // Ajouter à la liste d'attente
      }
      
      return result;
    } catch (error) {
      console.error(`GlobalSyncContext: Erreur synchronisation ${tableName}:`, error);
      
      updateSyncState(tableName, {
        isSyncing: false,
        syncFailed: true
      });
      
      // Ajouter à la liste d'attente pour réessai
      pendingSyncTablesRef.current.add(tableName);
      
      return false;
    }
  }, [isOnline, currentUser, updateSyncState]);
  
  // Méthode pour synchroniser toutes les tables
  const syncAll = useCallback(async (): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {};
    
    // Vérifier s'il y a des tables en attente de synchronisation
    if (pendingSyncTablesRef.current.size > 0) {
      console.log("GlobalSyncContext: Synchronisation de toutes les tables en attente");
      
      const tablesArray = Array.from(pendingSyncTablesRef.current);
      
      for (const tableName of tablesArray) {
        try {
          // Récupérer les données depuis localStorage
          const storageKey = `${tableName}_${currentUser || 'default'}`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const data = JSON.parse(storedData);
            if (data && data.length > 0) {
              console.log(`GlobalSyncContext: Synchronisation ${tableName} avec ${data.length} éléments`);
              
              const success = await syncTable(tableName, data);
              results[tableName] = success;
              
              if (success) {
                pendingSyncTablesRef.current.delete(tableName);
              }
            } else {
              results[tableName] = true; // Rien à synchroniser
              pendingSyncTablesRef.current.delete(tableName);
            }
          } else {
            results[tableName] = true; // Pas de données, considéré comme succès
            pendingSyncTablesRef.current.delete(tableName);
          }
        } catch (error) {
          console.error(`GlobalSyncContext: Erreur lors de la synchronisation de ${tableName}:`, error);
          results[tableName] = false;
        }
      }
    } else {
      console.log("GlobalSyncContext: Aucune table en attente de synchronisation");
    }
    
    return results;
  }, [currentUser, syncTable]);
  
  // Détection des changements de connexion réseau pour re-synchroniser
  useEffect(() => {
    const handleOnline = () => {
      console.log("GlobalSyncContext: Connexion réseau rétablie, tentative de synchronisation");
      
      if (syncRetryTimeoutRef.current) {
        clearTimeout(syncRetryTimeoutRef.current);
      }
      
      syncRetryTimeoutRef.current = setTimeout(() => {
        syncAll().catch(error => {
          console.error("GlobalSyncContext: Erreur lors de la synchronisation après reconnexion:", error);
        });
      }, 2000);
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      if (syncRetryTimeoutRef.current) {
        clearTimeout(syncRetryTimeoutRef.current);
      }
    };
  }, [syncAll]);
  
  return (
    <GlobalSyncContext.Provider value={{ syncStates, syncTable, syncAll, updateSyncState, isOnline }}>
      {children}
    </GlobalSyncContext.Provider>
  );
};
