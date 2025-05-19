
import { useState } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';

export const useBibliothequeDialogs = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: '',
    name: '',
    link: null
  });
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({
    id: '',
    name: '',
    expanded: false,
    items: []
  });

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentGroup(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return {
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
  };
};
