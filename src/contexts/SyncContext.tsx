
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  pendingSync: boolean;
  dataChanged: boolean;
}

interface SyncContextType {
  syncStates: Record<string, SyncState>;
  isOnline: boolean;
  lastOnlineChange: Date | null;
  registerSync: (entityName: string, initialState?: Partial<SyncState>) => void;
  updateSyncState: (entityName: string, updates: Partial<SyncState>) => void;
  syncAll: () => Promise<Record<string, boolean>>;
  forceProcessQueue: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};

interface SyncProviderProps {
  children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  const [lastOnlineChange, setLastOnlineChange] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const entitiesRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Array<{ entityName: string, timestamp: number }>>([]);
  const processingRef = useRef<boolean>(false);
  const currentUser = getCurrentUser() || 'p71x6d_system';

  // Détecter les changements de connectivité
  useEffect(() => {
    setLastOnlineChange(new Date());
    
    if (isOnline) {
      console.log('SyncContext: Connexion rétablie, programmation de la synchronisation');
      
      // Afficher une notification
      toast({
        title: isOnline ? "Connexion rétablie" : "Mode hors ligne",
        description: isOnline ? "La synchronisation des données va démarrer automatiquement" : "Les données sont sauvegardées localement",
        variant: isOnline ? "default" : "destructive"
      });
      
      // Programmer une synchronisation après un court délai
      if (isOnline) {
        const timeoutId = setTimeout(() => {
          syncAll().catch(error => {
            console.error('SyncContext: Erreur lors de la synchronisation automatique:', error);
          });
        }, 3000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isOnline]);

  // Enregistrer une entité pour la synchronisation
  const registerSync = useCallback((entityName: string, initialState?: Partial<SyncState>) => {
    console.log(`SyncContext: Enregistrement de ${entityName}`);
    
    entitiesRef.current.add(entityName);
    
    setSyncStates(prev => {
      // Ne pas écraser l'état existant si présent
      if (prev[entityName]) {
        return prev;
      }
      
      return {
        ...prev,
        [entityName]: {
          isSyncing: false,
          lastSynced: null,
          syncFailed: false,
          pendingSync: false,
          dataChanged: false,
          ...initialState
        }
      };
    });
  }, []);

  // Mettre à jour l'état de synchronisation d'une entité
  const updateSyncState = useCallback((entityName: string, updates: Partial<SyncState>) => {
    setSyncStates(prev => {
      const current = prev[entityName] || {
        isSyncing: false,
        lastSynced: null,
        syncFailed: false,
        pendingSync: false,
        dataChanged: false
      };
      
      return {
        ...prev,
        [entityName]: { ...current, ...updates }
      };
    });
    
    // Si marque en attente ou modifié, ajouter à la file d'attente
    if (updates.pendingSync || updates.dataChanged) {
      queueRef.current.push({
        entityName,
        timestamp: Date.now()
      });
      
      // Trier la file par timestamp (plus ancien en premier)
      queueRef.current.sort((a, b) => a.timestamp - b.timestamp);
    }
  }, []);

  // Traitement de la file d'attente de synchronisation
  const processQueue = useCallback(async () => {
    if (processingRef.current || !isOnline || queueRef.current.length === 0) {
      return;
    }
    
    processingRef.current = true;
    console.log(`SyncContext: Traitement de la file d'attente (${queueRef.current.length} éléments)`);
    
    try {
      const item = queueRef.current.shift();
      if (item) {
        const { entityName } = item;
        
        // Charger les données depuis le stockage local
        const storageKey = `${entityName}_${currentUser}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            const data = JSON.parse(storedData);
            
            // Construire l'URL pour la synchronisation
            const baseApiUrl = window.location.origin + '/api';
            const url = `${baseApiUrl}/${entityName}-sync.php`;
            
            console.log(`SyncContext: Synchronisation de ${entityName} avec ${url}`);
            
            // Mettre à jour l'état
            updateSyncState(entityName, { isSyncing: true });
            
            // Synchroniser avec le serveur
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: currentUser,
                [entityName]: data
              })
            });
            
            if (!response.ok) {
              throw new Error(`Erreur HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
              console.log(`SyncContext: Synchronisation réussie pour ${entityName}`);
              
              updateSyncState(entityName, {
                isSyncing: false,
                lastSynced: new Date(),
                syncFailed: false,
                pendingSync: false,
                dataChanged: false
              });
            } else {
              throw new Error(result.message || 'Échec de synchronisation');
            }
          } catch (error) {
            console.error(`SyncContext: Erreur lors de la synchronisation de ${entityName}:`, error);
            
            updateSyncState(entityName, {
              isSyncing: false,
              syncFailed: true
            });
            
            // Remettre l'élément dans la file d'attente pour réessayer plus tard
            queueRef.current.push({
              entityName,
              timestamp: Date.now() + 60000 // Attendre 1 minute avant de réessayer
            });
            
            // Trier la file d'attente
            queueRef.current.sort((a, b) => a.timestamp - b.timestamp);
          }
        }
      }
    } finally {
      processingRef.current = false;
      
      // S'il reste des éléments dans la file d'attente, planifier le traitement suivant
      if (queueRef.current.length > 0 && isOnline) {
        setTimeout(() => {
          processQueue().catch(console.error);
        }, 5000); // Attendre 5 secondes entre les synchronisations
      }
    }
  }, [isOnline, updateSyncState, currentUser]);

