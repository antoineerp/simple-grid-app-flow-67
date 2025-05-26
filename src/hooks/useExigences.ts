
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { apiService } from '@/services/api';
import { ApiResponse } from '@/types/api';

export function useExigences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);

  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['exigences'],
    queryFn: () => apiService.getExigences(),
  });

  const createMutation = useMutation({
    mutationFn: (exigence: Omit<Exigence, 'id'>) => apiService.createExigence(exigence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exigences'] });
      toast({
        title: "Succès",
        description: "Exigence créée avec succès"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (exigence: Exigence) => apiService.updateExigence(exigence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exigences'] });
      toast({
        title: "Succès",
        description: "Exigence mise à jour avec succès"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteExigence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exigences'] });
      toast({
        title: "Succès",
        description: "Exigence supprimée avec succès"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const exigences: Exigence[] = (response as ApiResponse)?.success ? (response as ApiResponse).data : [];

  return {
    exigences,
    groups,
    isLoading, // Add the missing isLoading property
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
      if (editingExigence) {
        updateMutation.mutate(exigence);
      } else {
        createMutation.mutate(exigence);
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
      setGroups(prev => editingGroup ? 
        prev.map(g => g.id === group.id ? group : g) : 
        [...prev, group]
      );
      setGroupDialogOpen(false);
    },
    handleDeleteGroup: () => {},
    handleAddGroup: () => {
      setEditingGroup(null);
      setGroupDialogOpen(true);
    }
  };
}
