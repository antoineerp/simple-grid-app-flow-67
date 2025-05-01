import { useState, useEffect, useCallback } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useSync } from './useSync';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { triggerSync } from '@/services/sync/triggerSync';

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
  
  const mutations = useExigenceMutations();
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  // Load data from local storage on initial render
  useEffect(() => {
    const loadLocalData = () => {
      try {
        const storedExigences = localStorage.getItem(`${tableName}_${currentUser}`);
        const storedGroups = localStorage.getItem(`${tableName}_groups_${currentUser}`);
        
        if (storedExigences) {
          const parsedExigences = JSON.parse(storedExigences);
          setExigences(parsedExigences);
          console.log(`Loaded ${parsedExigences.length} exigences from local storage`);
        }
        
        if (storedGroups) {
          const parsedGroups = JSON.parse(storedGroups);
          setGroups(parsedGroups);
          console.log(`Loaded ${parsedGroups.length} groups from local storage`);
        }
      } catch (error) {
        console.error("Error loading data from local storage:", error);
        setLoadError("Erreur lors du chargement des données locales");
      }
    };
    
    loadLocalData();
    
    // Try to load from server after loading from local storage
    syncWithServer().catch(error => {
      console.error("Error during initial sync:", error);
    });
  }, [currentUser]);

  // Save data to local storage whenever it changes
  useEffect(() => {
    if (exigences.length > 0) {
      localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(exigences));
      setDataChanged(true);
    }
  }, [exigences, currentUser]);
  
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem(`${tableName}_groups_${currentUser}`, JSON.stringify(groups));
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
        // Store the data that needs to be synced
        triggerSync.notifyDataChange(tableName, exigences);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dataChanged, exigences]);

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

  // Asynchrone et retourne une Promise<void>
  const handleResetLoadAttempts = async (): Promise<void> => {
    setLoadError(null);
    setLoadAttempts(0);
    return Promise.resolve();
  };

  const syncWithServer = async () => {
    if (!isOnline) {
      return { success: false, message: "Vous êtes hors ligne" };
    }
    
    // Only sync if there are actual changes
    if (!dataChanged && !syncFailed) {
      console.log("No changes to sync for exigences");
      return { success: true, message: "Aucun changement à synchroniser" };
    }

    try {
      const syncResult = await syncTable(tableName, exigences);
      
      if (syncResult) {
        setDataChanged(false);
        return { success: true, message: "Synchronisation réussie" };
      } else {
        return { success: false, message: "Échec de la synchronisation" };
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  };

  // Fonction pour la synchronisation avec retour de Promise
  const handleSync = async (): Promise<void> => {
    try {
      const result = await syncWithServer();
      if (loadError && result.success) {
        await handleResetLoadAttempts();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      return Promise.reject(error);
    }
  };

  // Adapter handleSaveExigence pour fonctionner avec un seul paramètre
  const handleSaveExigence = (exigence: Exigence) => {
    if (mutations && mutations.handleSaveExigence) {
      return mutations.handleSaveExigence(exigence);
    }
  };

  // Adapter handleSaveGroup pour fonctionner avec deux paramètres
  const handleSaveGroup = (group: ExigenceGroup, isEditing: boolean) => {
    if (groupOperations && groupOperations.handleSaveGroup) {
      return groupOperations.handleSaveGroup(group, isEditing);
    }
  };

  // Correctly implement handleDeleteGroup with mutations
  const handleDeleteGroup = useCallback((id: string) => {
    // Use mutations to delete the group and update state
    if (groupOperations && groupOperations.handleDeleteGroup) {
      groupOperations.handleDeleteGroup(id);
    }
  }, [groupOperations]);

  // Exporter les méthodes pour les changements d'exigences
  const handleDelete = useCallback((id: string) => {
    if (mutations && mutations.handleDeleteExigence) {
      mutations.handleDeleteExigence(id, exigences, setExigences);
    }
  }, [mutations, exigences]);

  const handleAddExigence = useCallback(() => {
    if (mutations && mutations.handleAddExigence) {
      mutations.handleAddExigence();
    }
  }, [mutations]);

  // Ajout des fonctions manquantes pour la gestion des responsabilités, atteintes et exclusions
  const handleResponsabiliteChange = useCallback((id: string, type: string, membres: string[]) => {
    setExigences(prev => 
      prev.map(e => {
        if (e.id === id) {
          return {
            ...e,
            responsabilites: {
              ...e.responsabilites,
              [type]: membres
            }
          };
        }
        return e;
      })
    );
  }, []);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setExigences(prev => 
      prev.map(e => {
        if (e.id === id) {
          return {
            ...e,
            atteinte,
            date_modification: new Date()
          };
        }
        return e;
      })
    );
  }, []);

  const handleExclusionChange = useCallback((id: string, exclusion: boolean) => {
    setExigences(prev => 
      prev.map(e => {
        if (e.id === id) {
          return {
            ...e,
            exclusion,
            date_modification: new Date()
          };
        }
        return e;
      })
    );
  }, []);

  // Ajout des fonctions manquantes pour les groupes
  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    if (groupOperations && groupOperations.handleGroupReorder) {
      groupOperations.handleGroupReorder(startIndex, endIndex);
    }
  }, [groupOperations]);

  const handleToggleGroup = useCallback((groupId: string) => {
    if (groupOperations && groupOperations.handleToggleGroup) {
      groupOperations.handleToggleGroup(groupId);
    }
  }, [groupOperations]);

  // Expose toutes les fonctions nécessaires des mutations et groupOperations
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
    handleSaveExigence,
    handleSaveGroup,
    handleDelete,
    handleAddExigence,
    handleDeleteGroup,
    syncWithServer,
    handleSync,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleGroupReorder,
    handleToggleGroup
  };
};
