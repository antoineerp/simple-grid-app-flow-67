
import { useState } from 'react';
import { Document, DocumentGroup } from '@/types/collaboration';

export const useCollaborationDialogs = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Ajout des fonctions manquantes qui causaient les erreurs
  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentDocument) return;
    
    const { name, value } = e.target;
    setCurrentDocument(prev => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };
  
  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentGroup) return;
    
    const { name, value } = e.target;
    setCurrentGroup(prev => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  return {
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
  };
};
