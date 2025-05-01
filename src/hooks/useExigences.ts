
import { useToast } from '@/hooks/use-toast';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { useExigenceState } from './useExigenceState';
import { useExigenceSync } from './useExigenceSync';
import { useExigenceActions } from './useExigenceActions';

export const useExigences = () => {
  const tableName = 'exigences';
  const { toast } = useToast();
  
  // Use our new hooks to organize functionality
  const {
    exigences, 
    setExigences,
    groups, 
    setGroups,
    stats,
    editingExigence,
    setEditingExigence,
    editingGroup,
    setEditingGroup,
    dialogOpen,
    setDialogOpen,
    groupDialogOpen,
    setGroupDialogOpen,
    loadError,
    loadAttempts,
    dataChanged,
    setDataChanged,
    currentUser,
    handleResetLoadAttempts
  } = useExigenceState(tableName);

  const {
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    syncWithServer,
    handleSync
  } = useExigenceSync(
    tableName, 
    exigences, 
    dataChanged,
    setDataChanged,
    loadError,
    handleResetLoadAttempts
  );

  const {
    handleEdit,
    handleReorder,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange
  } = useExigenceActions(exigences, setExigences, setDialogOpen, setEditingExigence);

  // Initialize mutations and group operations
  const mutations = useExigenceMutations();
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);
  
  // Handle adding a new group
  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  // Handle editing a group
  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  // Adapter handleSaveExigence to work with a single parameter
  const handleSaveExigence = (exigence: any) => {
    if (mutations && mutations.handleSaveExigence) {
      return mutations.handleSaveExigence(exigence);
    }
  };

  // Adapter handleSaveGroup to work with two parameters
  const handleSaveGroup = (group: any, isEditing: boolean) => {
    if (groupOperations && groupOperations.handleSaveGroup) {
      return groupOperations.handleSaveGroup(group, isEditing);
    }
  };

  // Set up group operations
  const handleDeleteGroup = (id: string) => {
    if (groupOperations && groupOperations.handleDeleteGroup) {
      groupOperations.handleDeleteGroup(id);
    }
  };

  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    if (groupOperations && groupOperations.handleGroupReorder) {
      groupOperations.handleGroupReorder(startIndex, endIndex);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    if (groupOperations && groupOperations.handleToggleGroup) {
      groupOperations.handleToggleGroup(groupId);
    }
  };

  // Set up regular exigence operations
  const handleDelete = (id: string) => {
    if (mutations && mutations.handleDeleteExigence) {
      mutations.handleDeleteExigence(id, exigences, setExigences);
    }
  };

  const handleAddExigence = () => {
    if (mutations && mutations.handleAddExigence) {
      mutations.handleAddExigence();
    }
  };

  // Execute initial sync
  const initialSync = async () => {
    try {
      await syncWithServer();
    } catch (error) {
      console.error("Error during initial sync:", error);
    }
  };

  // Expose all necessary functions and state
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
