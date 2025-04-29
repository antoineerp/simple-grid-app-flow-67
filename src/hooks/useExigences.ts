
import { useState, useCallback } from 'react';
import { Exigence, ExigenceGroup, ExigenceStats } from '@/types/exigences';
import { useExigenceMutations } from '@/hooks/useExigenceMutations';
import { useExigenceGroups } from '@/hooks/useExigenceGroups';
import { useToast } from '@/hooks/use-toast';

export const useExigences = () => {
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const { toast } = useToast();

  const exigenceMutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  // Calculate exigence statistics
  const stats: ExigenceStats = {
    total: exigences.length,
    conforme: exigences.filter(e => e.atteinte === 'C').length,
    partiellementConforme: exigences.filter(e => e.atteinte === 'PC').length,
    nonConforme: exigences.filter(e => e.atteinte === 'NC').length,
    exclusion: exigences.filter(e => e.exclusion).length
  };

  // Handle exigence editing
  const handleEdit = useCallback((id: string) => {
    const exigence = exigences.find(e => e.id === id);
    if (exigence) {
      setEditingExigence(exigence);
      setDialogOpen(true);
    }
  }, [exigences]);

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

  // Handle exigence save
  const handleSaveExigence = useCallback((exigence: Exigence) => {
    const isNew = !exigences.some(e => e.id === exigence.id);

    if (isNew) {
      exigenceMutations.handleAddExigence(exigence);
    } else {
      exigenceMutations.handleSaveExigence(exigence);
    }

    setDialogOpen(false);
  }, [exigences, exigenceMutations]);

  // Définir des fonctions pour la réorganisation
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    // Implémentation simple
    console.log('Reorder exigences:', startIndex, endIndex, targetGroupId);
  }, []);

  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    // Implémentation simple
    console.log('Reorder groups:', startIndex, endIndex);
  }, []);

  // Fonction pour ajouter un groupe
  const handleAddGroup = useCallback(() => {
    const newGroup: ExigenceGroup = {
      id: crypto.randomUUID(),
      name: 'Nouveau groupe',
      expanded: false,
      items: []
    };
    // Correction ici: on n'envoie pas d'argument supplémentaire
    groupOperations.handleSaveGroup(newGroup);
  }, [groupOperations]);

  // Fonction pour éditer un groupe
  const handleEditGroup = useCallback((group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  return {
    exigences,
    groups,
    selectedNiveau,
    stats,
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    setSelectedNiveau,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleDelete: exigenceMutations.handleDelete,
    handleAddExigence,
    handleSaveExigence,
    handleAddGroup,
    handleEditGroup,
    // Correction ici: on passe les deux arguments attendus
    handleSaveGroup: (group: ExigenceGroup) => groupOperations.handleSaveGroup(group, !!editingGroup),
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleToggleGroup: groupOperations.handleToggleGroup,
    handleReorder,
    handleGroupReorder,
    ...exigenceMutations
  };
};
