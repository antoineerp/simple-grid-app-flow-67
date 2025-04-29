
import { useState, useEffect, useCallback } from 'react';
import { Exigence, ExigenceGroup, ExigenceStats } from '@/types/exigences';
import { useExigenceSync } from '@/hooks/useExigenceSync';
import { useExigenceMutations } from '@/hooks/useExigenceMutations';
import { useExigenceGroups } from '@/hooks/useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useExigences = () => {
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [lastSyncedDate, setLastSyncedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  const user = getCurrentUser();
  const userId = typeof user === 'object' ? (user?.email || user?.identifiant_technique || 'p71x6d_system') : user || 'p71x6d_system';

  const { loadFromServer, syncWithServer, isSyncing, lastSynced, syncFailed, loadError, resetSyncStatus } = useExigenceSync();
  const exigenceMutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  const stats: ExigenceStats = {
    total: exigences.length,
    conforme: exigences.filter(e => e.atteinte === 'C').length,
    partiellementConforme: exigences.filter(e => e.atteinte === 'PC').length,
    nonConforme: exigences.filter(e => e.atteinte === 'NC').length,
    exclusion: exigences.filter(e => e.exclusion).length
  };

  const handleSyncWithServer = useCallback(async () => {
    try {
      const success = await syncWithServer(exigences, userId, groups);
      if (success) {
        setLastSyncedDate(new Date());
        try {
          const result = await loadFromServer(userId);
          if (result && Array.isArray(result.exigences)) {
            setExigences(result.exigences);
            if (Array.isArray(result.groups)) {
              setGroups(result.groups);
            }
          }
        } catch (loadError) {
          console.error("Error reloading data after sync:", loadError);
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error synchronizing:", error);
      return false;
    }
  }, [exigences, userId, groups, syncWithServer, loadFromServer]);

  useEffect(() => {
    const loadExigences = async () => {
      try {
        console.log(`Loading exigences for user: ${userId}`);
        const result = await loadFromServer(userId);
        if (result && Array.isArray(result.exigences)) {
          console.log(`Loaded ${result.exigences.length} exigences`);
          setExigences(result.exigences);
          if (Array.isArray(result.groups)) {
            setGroups(result.groups);
          }
        } else {
          console.error("Unexpected result format:", result);
          setExigences([]);
        }
      } catch (error) {
        console.error("Error loading exigences:", error);
        setExigences([]);
      }
    };

    if (isOnline) {
      loadExigences();
    }

    const syncInterval = setInterval(() => {
      if (isOnline && !syncFailed && !isSyncing) {
        handleSyncWithServer().catch(error => 
          console.error("Error during periodic sync:", error)
        );
      }
    }, 60000); // Changer à 60 secondes au lieu de 10 pour réduire les messages fréquents

    return () => clearInterval(syncInterval);
  }, [loadFromServer, userId, handleSyncWithServer, isOnline, syncFailed, isSyncing]);

  const handleEdit = useCallback((id: string) => {
    const exigence = exigences.find(e => e.id === id);
    if (exigence) {
      setEditingExigence(exigence);
      setDialogOpen(true);
    }
  }, [exigences]);

  const handleAddExigence = useCallback(() => {
    const newExigence: Exigence = {
      id: crypto.randomUUID(),
      nom: '',
      code: '',
      titre: '',
      description: '',
      niveau: selectedNiveau || 'NA',
      atteinte: null,
      exclusion: false,
      documents_associes: [],
      responsabilites: {
        r: [],
        a: [],
        c: [],
        i: []
      },
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString()
    };
    setEditingExigence(newExigence);
    setDialogOpen(true);
  }, [selectedNiveau]);

  const handleSaveExigence = useCallback(async (exigence: Exigence) => {
    const isNew = !exigences.some(e => e.id === exigence.id);

    if (isNew) {
      exigenceMutations.handleAddExigence(exigence);
    } else {
      exigenceMutations.handleSaveExigence(exigence);
    }

    setDialogOpen(false);

    try {
      console.log("Synchronizing after exigence save");
      await handleSyncWithServer();
    } catch (error) {
      console.error("Error synchronizing after exigence save:", error);
    }
  }, [exigences, exigenceMutations, handleSyncWithServer]);

  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    const newExigences = [...exigences];
    const [removed] = newExigences.splice(startIndex, 1);
    const updated = { ...removed, groupId: targetGroupId };
    newExigences.splice(endIndex, 0, updated);
    setExigences(newExigences);
  }, [exigences]);

  const handleEditGroup = useCallback((group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const handleAddGroup = useCallback(() => {
    const newGroup: ExigenceGroup = {
      id: crypto.randomUUID(),
      name: '',
      expanded: true,
      items: []
    };
    setEditingGroup(newGroup);
    setGroupDialogOpen(true);
    return newGroup;
  }, []);

  // This is where the error was: removed the unnecessary argument
  const handleResetLoadAttempts = useCallback(() => {
    resetSyncStatus();
    handleSyncWithServer().catch(error => {
      console.error("Error resetting sync:", error);
    });
  }, [resetSyncStatus, handleSyncWithServer]);

  return {
    exigences,
    groups,
    selectedNiveau,
    stats,
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    syncFailed,
    isOnline,
    lastSynced,
    loadError,
    setSelectedNiveau,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleDelete: exigenceMutations.handleDelete,
    handleAddExigence,
    handleSaveExigence,
    handleEditExigence: exigenceMutations.handleSaveExigence,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleToggleGroup: groupOperations.handleToggleGroup,
    handleGroupReorder: groupOperations.handleGroupReorder,
    syncWithServer: handleSyncWithServer,
    handleResetLoadAttempts,
    ...exigenceMutations
  };
};
