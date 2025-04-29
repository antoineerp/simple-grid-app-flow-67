
import { useEffect, useState } from 'react';
import { useDocumentCore } from '@/features/documents/hooks/useDocumentCore';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { useDocumentHandlers } from '@/features/documents/hooks/useDocumentHandlers';
import { useDocumentReorder } from '@/features/documents/hooks/useDocumentReorder';
import { useSync } from '@/hooks/useSync';
import { Document } from '@/types/documents';

export const useDocuments = () => {
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Base document state
  const core = useDocumentCore();
  const {
    documents, setDocuments, groups, setGroups,
    editingDocument, setEditingDocument, editingGroup,
    dialogOpen, setDialogOpen, groupDialogOpen, setGroupDialogOpen,
    stats, userId
  } = core;
  
  // Document synchronization with the new unified sync hook
  const syncHook = useSync<Document>({
    entityType: 'documents',
    initialData: documents,
    onDataUpdate: (updatedDocuments) => {
      setDocuments(updatedDocuments);
    }
  });
  
  // Document mutations (add, edit, delete)
  const documentMutations = useDocumentMutations(documents, setDocuments);
  
  // Group operations (add, edit, delete, toggle)
  const groupOperations = useDocumentGroups(groups, setGroups);
  
  // Handler for syncing documents
  const handleSyncWithServer = async () => {
    if (documents.length === 0) {
      console.log("Pas de documents à synchroniser");
      return false;
    }
    
    return await syncHook.syncWithServer(documents);
  };
  
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
  
  // Reset sync status
  const handleResetLoadAttempts = () => {
    setLoadError(null);
    syncHook.resetSyncStatus();
  };
  
  // Load documents initially
  const loadDocuments = async () => {
    try {
      await syncHook.loadFromAPI(userId || 'p71x6d_system');
      setLoadError(null);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      setLoadError(error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  // Initial document loading
  useEffect(() => {
    if (userId && syncHook.isOnline) {
      loadDocuments();
    } else {
      console.log("Pas d'utilisateur identifié ou hors ligne, chargement des documents ignoré");
    }
  }, [userId, syncHook.isOnline]);

  return {
    documents,
    groups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing: syncHook.isSyncing,
    syncFailed: syncHook.syncFailed,
    isOnline: syncHook.isOnline,
    lastSynced: syncHook.lastSynced,
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
