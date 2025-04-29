
import { useEffect } from 'react';
import { useDocumentCore } from '@/features/documents/hooks/useDocumentCore';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { useDocumentHandlers } from '@/features/documents/hooks/useDocumentHandlers';
import { useDocumentReorder } from '@/features/documents/hooks/useDocumentReorder';
import { SYNC_CONFIG } from '@/services/core/syncService';
import { useDocumentLoading } from './useDocumentLoading';
import { useDocumentSyncHandlers } from './useDocumentSyncHandlers';
import { usePeriodicSync } from './usePeriodicSync';
import { useSyncStatus } from './useSyncStatus';

export const useDocuments = () => {
  const core = useDocumentCore();
  const {
    documents, setDocuments, groups, setGroups,
    editingDocument, setEditingDocument, editingGroup,
    dialogOpen, setDialogOpen, groupDialogOpen, setGroupDialogOpen,
    isSyncing: coreIsSyncing, setIsSyncing: setCoreSyncSync, 
    syncFailed: coreSyncFailed, setSyncFailed: setCoreSyncFailed,
    loadError, setLoadError, lastSynced: coreLastSynced, setLastSynced: setCoreLastSynced,
    stats, isOnline, userId
  } = core;
  
  // Document mutations (add, edit, delete)
  const documentMutations = useDocumentMutations(documents, setDocuments);
  
  // Group operations (add, edit, delete, toggle)
  const groupOperations = useDocumentGroups(groups, setGroups);
  
  // Sync status management
  const syncStatus = useSyncStatus({
    coreIsSyncing,
    coreSyncFailed,
    coreLastSynced
  });
  
  // Document sync handlers
  const { handleSyncWithServer } = useDocumentSyncHandlers({
    documents,
    userId,
    isOnline,
    isSyncing: syncStatus.isSyncing,
    setCoreSyncFailed,
    setCoreLastSynced,
    setDocuments
  });
  
  // Document loading
  const { loadDocuments, handleResetLoadAttempts } = useDocumentLoading({
    userId,
    setDocuments,
    setLoadError,
    documents
  });
  
  // Document handlers (edit, add, save)
  const documentHandlers = useDocumentHandlers({
    documents,
    setEditingDocument,
    setDialogOpen,
    handleSyncWithServer,
    documentMutations
  });
  
  // Document reordering handlers
  const reorderHandlers = useDocumentReorder({
    documents,
    setDocuments,
    groups,
    setGroups,
    handleSyncWithServer
  });
  
  // Set up periodic sync
  usePeriodicSync({
    userId,
    isOnline,
    syncFailed: syncStatus.syncFailed,
    isSyncing: syncStatus.isSyncing,
    documents,
    handleSyncWithServer
  });

  // Initial document loading
  useEffect(() => {
    const shouldLoad = userId && isOnline;
    
    if (shouldLoad) {
      loadDocuments();
    } else {
      console.log("Pas d'utilisateur identifié ou hors ligne, chargement des documents ignoré");
    }
  }, [userId, isOnline, loadDocuments]);

  return {
    documents,
    groups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing: syncStatus.isSyncing,
    syncFailed: syncStatus.syncFailed,
    isOnline,
    lastSynced: syncStatus.lastSynced,
    loadError,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit: documentHandlers.handleEdit,
    handleDelete: documentMutations.handleDelete,
    handleReorder: reorderHandlers.handleReorder,
    handleAddDocument: documentHandlers.handleAddDocument,
    handleSaveDocument: documentHandlers.handleSaveDocument,
    handleAddGroup: groupOperations.handleAddGroup,
    handleEditGroup: groupOperations.handleEditGroup,
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleGroupReorder: reorderHandlers.handleGroupReorder,
    handleToggleGroup: groupOperations.handleToggleGroup,
    syncWithServer: handleSyncWithServer,
    handleResetLoadAttempts,
    loadDocuments,
    ...documentMutations
  };
};
