
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

export const useBibliothequeDialogs = () => {
  const currentUserId = getDatabaseConnectionCurrentUser() || 'default';
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: "",
    name: "",
    link: null,
    userId: currentUserId
  });
  
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({
    id: "",
    name: "",
    expanded: false,
    items: [],
    userId: currentUserId
  });
  
  const openAddDialog = useCallback(() => {
    setCurrentDocument({
      id: uuidv4(),
      name: "",
      link: null,
      userId: currentUserId
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  }, [currentUserId]);
  
  const openEditDialog = useCallback((document: Document) => {
    setCurrentDocument({
      ...document,
      userId: document.userId || currentUserId
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  }, [currentUserId]);
  
  const openAddGroupDialog = useCallback(() => {
    setCurrentGroup({
      id: uuidv4(),
      name: "",
      expanded: false,
      items: [],
      userId: currentUserId
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  }, [currentUserId]);
  
  const openEditGroupDialog = useCallback((group: DocumentGroup) => {
    setCurrentGroup({
      ...group,
      userId: group.userId || currentUserId
    });
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  }, [currentUserId]);
  
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);
  
  const closeGroupDialog = useCallback(() => {
    setIsGroupDialogOpen(false);
  }, []);
  
  return {
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    openAddDialog,
    openEditDialog,
    openAddGroupDialog,
    openEditGroupDialog,
    closeDialog,
    closeGroupDialog
  };
};

export default useBibliothequeDialogs;
