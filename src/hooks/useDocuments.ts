
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  nom: string;
  fichier_path: string | null;
  responsabilites?: any;
  etat?: string;
  groupId?: string;
  excluded?: boolean;
  date_creation?: Date;
  date_modification?: Date;
}

interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
}

const documentsService = {
  getDocuments: async (): Promise<Document[]> => {
    return [];
  },
  createDocument: async (document: Omit<Document, 'id'>): Promise<Document> => {
    return { ...document, id: crypto.randomUUID(), fichier_path: null };
  },
  updateDocument: async (document: Document): Promise<Document> => {
    return document;
  },
  deleteDocument: async (id: string): Promise<void> => {
    // Supprimer de la base de données
  }
};

export function useDocuments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);

  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsService.getDocuments,
  });

  const createMutation = useMutation({
    mutationFn: documentsService.createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Succès",
        description: "Document créé avec succès"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: documentsService.updateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Succès",
        description: "Document mis à jour avec succès"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Succès",
        description: "Document supprimé avec succès"
      });
    },
  });

  const stats = {
    total: documents.length,
    completed: documents.filter(d => d.etat === 'complete').length,
    pending: documents.filter(d => d.etat === 'pending').length,
    excluded: documents.filter(d => d.excluded).length,
  };

  return {
    documents,
    groups,
    stats,
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
    handleEditGroup: () => {},
    handleSaveGroup: () => {},
    handleDeleteGroup: () => {},
    handleAddGroup: () => {},
    syncWithServer: refetch
  };
}
