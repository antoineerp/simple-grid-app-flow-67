
import { useState, useEffect, useCallback } from 'react';
import { Exigence, ExigenceGroup, ExigenceStats } from '@/types/exigences';
import { useExigenceSync } from '@/hooks/useExigenceSync';
import { useExigenceMutations } from '@/hooks/useExigenceMutations';
import { useExigenceGroups } from '@/hooks/useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

export const useExigences = () => {
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSyncedDate, setLastSyncedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  // Get current user
  const user = getCurrentUser();
  const userId = typeof user === 'object' ? (user?.email || user?.identifiant_technique || 'p71x6d_system') : user || 'p71x6d_system';

  const { loadFromServer, syncWithServer, isOnline, lastSynced, loadError: syncLoadError, resetSyncStatus } = useExigenceSync();
  const exigenceMutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  // Calculate exigence statistics
  const stats: ExigenceStats = {
    total: exigences.length,
    conforme: exigences.filter(e => e.atteinte === 'C').length,
    partiellementConforme: exigences.filter(e => e.atteinte === 'PC').length,
    nonConforme: exigences.filter(e => e.atteinte === 'NC').length,
    exclusion: exigences.filter(e => e.exclusion).length
  };

  // Define handleSyncWithServer before using it in useEffect
  const handleSyncWithServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      const success = await syncWithServer(exigences, userId);
      if (success) {
        setSyncFailed(false);
        setLastSyncedDate(new Date());
        // Silently reload data after successful sync
        const result = await loadFromServer(userId);
        if (result && Array.isArray(result.exigences)) {
          setExigences(result.exigences);
        }
        return true;
      } else {
        setSyncFailed(true);
        return false;
      }
    } catch (error) {
      setSyncFailed(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [exigences, userId, syncWithServer, loadFromServer]);

  // Initial data loading
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

    loadExigences();

    // Set up periodic sync every 10 seconds
    const syncInterval = setInterval(async () => {
      try {
        await handleSyncWithServer();
      } catch (error) {
        console.error("Error during periodic sync:", error);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(syncInterval);
  }, [loadFromServer, userId, handleSyncWithServer]);

  // Handle exigence editing
  const handleEdit = useCallback((id: string) => {
    const exigence = exigences.find(e => e.id === id);
    if (exigence) {
      setEditingExigence(exigence);
      setDialogOpen(true);
    }
  }, [exigences]);

  // Handle exigence adding
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

  // Handle exigence save
  const handleSaveExigence = useCallback(async (exigence: Exigence) => {
    const isNew = !exigences.some(e => e.id === exigence.id);

    if (isNew) {
      exigenceMutations.handleAddExigence(exigence);
    } else {
      exigenceMutations.handleSaveExigence(exigence);
    }

    setDialogOpen(false);

    // Sync with server after saving
    try {
      console.log("Synchronizing after exigence save");
      await handleSyncWithServer();
    } catch (error) {
      console.error("Error synchronizing after exigence save:", error);
    }
  }, [exigences, exigenceMutations, handleSyncWithServer]);

  // Handle reordering
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    const newExigences = [...exigences];
    const [removed] = newExigences.splice(startIndex, 1);
    const updated = { ...removed, groupId: targetGroupId };
    newExigences.splice(endIndex, 0, updated);
    setExigences(newExigences);
  }, [exigences]);

  // Handle group editing
  const handleEditGroup = useCallback((group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  // Handle group adding
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

  // Handle reset load attempts
  const handleResetLoadAttempts = useCallback(() => {
    resetSyncStatus();
    setLoadError(null);
  }, [resetSyncStatus]);

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
    loadError: loadError || syncLoadError,
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
