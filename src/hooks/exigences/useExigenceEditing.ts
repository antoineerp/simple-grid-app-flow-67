
import { useState, useCallback } from 'react';
import { Exigence, ExigenceGroup } from '@/types/exigences';

export const useExigenceEditing = () => {
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);

  // Handle exigence editing
  const handleEdit = useCallback((id: string, exigences: Exigence[]) => {
    const exigence = exigences.find(e => e.id === id);
    if (exigence) {
      setEditingExigence(exigence);
      setDialogOpen(true);
    }
  }, []);

  // Handle exigence adding
  const handleAddExigence = useCallback(() => {
    const newExigence: Exigence = {
      id: crypto.randomUUID(),
      code: '',
      titre: '',
      nom: '',
      description: '',
      niveau: selectedNiveau || 'NA',
      atteinte: null,
      exclusion: false,
      documents_associes: [],
      responsabilites: {
        r: [],
        a: [],
        c: [],
        i: []
      },
      date_creation: new Date(),
      date_modification: new Date()
    };
    setEditingExigence(newExigence);
    setDialogOpen(true);
  }, [selectedNiveau]);

  // Handle group adding
  const handleAddGroup = useCallback(() => {
    const newGroup: ExigenceGroup = {
      id: crypto.randomUUID(),
      name: 'Nouveau groupe',
      expanded: false,
      items: []
    };
    setEditingGroup(newGroup);
    setGroupDialogOpen(true);
  }, []);

  return {
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    selectedNiveau,
    setSelectedNiveau,
    setDialogOpen,
    setGroupDialogOpen,
    setEditingExigence,
    setEditingGroup,
    handleEdit,
    handleAddExigence,
    handleAddGroup
  };
};
