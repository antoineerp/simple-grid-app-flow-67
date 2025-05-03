
import { useState, useEffect, useCallback } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useSync } from '@/hooks/useSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncContext } from '@/features/sync/hooks/useSyncContext';
import { loadLocalData, saveLocalData } from '@/features/sync/utils/syncStorageManager';
import { triggerSync } from '@/services/sync/triggerSync';

export const useExigences = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { syncTable, syncStates } = useSyncContext();
  const deviceId = localStorage.getItem('deviceId') || 'unknown';

  // Extraire un identifiant utilisateur valide
  const extractValidUserId = (user: any): string => {
    if (!user) {
      console.warn("Aucun utilisateur fourni, utilisation de l'ID système");
      return 'p71x6d_system';
    }
    
    // Si c'est déjà une chaîne, la retourner directement
    if (typeof user === 'string') {
      return user;
    }
    
    // Si c'est un objet, essayer d'extraire un identifiant
    if (typeof user === 'object') {
      // Vérifier si l'objet n'est pas null
      if (user === null) {
        console.warn("Objet utilisateur null, utilisation de l'ID système");
        return 'p71x6d_system';
      }
      
      // Identifiants potentiels par ordre de priorité
      const possibleIds = ['identifiant_technique', 'email', 'id'];
      
      for (const idField of possibleIds) {
        if (user[idField] && typeof user[idField] === 'string') {
          console.log(`ID utilisateur extrait: ${idField} = ${user[idField]}`);
          return user[idField];
        }
      }
      
      console.warn("Aucun identifiant valide trouvé dans l'objet utilisateur");
    }
    
    console.warn("Type d'utilisateur non pris en charge, utilisation de l'ID système");
    return 'p71x6d_system';
  };

  // Récupérer l'utilisateur et extraire un ID valide
  const user = getCurrentUser();
  const currentUser = extractValidUserId(user);
  console.log("ID utilisateur extrait pour les exigences:", currentUser);
  
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [stats, setStats] = useState<ExigenceStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Récupérer l'état de synchronisation depuis le contexte global
  const tableName = 'exigences';
  const syncState = syncStates[tableName] || { 
    isSyncing: false, 
    lastSynced: null, 
    syncFailed: false 
  };
  const isSyncing = syncState.isSyncing;
  const lastSynced = syncState.lastSynced ? new Date(syncState.lastSynced) : null;
  const syncFailed = syncState.syncFailed;
  
  const mutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  // Fonctions de synchronisation avec le serveur
  const fetchFromServer = useCallback(async () => {
    if (!isOnline) {
      setLoadError("Mode hors ligne. Utilisation des données locales.");
      return false;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      if (!API_URL) {
        throw new Error("URL de l'API non configurée");
      }

      const timestamp = new Date().getTime();
      const url = `${API_URL}/exigences-load.php?userId=${currentUser}&_t=${timestamp}&deviceId=${deviceId}`;
      
      console.log(`Chargement des exigences depuis ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Échec du chargement des données");
      }

      if (data.exigences && Array.isArray(data.exigences)) {
        // Formater les dates
        const formattedExigences = data.exigences.map((exigence: any) => ({
          ...exigence,
          date_creation: exigence.date_creation ? new Date(exigence.date_creation) : new Date(),
          date_modification: exigence.date_modification ? new Date(exigence.date_modification) : new Date()
        }));
        
        setExigences(formattedExigences);
        console.log(`${formattedExigences.length} exigences chargées depuis le serveur`);
        
        // Sauvegarder en local
        saveLocalData(tableName, formattedExigences, currentUser);
      }

      if (data.groups && Array.isArray(data.groups)) {
        setGroups(data.groups);
        console.log(`${data.groups.length} groupes chargés depuis le serveur`);
        
        // Sauvegarder les groupes en local
        saveLocalData(`${tableName}_groups`, data.groups, currentUser);
      }

      setLoadError(null);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error("Erreur lors du chargement des exigences:", errorMessage);
      setLoadError(`Erreur de chargement: ${errorMessage}`);
      return false;
    }
  }, [currentUser, isOnline, deviceId]);

  // Synchroniser avec le serveur (envoi des données)
  const syncWithServer = useCallback(async () => {
    if (!isOnline) {
      return { success: false, message: "Mode hors ligne. Synchronisation impossible." };
    }

    try {
      const result = await syncTable(tableName, {
        exigences,
        groups,
        userId: currentUser,
        deviceId
      });
      
      if (result && result.success) {
        // Mettre à jour les données locales avec confirmation
        saveLocalData(tableName, exigences, currentUser);
        saveLocalData(`${tableName}_groups`, groups, currentUser);
        return { success: true, message: "Synchronisation réussie" };
      } else {
        const errorMsg = result?.message || "Échec de la synchronisation";
        console.error(`Erreur lors de la synchronisation des exigences: ${errorMsg}`);
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error("Exception lors de la synchronisation des exigences:", errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [currentUser, exigences, groups, isOnline, syncTable, tableName, deviceId]);

  // Load data from local storage on initial render
  useEffect(() => {
    if (!initialLoadDone) {
      const loadInitialData = async () => {
        try {
          // Charger d'abord depuis le stockage local
          const localExigences = loadLocalData<Exigence>(tableName, currentUser);
          const localGroups = loadLocalData<ExigenceGroup>(`${tableName}_groups`, currentUser);
          
          if (localExigences.length > 0) {
            // Formater les dates
            const formattedExigences = localExigences.map(exigence => ({
              ...exigence,
              date_creation: exigence.date_creation ? new Date(exigence.date_creation) : new Date(),
              date_modification: exigence.date_modification ? new Date(exigence.date_modification) : new Date()
            }));
            
            setExigences(formattedExigences);
            console.log(`${formattedExigences.length} exigences chargées depuis le stockage local`);
          }
          
          if (localGroups.length > 0) {
            setGroups(localGroups);
            console.log(`${localGroups.length} groupes chargés depuis le stockage local`);
          }
          
          // Ensuite essayer de charger depuis le serveur si en ligne
          if (isOnline) {
            await fetchFromServer();
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          console.error("Erreur lors du chargement initial des exigences:", errorMessage);
          setLoadError(`Erreur de chargement: ${errorMessage}`);
        } finally {
          setInitialLoadDone(true);
        }
      };
      
      loadInitialData();
    }
  }, [currentUser, fetchFromServer, initialLoadDone, isOnline]);

  // Stats calculation
  useEffect(() => {
    const exclusionCount = exigences.filter(e => e.exclusion).length;
    const nonExcludedExigences = exigences.filter(e => !e.exclusion);
    
    const newStats = {
      exclusion: exclusionCount,
      nonConforme: nonExcludedExigences.filter(e => e.atteinte === 'NC').length,
      partiellementConforme: nonExcludedExigences.filter(e => e.atteinte === 'PC').length,
      conforme: nonExcludedExigences.filter(e => e.atteinte === 'C').length,
      total: nonExcludedExigences.length
    };
    setStats(newStats);
  }, [exigences]);

  // Listen for window beforeunload event to sync data if needed
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Store the data that needs to be synced for later
      triggerSync.notifyDataChange(tableName, { exigences, groups, userId: currentUser });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, exigences, groups]);

  // Actions de base
  const handleEdit = useCallback((id: string) => {
    const exigenceToEdit = exigences.find(exigence => exigence.id === id);
    if (exigenceToEdit) {
      setEditingExigence(exigenceToEdit);
      setDialogOpen(true);
    }
  }, [exigences]);

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    setExigences(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId === 'null' ? undefined : targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      
      // Déclencher une synchronisation automatique après réordonnancement
      setTimeout(() => {
        syncWithServer().catch(error => {
          console.error("Erreur lors de la synchronisation après réorganisation:", error);
        });
      }, 500);
      
      return result;
    });
  }, [syncWithServer]);

  const handleSaveExigence = useCallback((exigence: Exigence) => {
    const updatedExigence = {
      ...exigence,
      userId: currentUser,
      date_modification: new Date()
    };
    
    // Mise à jour de l'exigence
    const existingIndex = exigences.findIndex(e => e.id === exigence.id);
    
    if (existingIndex >= 0) {
      // Modification d'une exigence existante
      setExigences(prev => {
        const updated = [...prev];
        updated[existingIndex] = updatedExigence;
        return updated;
      });
    } else {
      // Nouvelle exigence
      setExigences(prev => [...prev, updatedExigence]);
    }
    
    // Déclencher une synchronisation automatique
    setTimeout(() => {
      syncWithServer().catch(error => {
        console.error("Erreur lors de la synchronisation après sauvegarde:", error);
      });
    }, 500);
    
    setDialogOpen(false);
  }, [currentUser, exigences, syncWithServer]);

  const handleResetLoadAttempts = async (): Promise<void> => {
    setLoadError(null);
    setLoadAttempts(0);
    return Promise.resolve();
  };

  // Fonction pour la synchronisation forcée
  const handleSync = async (): Promise<boolean> => {
    try {
      // Tenter d'abord le chargement à partir du serveur
      const serverResult = await fetchFromServer();
      
      if (serverResult) {
        // Si le chargement réussit, réinitialiser les erreurs
        if (loadError) {
          await handleResetLoadAttempts();
        }
        return true;
      } else {
        // Si le chargement échoue, tenter la synchronisation inverse
        const syncResult = await syncWithServer();
        return syncResult.success;
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation forcée:", error);
      return false;
    }
  };

  return {
    exigences,
    groups,
    stats,
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    isOnline,
    lastSynced,
    loadError,
    syncFailed,
    deviceId,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleSaveExigence,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleResetLoadAttempts,
    ...mutations,
    ...groupOperations,
    syncWithServer,
    handleSync,
    fetchFromServer
  };
};
