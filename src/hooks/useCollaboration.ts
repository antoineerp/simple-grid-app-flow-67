
import { useState, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/collaboration';
import { useCollaborationSync } from '@/features/collaboration/hooks/useCollaborationSync';
import { useCollaborationMutations } from '@/features/collaboration/hooks/useCollaborationMutations';
import { useCollaborationGroups } from '@/features/collaboration/hooks/useCollaborationGroups';
import { useCollaborationDragAndDrop } from '@/features/collaboration/hooks/useCollaborationDragAndDrop';
import { useCollaborationDialogs } from '@/features/collaboration/hooks/useCollaborationDialogs';

export const useCollaboration = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const currentUser = localStorage.getItem('currentUser') || 'default';

  const { 
    handleEditDocument, 
    handleDeleteDocument, 
    handleAddDocument 
  } = useCollaborationMutations(documents, setDocuments);
  
  const { 
    handleSaveGroup, 
    handleDeleteGroup, 
    handleToggleGroup,
    handleEditGroup
  } = useCollaborationGroups(groups, setGroups);
  
  const { 
    draggedItem, 
    setDraggedItem, 
    handleDrop, 
    handleGroupDrop 
  } = useCollaborationDragAndDrop(documents, setGroups, setDocuments);
  
  const {
    isDialogOpen,
    setIsDialogOpen,
    isGroupDialogOpen,
    setIsGroupDialogOpen,
    currentDocument,
    setCurrentDocument,
    currentGroup,
    setCurrentGroup,
    isEditing,
    setIsEditing,
    handleDocumentInputChange,
    handleGroupInputChange
  } = useCollaborationDialogs();

  const resetSyncFailed = useCallback(() => {
    setSyncFailed(false);
  }, []);

  const syncWithServer = useCallback(async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      // Simulation de synchronisation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSynced(new Date());
      return true;
    } catch (error) {
      setSyncFailed(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    documents,
    groups,
    isLoading,
    isSyncing,
    error,
    isOnline,
    lastSynced,
    syncFailed,
    resetSyncFailed,
    draggedItem,
    setDraggedItem,
    handleDrop,
    handleGroupDrop,
    isDialogOpen,
    setIsDialogOpen,
    isGroupDialogOpen,
    setIsGroupDialogOpen,
    currentDocument,
    setCurrentDocument,
    currentGroup,
    setCurrentGroup,
    isEditing,
    setIsEditing,
    handleDocumentInputChange,
    handleGroupInputChange,
    handleEditDocument,
    handleDeleteDocument,
    handleAddDocument,
    handleEditGroup,
    handleDeleteGroup,
    handleToggleGroup,
    syncWithServer
  };
};
