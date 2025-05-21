import { useState, useEffect, useCallback } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { useToast } from '@/hooks/use-toast';
import { useSync } from './useSync';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { triggerSync } from '@/services/sync/triggerSync';
import { verifyJsonEndpoint } from '@/services/sync/robustSyncService';
import { saveLocalData, loadLocalData, syncWithServer } from '@/services/sync/AutoSyncService';
import { databaseHelper } from '@/services/sync/DatabaseHelper';

export const useExigences = () => {
  const { toast } = useToast();
  const { syncTable, syncStates, isOnline } = useGlobalSync();
  
  // Utiliser l'utilisateur actuellement connecté
  const currentUser = getCurrentUser();
  
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

      // S'assurer que les données sont valides et dans le bon format
      if (!Array.isArray(exigences)) {
        console.error("Les exigences ne sont pas un tableau valide");
        return { success: false, message: "Format de données invalide" };
      }

      // Préparer les données pour la synchronisation - s'assurer que les objets sont bien formatés
      const cleanedExigences = exigences.map(e => ({
        id: e.id,
        nom: e.nom || "",
        responsabilites: e.responsabilites || { r: [], a: [], c: [], i: [] },
        exclusion: !!e.exclusion,
        atteinte: e.atteinte || null,
        groupId: e.groupId || null,
        date_creation: e.date_creation || new Date()
      }));

      const cleanedGroups = groups.map(g => ({
        id: g.id,
        name: g.name || "",
        expanded: !!g.expanded,
        items: [] // On n'envoie pas les items car ils sont déjà dans les exigences
      }));

      // Utiliser l'utilisateur actuellement connecté
      const syncData = {
        userId: currentUser,  // Utiliser l'utilisateur connecté, pas un ID en dur
        exigences: cleanedExigences,
        groups: cleanedGroups
      };

      console.log("Synchronisation des exigences avec:", syncData);

      // Utiliser l'API URL correctement définie avec les nouvelles méthodes robustes
      const apiUrl = process.env.API_URL || '';
      
      try {
        // Utiliser la méthode fetch améliorée de DatabaseHelper
        const response = await databaseHelper.fetch(`${apiUrl}/api/exigences-sync.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          },
          body: JSON.stringify(syncData)
        });

        const result = await response.json();
        
        if (result.success) {
          setDataChanged(false);
          return { success: true, message: "Synchronisation réussie" };
        } else {
          return { success: false, message: result.message || "Échec de la synchronisation" };
        }
      } catch (error) {
        console.error('Erreur lors de la requête de synchronisation:', error);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : 'Erreur de requête'
        };
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
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
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      console.error("Synchronisation échouée, données conservées localement:", error);
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
