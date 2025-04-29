
import { useExigenceCore } from './useExigenceCore';
import { useExigenceEditHandlers } from './useExigenceEditHandlers';
import { useExigenceSyncHandlers } from './useExigenceSyncHandlers';
import { useExigenceSaveHandlers } from './useExigenceSaveHandlers';
import { useExigenceReorderHandlers } from './useExigenceReorderHandlers';
import { useExigenceSync } from '@/hooks/useExigenceSync';
import { useExigenceMutations } from '@/hooks/useExigenceMutations';
import { useExigenceGroups } from '@/hooks/useExigenceGroups';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useExigences = () => {
  // États et valeurs de base
  const core = useExigenceCore();
  const { isOnline } = useNetworkStatus();
  
  // Hooks de dépendances
  const { loadFromServer, syncWithServer, isSyncing, lastSynced, syncFailed, loadError, resetSyncStatus } = useExigenceSync();
  const exigenceMutations = useExigenceMutations(core.exigences, core.setExigences);
  const groupOperations = useExigenceGroups(core.groups, core.setGroups, core.setExigences);

  // Hooks de fonctionnalités
  const editHandlers = useExigenceEditHandlers(
    core.exigences, 
    core.setEditingExigence, 
    core.setDialogOpen,
    core.selectedNiveau
  );

  const syncHandlers = useExigenceSyncHandlers(
    core.exigences,
    core.groups,
    core.userId,
    syncWithServer,
    loadFromServer,
    core.setExigences,
    core.setGroups,
    core.setLastSyncedDate,
    isSyncing,
    syncFailed,
    resetSyncStatus
  );

  const saveHandlers = useExigenceSaveHandlers(
    core.exigences,
    exigenceMutations.handleAddExigence,
    exigenceMutations.handleSaveExigence,
    core.setDialogOpen,
    syncHandlers.handleSyncWithServer
  );

  const reorderHandlers = useExigenceReorderHandlers(
    core.exigences,
    core.setExigences,
    syncHandlers.handleSyncWithServer
  );

  // Gestion des groupes
  const handleEditGroup = (group) => {
    core.setEditingGroup(group);
    core.setGroupDialogOpen(true);
  };

  const handleAddGroup = () => {
    const newGroup = groupOperations.handleAddGroup();
    core.setEditingGroup(newGroup);
    core.setGroupDialogOpen(true);
    return newGroup;
  };

  // Retourne toutes les fonctions et valeurs
  return {
    // États de base
    exigences: core.exigences,
    groups: core.groups,
    selectedNiveau: core.selectedNiveau,
    stats: core.stats,
    editingExigence: core.editingExigence,
    editingGroup: core.editingGroup,
    dialogOpen: core.dialogOpen,
    groupDialogOpen: core.groupDialogOpen,
    isSyncing,
    syncFailed,
    isOnline,
    lastSynced,
    loadError,
    
    // Setters
    setSelectedNiveau: core.setSelectedNiveau,
    setDialogOpen: core.setDialogOpen,
    setGroupDialogOpen: core.setGroupDialogOpen,
    
    // Fonction d'édition des exigences
    handleEdit: editHandlers.handleEdit,
    handleDelete: exigenceMutations.handleDelete,
    handleAddExigence: editHandlers.handleAddExigence,
    handleSaveExigence: saveHandlers.handleSaveExigenceWithSync,
    handleEditExigence: exigenceMutations.handleSaveExigence,
    handleReorder: reorderHandlers.handleReorder,
    
    // Fonction de gestion des groupes
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleToggleGroup: groupOperations.handleToggleGroup,
    handleGroupReorder: groupOperations.handleGroupReorder,
    
    // Fonctions de synchronisation
    syncWithServer: syncHandlers.handleSyncWithServer,
    handleResetLoadAttempts: syncHandlers.handleResetLoadAttempts,
    
    // Réexport des fonctions de l'useExigenceMutations pour compatibilité
    ...exigenceMutations
  };
};

export * from './useExigenceCore';
export * from './useExigenceEditHandlers';
export * from './useExigenceSyncHandlers';
export * from './useExigenceSaveHandlers';
export * from './useExigenceReorderHandlers';
