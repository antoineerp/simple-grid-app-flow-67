
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Exigence, ExigenceGroup } from '@/types/exigences';

const exigencesService = {
  getExigences: async (): Promise<Exigence[]> => {
    return [];
  },
  createExigence: async (exigence: Omit<Exigence, 'id'>): Promise<Exigence> => {
    return { 
      ...exigence, 
      id: crypto.randomUUID(),
      responsabilites: exigence.responsabilites || { r: [], a: [], c: [], i: [] },
      exclusion: exigence.exclusion || false,
      atteinte: exigence.atteinte || null,
      date_creation: new Date(),
      date_modification: new Date()
    };
  },
  updateExigence: async (exigence: Exigence): Promise<Exigence> => {
    return exigence;
  },
  deleteExigence: async (id: string): Promise<void> => {
    // Supprimer de la base de données
  }
};

export function useExigences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);

  const {
    data: exigences = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['exigences'],
    queryFn: exigencesService.getExigences,
  });

  const createMutation = useMutation({
    mutationFn: exigencesService.createExigence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exigences'] });
      toast({
        title: "Succès",
        description: "Exigence créée avec succès"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: exigencesService.updateExigence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exigences'] });
      toast({
        title: "Succès",
        description: "Exigence mise à jour avec succès"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: exigencesService.deleteExigence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exigences'] });
      toast({
        title: "Succès",
        description: "Exigence supprimée avec succès"
      });
    },
  });

  // Transformer les données pour correspondre aux types attendus
  const transformedExigences: Exigence[] = exigences.map(ex => ({
    ...ex,
    responsabilites: ex.responsabilites || { r: [], a: [], c: [], i: [] },
    exclusion: ex.exclusion || false,
    atteinte: ex.atteinte || null,
    date_creation: ex.date_creation || new Date(),
    date_modification: ex.date_modification || new Date()
  }));

  const transformedGroups: ExigenceGroup[] = groups.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      responsabilites: item.responsabilites || { r: [], a: [], c: [], i: [] },
      exclusion: item.exclusion || false,
      atteinte: item.atteinte || null,
      date_creation: item.date_creation || new Date(),
      date_modification: item.date_modification || new Date()
    }))
  }));

  return {
    exigences: transformedExigences,
    groups: transformedGroups,
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit: (exigence: Exigence) => {
      setEditingExigence(exigence);
      setDialogOpen(true);
    },
    handleAddExigence: () => {
      setEditingExigence(null);
      setDialogOpen(true);
    },
    handleSaveExigence: (exigence: Exigence) => {
      const exigenceWithDefaults: Exigence = {
        ...exigence,
        responsabilites: exigence.responsabilites || { r: [], a: [], c: [], i: [] },
        exclusion: exigence.exclusion || false,
        atteinte: exigence.atteinte || null,
        date_creation: exigence.date_creation || new Date(),
        date_modification: new Date()
      };
      
      if (editingExigence) {
        updateMutation.mutate(exigenceWithDefaults);
      } else {
        createMutation.mutate(exigenceWithDefaults);
      }
      setDialogOpen(false);
    },
    handleDelete: (id: string) => {
      deleteMutation.mutate(id);
    },
    handleResponsabiliteChange: () => {},
    handleAtteinteChange: () => {},
    handleExclusionChange: () => {},
    handleReorder: () => {},
    handleGroupReorder: () => {},
    handleToggleGroup: () => {},
    handleEditGroup: (group: ExigenceGroup) => {
      setEditingGroup(group);
      setGroupDialogOpen(true);
    },
    handleSaveGroup: (group: ExigenceGroup) => {
      const transformedGroup: ExigenceGroup = {
        ...group,
        items: group.items.map(item => ({
          ...item,
          responsabilites: item.responsabilites || { r: [], a: [], c: [], i: [] },
          exclusion: item.exclusion || false,
          atteinte: item.atteinte || null,
          date_creation: item.date_creation || new Date(),
          date_modification: item.date_modification || new Date()
        }))
      };
      
      if (editingGroup) {
        setGroups(prev => prev.map(g => g.id === group.id ? transformedGroup : g));
      } else {
        setGroups(prev => [...prev, transformedGroup]);
      }
      setGroupDialogOpen(false);
    },
    handleDeleteGroup: () => {},
    handleAddGroup: () => {
      setEditingGroup(null);
      setGroupDialogOpen(true);
    }
  };
}
