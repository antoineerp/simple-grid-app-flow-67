import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentGroup } from '@/types/documents';
import { apiService } from '@/services/api';
import { ApiResponse } from '@/types/api';

export function useDocuments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);

  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiService.getDocuments(),
  });

  const createMutation = useMutation({
    mutationFn: (document: Omit<Document, 'id'>) => apiService.createDocument(document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Succès",
        description: "Document créé avec succès"
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
    mutationFn: (document: Document) => apiService.updateDocument(document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Succès",
        description: "Document mis à jour avec succès"
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
    mutationFn: (id: string) => apiService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Succès",
        description: "Document supprimé avec succès"
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

  const documents: Document[] = (response as ApiResponse)?.success ? (response as ApiResponse).data : [];

  return {
    documents,
    groups,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isLoading,
    error,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit: (doc: Document) => {
      setEditingDocument(doc);
      setDialogOpen(true);
    },
    handleAddDocument: () => {
      setEditingDocument(null);
      setDialogOpen(true);
    },
    handleSaveDocument: (doc: Document) => {
      if (editingDocument) {
        updateMutation.mutate(doc);
      } else {
        createMutation.mutate(doc);
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
    handleEditGroup: (group: DocumentGroup) => {
      setEditingGroup(group);
      setGroupDialogOpen(true);
    },
    handleSaveGroup: (group: DocumentGroup) => {
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
    },
    syncWithServer: refetch
  };
}
