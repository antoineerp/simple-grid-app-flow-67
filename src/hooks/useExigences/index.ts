
import { useEffect } from 'react';
import { useExigenceCore } from './useExigenceCore';
import { useExigenceEditHandlers } from './useExigenceEditHandlers';
import { useExigenceSaveHandlers } from './useExigenceSaveHandlers';
import { useExigenceReorderHandlers } from './useExigenceReorderHandlers';
import { useExigenceMutations } from '@/hooks/useExigenceMutations';
import { useExigenceGroups } from '@/hooks/useExigenceGroups';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSync } from '@/hooks/useSync';
import { Exigence } from '@/types/exigences';

export const useExigences = () => {
  // États et valeurs de base
  const core = useExigenceCore();
  const { isOnline } = useNetworkStatus();
  
  // Nouveau hook de synchronisation unified
  const syncHook = useSync("exigences");
  
  // Observer pour mettre à jour les exigences quand elles changent
  useEffect(() => {
    if (syncHook.data && Array.isArray(syncHook.data)) {
      core.setExigences(syncHook.data as Exigence[]);
    }
  }, [syncHook.data, core.setExigences]);
  
  // Hooks de dépendances
  const exigenceMutations = useExigenceMutations(core.exigences, core.setExigences);
  const groupOperations = useExigenceGroups(core.groups, core.setGroups, core.setExigences);

  // Fonction de synchronisation
  const handleSyncWithServer = async () => {
    return await syncHook.syncWithServer(core.exigences, {
      endpoint: 'exigences-sync.php',
      userId: 'system' // À adapter selon votre configuration
    });
  };
  
  // Fonction de réinitialisation
  const handleResetLoadAttempts = () => {
    syncHook.resetSyncStatus();
  };

  // Hooks de fonctionnalités
  const editHandlers = useExigenceEditHandlers(
    core.exigences, 
    core.setEditingExigence, 
    core.setDialogOpen,
    core.selectedNiveau
  );

  const saveHandlers = useExigenceSaveHandlers(
    core.exigences,
    exigenceMutations.handleAddExigence,
    exigenceMutations.handleSaveExigence,
    core.setDialogOpen,
    handleSyncWithServer
  );

  const reorderHandlers = useExigenceReorderHandlers(
    core.exigences,
    core.setExigences,
    handleSyncWithServer
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
  
  // Charger les données au démarrage
  useEffect(() => {
    if (syncHook.isOnline) {
      syncHook.loadFromServer({
        endpoint: 'exigences-sync.php',
        loadEndpoint: 'exigences-load.php',
        userId: 'system' // À adapter selon votre configuration
      });
    }
  }, [syncHook.isOnline]);

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
    isSyncing: syncHook.isSyncing,
    syncFailed: syncHook.syncFailed,
    isOnline: syncHook.isOnline,
    lastSynced: syncHook.lastSynced,
    loadError: null,
    
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
    syncWithServer: handleSyncWithServer,
    handleResetLoadAttempts,
    
    // Réexport des fonctions de l'useExigenceMutations pour compatibilité
    ...exigenceMutations
  };
};

export * from './useExigenceCore';
export * from './useExigenceEditHandlers';
export * from './useExigenceSaveHandlers';
export * from './useExigenceReorderHandlers';
