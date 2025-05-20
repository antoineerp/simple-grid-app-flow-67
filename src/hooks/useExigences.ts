import { useState, useEffect } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useSync } from './useSync';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { triggerSync } from '@/services/sync/triggerSync';
import { verifyJsonEndpoint } from '@/services/sync/robustSyncService';
import { saveLocalData, loadLocalData, syncWithServer } from '@/services/sync/AutoSyncService';

export const useExigences = () => {
  const { toast } = useToast();
  const { syncTable, syncStates, isOnline } = useGlobalSync();
  
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
      
      // Si l'objet est stringifiable, l'utiliser comme identifiant (éviter [object Object])
      try {
        const userId = JSON.stringify(user);
        if (userId !== '{}' && userId !== '[object Object]') {
          console.warn("Utilisation d'un identifiant utilisateur stringifié:", userId.substring(0, 20));
          return `user_${Math.random().toString(36).substring(2, 9)}`;
        }
      } catch (err) {
        console.error("Erreur lors de la stringification de l'utilisateur:", err);
      }
      
      console.warn("Aucun identifiant valide trouvé dans l'objet utilisateur:", user);
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
  const [dataChanged, setDataChanged] = useState(false);

  // Get synchronization state for exigences from the global sync context
  const tableName = 'exigences';
  const syncState = syncStates[tableName] || { 
    isSyncing: false, 
    lastSynced: null, 
    syncFailed: false 
  };
  const isSyncing = syncState.isSyncing;
  const lastSynced = syncState.lastSynced;
  const syncFailed = syncState.syncFailed;
  
  const mutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  // Load data from local storage on initial render
  useEffect(() => {
    const loadLocalDataFromStorage = () => {
      try {
        // Utiliser le nouveau système de chargement centralisé
        const localExigences = loadLocalData<Exigence>(tableName);
        const localGroups = loadLocalData<ExigenceGroup>(`${tableName}_groups`);
        
        if (localExigences.length > 0) {
          setExigences(localExigences);
          console.log(`Loaded ${localExigences.length} exigences from local storage`);
        }
        
        if (localGroups.length > 0) {
          setGroups(localGroups);
          console.log(`Loaded ${localGroups.length} groups from local storage`);
        }
      } catch (error) {
        console.error("Error loading data from local storage:", error);
        setLoadError("Erreur lors du chargement des données locales");
      }
    };
    
    loadLocalDataFromStorage();
    
    // Try to sync with server after loading from local storage
    syncWithServerWrapper().catch(error => {
      console.error("Error during initial sync:", error);
    });
  }, [currentUser]);

  // Save data to local storage whenever it changes
  useEffect(() => {
    if (exigences.length > 0) {
      // Utiliser le nouveau système de sauvegarde centralisé
      saveLocalData(tableName, exigences);
      setDataChanged(true);
    }
  }, [exigences, currentUser]);
  
  useEffect(() => {
    if (groups.length > 0) {
      // Utiliser le nouveau système de sauvegarde centralisé
      saveLocalData(`${tableName}_groups`, groups);
      setDataChanged(true);
    }
  }, [groups, currentUser]);

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
      if (dataChanged) {
        // Sauvegarder les données localement avant de quitter
        saveLocalData(tableName, exigences);
        if (groups.length > 0) {
          saveLocalData(`${tableName}_groups`, groups);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dataChanged, exigences, groups]);

  const handleEdit = (id: string) => {
    const exigenceToEdit = exigences.find(exigence => exigence.id === id);
    if (exigenceToEdit) {
      setEditingExigence(exigenceToEdit);
      setDialogOpen(true);
    }
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    setExigences(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId === 'null' ? undefined : targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  // Réinitialisation des tentatives de chargement
  const handleResetLoadAttempts = async (): Promise<void> => {
    setLoadError(null);
    setLoadAttempts(0);
    return Promise.resolve();
  };

  // Synchronisation avec le serveur en utilisant le nouveau système centralisé
  const syncWithServerWrapper = async () => {
    if (!isOnline) {
      return { success: false, message: "Vous êtes hors ligne" };
    }
    
    // Only sync if there are actual changes
    if (!dataChanged && !syncFailed) {
      console.log("No changes to sync for exigences");
      return { success: true, message: "Aucun changement à synchroniser" };
    }

    try {
      // Vérifier que l'endpoint JSON est valide
      const isEndpointValid = await verifyJsonEndpoint();
      if (!isEndpointValid) {
        console.error("API endpoint is not returning valid JSON");
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: "Le serveur ne répond pas correctement. Les données sont sauvegardées localement uniquement."
        });
        return { success: false, message: "Point de terminaison API invalide" };
      }

      // Utiliser le nouveau système de synchronisation centralisé
      const success = await syncWithServer(tableName, exigences);
      
      if (success) {
        setDataChanged(false);
        return { success: true, message: "Synchronisation réussie" };
      } else {
        return { success: false, message: "Échec de la synchronisation" };
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      // Don't clear local data on sync failure
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  };

  // Function for synchronization with Promise return
  const handleSync = async (): Promise<void> => {
    try {
      const result = await syncWithServerWrapper();
      if (loadError && result.success) {
        await handleResetLoadAttempts();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      console.error("Synchronisation échouée, données conservées localement:", error);
      return Promise.resolve();
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
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleResetLoadAttempts,
    ...mutations,
    ...groupOperations,
    syncWithServer: syncWithServerWrapper,
    handleSync
  };
};
