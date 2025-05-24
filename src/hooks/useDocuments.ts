
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentGroup } from '@/types/documents';

const documentsService = {
  getDocuments: async (): Promise<Document[]> => {
    // Retourner des données vides par défaut
    return [];
  },
  createDocument: async (document: Omit<Document, 'id'>): Promise<Document> => {
    return { 
      ...document, 
      id: crypto.randomUUID(),
      responsabilites: document.responsabilites || { r: [], a: [], c: [], i: [] },
      etat: document.etat || null,
      date_creation: new Date(),
      date_modification: new Date()
    };
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
    data: documentsData = [],
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

  // Transformer les données pour correspondre aux types attendus
  const documents: Document[] = documentsData.map(doc => ({
    ...doc,
    responsabilites: doc.responsabilites || { r: [], a: [], c: [], i: [] },
    etat: doc.etat || null,
    date_creation: doc.date_creation || new Date(),
    date_modification: doc.date_modification || new Date()
  }));

  const transformedGroups: DocumentGroup[] = groups.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      responsabilites: item.responsabilites || { r: [], a: [], c: [], i: [] },
      etat: item.etat || null,
      date_creation: item.date_creation || new Date(),
      date_modification: item.date_modification || new Date()
    }))
  }));

  return {
    documents,
    groups: transformedGroups,
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
      const docWithDefaults: Document = {
        ...doc,
        responsabilites: doc.responsabilites || { r: [], a: [], c: [], i: [] },
        etat: doc.etat || null,
        date_creation: doc.date_creation || new Date(),
        date_modification: new Date()
      };
      
      if (editingDocument) {
        updateMutation.mutate(docWithDefaults);
      } else {
        createMutation.mutate(docWithDefaults);
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
      const transformedGroup: DocumentGroup = {
        ...group,
        items: group.items.map(item => ({
          ...item,
          responsabilites: item.responsabilites || { r: [], a: [], c: [], i: [] },
          etat: item.etat || null,
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
    },
    syncWithServer: refetch
  };
}
