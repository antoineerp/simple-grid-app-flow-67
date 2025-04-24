
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Document, DocumentGroup } from '@/types/documents';
import { 
  loadDocumentsFromStorage, 
  saveDocumentsToStorage, 
  calculateDocumentStats,
  syncDocumentsWithServer
} from '@/services/documents';

export const useDocuments = () => {
  const { toast } = useToast();
  const currentUser = localStorage.getItem('currentUser') || 'default';
  
  const [documents, setDocuments] = useState<Document[]>(() => loadDocumentsFromStorage(currentUser));
  const [groups, setGroups] = useState<DocumentGroup[]>(() => {
    const storedGroups = localStorage.getItem(`document_groups_${currentUser}`);
    return storedGroups ? JSON.parse(storedGroups) : [];
  });
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [stats, setStats] = useState(calculateDocumentStats(documents));
  const [isSyncing, setIsSyncing] = useState(false);

  // Update statistics when documents change
  useEffect(() => {
    setStats(calculateDocumentStats(documents));
  }, [documents]);

  // Save documents to storage when they change
  useEffect(() => {
    saveDocumentsToStorage(documents, currentUser);
  }, [documents, currentUser]);

  // Save groups to storage when they change
  useEffect(() => {
    localStorage.setItem(`document_groups_${currentUser}`, JSON.stringify(groups));
  }, [groups, currentUser]);

  // Document manipulation functions
  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              responsabilites: { 
                ...doc.responsabilites, 
                [type]: values
              },
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

  const handleEdit = useCallback((id: string) => {
    const documentToEdit = documents.find(doc => doc.id === id);
    if (documentToEdit) {
      setEditingDocument(documentToEdit);
      setDialogOpen(true);
    } else {
      toast({
        title: "Erreur",
        description: `Le document ${id} n'a pas été trouvé`,
        variant: "destructive"
      });
    }
  }, [documents, toast]);

  const handleSaveDocument = useCallback((updatedDocument: Document) => {
    const newDoc = {
      ...updatedDocument,
      date_modification: new Date()
    };
    
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === newDoc.id ? newDoc : doc
      )
    );
    toast({
      title: "Document mis à jour",
      description: `Le document ${newDoc.id} a été mis à jour avec succès`
    });
  }, [toast]);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              etat: atteinte,
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

  const handleExclusionChange = useCallback((id: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              etat: doc.etat === 'EX' ? null : 'EX',
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
    });
  }, [toast]);

  const handleAddDocument = useCallback(() => {
    const maxId = documents.length > 0 
      ? Math.max(...documents.map(d => parseInt(d.id)))
      : 0;
    
    const newId = (maxId + 1).toString();
    
    const newDocument: Document = {
      id: newId,
      nom: `Document ${newId}`,
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date()
    };
    
    setDocuments(prev => [...prev, newDocument]);
    
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
    });
  }, [documents, toast]);

  const handleReorder = useCallback((startIndex: number, endIndex: number) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des documents a été mis à jour",
    });
  }, [toast]);

  // Group handling functions
  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const handleSaveGroup = useCallback((group: DocumentGroup) => {
    if (editingGroup) {
      setGroups(prev => prev.map(g => g.id === group.id ? group : g));
      toast({
        title: "Groupe mis à jour",
        description: `Le groupe ${group.name} a été mis à jour avec succès`,
      });
    } else {
      setGroups(prev => [...prev, group]);
      toast({
        title: "Nouveau groupe",
        description: `Le groupe ${group.name} a été créé`,
      });
    }
  }, [editingGroup, toast]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    // Remove group references from documents
    setDocuments(prev => prev.map(doc => 
      doc.groupId === groupId ? { ...doc, groupId: undefined } : doc
    ));
    
    // Delete the group
    setGroups(prev => prev.filter(g => g.id !== groupId));
    
    toast({
      title: "Suppression",
      description: "Le groupe a été supprimé",
    });
  }, [toast]);

  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    setGroups(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des groupes a été mis à jour",
    });
  }, [toast]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    );
  }, []);

  const syncWithServer = useCallback(async () => {
    setIsSyncing(true);
    
    const success = await syncDocumentsWithServer(documents, currentUser);
    
    if (success) {
      toast({
        title: "Synchronisation réussie",
        description: "Vos documents ont été synchronisés avec le serveur",
      });
    } else {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser vos documents",
        variant: "destructive"
      });
    }
    
    setIsSyncing(false);
    return success;
  }, [documents, currentUser, toast]);

  // Process documents to include group info
  const processedGroups = groups.map(group => {
    const groupItems = documents.filter(doc => doc.groupId === group.id);
    return {
      ...group,
      items: groupItems
    };
  });

  return {
    documents,
    groups: processedGroups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    setDialogOpen,
    setGroupDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveDocument,
    handleDelete,
    handleAddDocument,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleToggleGroup,
    syncWithServer
  };
};