  // Force le traitement de la file d'attente
  const forceProcessQueue = useCallback(() => {
    if (isOnline && !processingRef.current) {
      processQueue().catch(console.error);
    }
  }, [isOnline, processQueue]);

  // Synchroniser toutes les entités enregistrées
  const syncAll = useCallback(async (): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {};
    
    if (!isOnline) {
      console.log('SyncContext: Mode hors ligne, impossible de synchroniser toutes les entités');
      return results;
    }
    
    console.log(`SyncContext: Synchronisation de toutes les entités (${entitiesRef.current.size})`);
    
    // Pour chaque entité enregistrée
    for (const entityName of entitiesRef.current) {
      try {
        // Charger les données depuis le stockage local
        const storageKey = `${entityName}_${currentUser}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            const data = JSON.parse(storedData);
            
            // Construire l'URL pour la synchronisation
            const baseApiUrl = window.location.origin + '/api';
            const url = `${baseApiUrl}/${entityName}-sync.php`;
            
            console.log(`SyncContext: Synchronisation de ${entityName} avec ${url}`);
            
            // Mettre à jour l'état
            updateSyncState(entityName, { isSyncing: true });
            
            // Synchroniser avec le serveur
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: currentUser,
                [entityName]: data
              })
            });
            
            if (!response.ok) {
              throw new Error(`Erreur HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
              console.log(`SyncContext: Synchronisation réussie pour ${entityName}`);
              
              updateSyncState(entityName, {
                isSyncing: false,
                lastSynced: new Date(),
                syncFailed: false,
                pendingSync: false,
                dataChanged: false
              });
              
              results[entityName] = true;
            } else {
              throw new Error(result.message || 'Échec de synchronisation');
            }
          } catch (error) {
            console.error(`SyncContext: Erreur lors de la synchronisation de ${entityName}:`, error);
            
            updateSyncState(entityName, {
              isSyncing: false,
              syncFailed: true
            });
            
            results[entityName] = false;
          }
        } else {
          // Pas de données à synchroniser
          results[entityName] = true;
        }
      } catch (error) {
        console.error(`SyncContext: Erreur lors du traitement de ${entityName}:`, error);
        results[entityName] = false;
      }
      
      // Pause entre les synchronisations pour éviter de surcharger le serveur
      if (Array.from(entitiesRef.current).indexOf(entityName) < entitiesRef.current.size - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }, [isOnline, updateSyncState, currentUser]);

  // Démarrer le traitement de la file d'attente lorsque la connexion est rétablie
  useEffect(() => {
    if (isOnline && queueRef.current.length > 0) {
      const timeoutId = setTimeout(() => {
        processQueue().catch(console.error);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, processQueue]);

  // Vérifier régulièrement s'il y a des données à synchroniser
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isOnline && queueRef.current.length > 0 && !processingRef.current) {
        processQueue().catch(console.error);
      }
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [isOnline, processQueue]);

  return (
    <SyncContext.Provider value={{
      syncStates,
      isOnline,
      lastOnlineChange,
      registerSync,
      updateSyncState,
      syncAll,
      forceProcessQueue
    }}>
      {children}
    </SyncContext.Provider>
  );
};
