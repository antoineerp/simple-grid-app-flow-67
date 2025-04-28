
import { useState, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useBibliothequeSync } from '@/features/bibliotheque/hooks/useBibliothequeSync';
import { useBibliothequeMutations } from '@/features/bibliotheque/hooks/useBibliothequeMutations';
import { useBibliothequeGroups } from '@/features/bibliotheque/hooks/useBibliothequeGroups';
import { useBibliothequeDragAndDrop } from '@/features/bibliotheque/hooks/useBibliothequeDragAndDrop';
import { useBibliothequeDialogs } from '@/features/bibliotheque/hooks/useBibliothequeDialogs';

export const useBibliotheque = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const currentUser = localStorage.getItem('currentUser') || 'default';

  const { 
    syncWithServer: syncWithServerFn, 
    loadFromServer, 
    isSyncing, 
    isOnline, 
    lastSynced 
  } = useBibliothequeSync();
  
  const { handleEditDocument, handleDeleteDocument, handleAddDocument } = useBibliothequeMutations(documents, setDocuments);
  const { handleSaveGroup, handleDeleteGroup, handleToggleGroup } = useBibliothequeGroups(groups, setGroups);
  const { draggedItem, setDraggedItem, handleDrop, handleGroupDrop } = useBibliothequeDragAndDrop(documents, setGroups, setDocuments);
  const {
    isDialogOpen,
    setIsDialogOpen,
    isGroupDialogOpen,
    setIsGroupDialogOpen,
    isEditing,
    setIsEditing,
    currentDocument,
    setCurrentDocument,
    currentGroup,
    setCurrentGroup,
    handleDocumentInputChange,
    handleGroupInputChange
  } = useBibliothequeDialogs();

  const handleSaveDocument = useCallback(() => {
    const documentToSave = {
      ...currentDocument,
      id: currentDocument.id || Math.random().toString(36).substr(2, 9)
    };

    if (isEditing) {
      handleEditDocument(documentToSave);
    } else {
      handleAddDocument(documentToSave);
    }

    setIsDialogOpen(false);
  }, [currentDocument, isEditing, handleEditDocument, handleAddDocument, setIsDialogOpen]);

  const syncWithServer = useCallback(async (): Promise<void> => {
    await syncWithServerFn(documents, groups, currentUser);
  }, [syncWithServerFn, documents, groups, currentUser]);

  return {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    isSyncing,
    isOnline,
    lastSynced,
    draggedItem,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setDraggedItem,
    handleDrop,
    handleGroupDrop,
    handleEditDocument,
    handleDeleteDocument,
    handleAddDocument,
    handleDocumentInputChange,
    handleSaveDocument,
    handleEditGroup: (group: DocumentGroup) => {
      setCurrentGroup(group);
      setIsEditing(true);
      setIsGroupDialogOpen(true);
    },
    handleDeleteGroup,
    handleAddGroup: () => {
      setCurrentGroup({
        id: '',
        name: '',
        expanded: false,
        items: []
      });
      setIsEditing(false);
      setIsGroupDialogOpen(true);
    },
    handleGroupInputChange,
    handleSaveGroup,
    handleToggleGroup,
    syncWithServer
  };
};
