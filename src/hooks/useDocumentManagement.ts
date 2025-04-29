
import { useState, useCallback, useEffect } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { syncDocumentsWithServer, loadDocumentsFromServer } from '@/services/documents/documentSyncService';

export const useDocumentManagement = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { toast } = useToast();

  // Load documents from server when component mounts
  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const userId = typeof currentUser === 'object' ? 
          (currentUser.identifiant_technique || '') : currentUser;
        
        if (userId) {
          try {
            const loadedDocuments = await loadDocumentsFromServer(userId);
            if (loadedDocuments && loadedDocuments.length > 0) {
              setDocuments(loadedDocuments);
              toast({
                title: "Documents chargés",
                description: `${loadedDocuments.length} documents chargés depuis le serveur`,
              });
              setLastSynced(new Date());
            }
          } catch (error) {
            console.error("Erreur lors du chargement des documents:", error);
            toast({
              title: "Erreur de chargement",
              description: "Impossible de charger vos documents depuis le serveur",
              variant: "destructive"
            });
          }
        }
      }
    };
    
    loadData();
  }, [toast]);

  // Sync documents with server
  const syncWithServer = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Erreur de synchronisation",
        description: "Vous devez être connecté pour synchroniser vos documents",
        variant: "destructive"
      });
      return;
    }

    const userId = typeof currentUser === 'object' ? 
      (currentUser.identifiant_technique || '') : currentUser;
    
    if (!userId) {
      toast({
        title: "Erreur de synchronisation",
        description: "Identifiant utilisateur invalide",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const success = await syncDocumentsWithServer(documents, userId);
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Vos documents ont été enregistrés sur le serveur",
        });
      } else {
        throw new Error("La synchronisation a échoué");
      }
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Impossible de synchroniser vos documents",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [documents, toast]);

  // Calculate document statistics
  const stats: DocumentStats = {
    total: documents.length,
    conforme: documents.filter(d => d.etat === 'C' || d.atteinte === 'C').length,
    partiellementConforme: documents.filter(d => d.etat === 'PC' || d.atteinte === 'PC').length,
    nonConforme: documents.filter(d => d.etat === 'NC' || d.atteinte === 'NC').length,
    exclusion: documents.filter(d => d.exclusion || d.etat === 'EX').length
  };

  // Document mutations
  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              responsabilites: { ...(doc.responsabilites || { r: [], a: [], c: [], i: [] }), [type]: values },
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { ...doc, atteinte, etat: atteinte, date_modification: new Date() }
          : doc
      )
    );
  }, []);

  const handleExclusionChange = useCallback((id: string) => {
    setDocuments(prev => 
      prev.map(doc => {
        if (doc.id === id) {
          return { 
            ...doc, 
            exclusion: !doc.exclusion, 
            etat: doc.etat === 'EX' ? null : 'EX', 
            date_modification: new Date() 
          };
        }
        return doc;
      })
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Suppression",
      description: `Le document a été supprimé`,
    });
  }, [toast]);

  const handleEdit = useCallback((id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setEditingDocument(doc);
      setDialogOpen(true);
    }
  }, [documents]);

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

  const handleSaveDocument = useCallback((document: Document) => {
    const isNew = !documents.some(d => d.id === document.id);
    
    if (isNew) {
      setDocuments(prev => [...prev, document]);
      toast({
        title: "Nouveau document",
        description: `Le document a été ajouté`,
      });
    } else {
      setDocuments(prev => 
        prev.map(doc => doc.id === document.id ? document : doc)
      );
      toast({
        title: "Document modifié",
        description: `Le document a été mis à jour`,
      });
    }
    
    setDialogOpen(false);
    
    // Sync with server after saving
    syncWithServer();
  }, [documents, syncWithServer, toast]);

  // Group functions
  const handleToggleGroup = useCallback((id: string) => {
    setGroups(prevGroups => 
      prevGroups.map(g => g.id === id ? { ...g, expanded: !g.expanded } : g)
    );
  }, []);

  const handleDeleteGroup = useCallback((id: string) => {
    setGroups(prevGroups => prevGroups.filter(g => g.id !== id));
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé",
    });
  }, [toast]);

  const handleSaveGroup = useCallback((group: DocumentGroup) => {
    const isEditing = groups.some(g => g.id === group.id);
    if (isEditing) {
      setGroups(prevGroups => 
        prevGroups.map(g => g.id === group.id ? group : g)
      );
      toast({
        title: "Groupe modifié",
        description: "Le groupe a été mis à jour",
      });
    } else {
      setGroups(prevGroups => [...prevGroups, group]);
      toast({
        title: "Nouveau groupe",
        description: "Le groupe a été créé",
      });
    }
    setGroupDialogOpen(false);
    setEditingGroup(null);
  }, [groups, toast]);

  const handleAddGroup = useCallback(() => {
    const newGroup: DocumentGroup = {
      id: crypto.randomUUID(),
      name: 'Nouveau groupe',
      expanded: false,
      items: []
    };
    setEditingGroup(newGroup);
    setGroupDialogOpen(true);
  }, []);
  
  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);
  
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    console.log('Reorder documents:', startIndex, endIndex, targetGroupId);
  }, []);
  
  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
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
    isSyncing,
    lastSynced,
    setDialogOpen,
    setGroupDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleDelete,
    handleReorder,
    handleAddDocument,
    handleSaveDocument,
    handleAddGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleSaveGroup,
    handleGroupReorder,
    handleToggleGroup,
    syncWithServer
  };
};
