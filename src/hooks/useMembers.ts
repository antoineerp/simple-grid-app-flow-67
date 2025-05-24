
// Hook pour la gestion des membres
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { Member } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['members'],
    queryFn: membersService.getMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: membersService.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Succès",
        description: "Membre créé avec succès"
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
    mutationFn: membersService.updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Succès",
        description: "Membre mis à jour avec succès"
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
    mutationFn: membersService.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Succès",
        description: "Membre supprimé avec succès"
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

  return {
    members,
    isLoading,
    error,
    refresh: refetch,
    createMember: createMutation.mutate,
    updateMember: updateMutation.mutate,
    deleteMember: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
