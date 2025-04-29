
import { useState } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';

export const useBibliothequeDialogs = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
    setIsEditing
  };
};
