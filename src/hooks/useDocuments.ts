
import { useState, useCallback } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useDocumentMutations } from './useDocumentMutations';
import { useToast } from '@/hooks/use-toast';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const { toast } = useToast();

  const documentMutations = useDocumentMutations(documents, setDocuments);

  // Calculate document statistics safely handling undefined values
  const stats: DocumentStats = {
    total: documents.length,
    conforme: documents.filter(d => d.etat === 'C' || d.atteinte === 'C').length,
    partiellementConforme: documents.filter(d => d.etat === 'PC' || d.atteinte === 'PC').length,
    nonConforme: documents.filter(d => d.etat === 'NC' || d.atteinte === 'NC').length,
    exclusion: documents.filter(d => d.exclusion || d.etat === 'EX').length
  };

  // Handle document editing
  const handleEdit = useCallback((id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setEditingDocument(doc);
      setDialogOpen(true);
    }
  }, [documents]);

  // Handle document adding
  const handleAddDocument = useCallback(() => {
    const newDocument: Document = {
      id: crypto.randomUUID(),
      nom: '',
      fichier_path: null,
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString(),
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      exclusion: false
    };
    setEditingDocument(newDocument);
    setDialogOpen(true);
  }, []);

  // Handle document save
  const handleSaveDocument = useCallback((document: Document) => {
    const isNew = !documents.some(d => d.id === document.id);
    
    if (isNew) {
      documentMutations.handleAddDocument(document);
    } else {
      documentMutations.handleEditDocument(document);
    }
    
    setDialogOpen(false);
  }, [documents, documentMutations]);

  // Group functions
  const handleToggleGroup = (id: string) => {
    setGroups(prevGroups => 
      prevGroups.map(g => g.id === id ? { ...g, expanded: !g.expanded } : g)
    );
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(prevGroups => prevGroups.filter(g => g.id !== id));
  };

  const handleSaveGroup = (group: DocumentGroup) => {
    const isEditing = groups.some(g => g.id === group.id);
    if (isEditing) {
      setGroups(prevGroups => 
        prevGroups.map(g => g.id === group.id ? group : g)
      );
    } else {
      setGroups(prevGroups => [...prevGroups, group]);
    }
    setGroupDialogOpen(false);
    setEditingGroup(null);
  };

  const handleAddGroup = () => {
    const newGroup: DocumentGroup = {
      id: crypto.randomUUID(),
      name: 'Nouveau groupe',
      expanded: false,
      items: []
    };
    handleSaveGroup(newGroup);
  };
  
  const handleReorderDocuments = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    console.log('Reorder documents:', startIndex, endIndex, targetGroupId);
  }, []);
  
  const handleReorderGroups = useCallback((startIndex: number, endIndex: number) => {
    console.log('Reorder groups:', startIndex, endIndex);
  }, []);

  return {
    documents,
    groups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleDelete: documentMutations.handleDelete,
    handleReorder: handleReorderDocuments,
    handleAddDocument,
    handleSaveDocument,
    handleAddGroup,
    handleEditGroup: (group: DocumentGroup) => {
      setEditingGroup(group);
      setGroupDialogOpen(true);
    },
    handleDeleteGroup,
    handleSaveGroup,
    handleGroupReorder: handleReorderGroups,
    handleToggleGroup,
    handleResponsabiliteChange: documentMutations.handleResponsabiliteChange,
    handleAtteinteChange: documentMutations.handleAtteinteChange,
    handleExclusionChange: documentMutations.handleExclusionChange,
    ...documentMutations
  };
};
