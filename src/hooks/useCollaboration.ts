
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedSync } from '@/hooks/useUnifiedSync';

export const useCollaboration = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: '',
    name: '',
    link: ''
  });
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({
    id: '',
    name: '',
    expanded: false,
    items: []
  });
  const { toast } = useToast();
  
  // Utiliser notre hook de synchronisation unifié
  const {
    data: documents,
    setData: setDocuments,
    syncState: {
      isSyncing,
      lastSynced,
      syncFailed,
      pendingSync
    },
    isOnline,
    syncWithServer,
    loadFromServer,
    saveToLocalStorage
  } = useUnifiedSync<Document[]>('collaboration', []);
  
  // Le hook séparé pour les groupes
  const {
    data: groups,
    setData: setGroups,
    syncWithServer: syncGroups
  } = useUnifiedSync<DocumentGroup[]>('collaboration-groups', []);

  // Fonction pour synchroniser les documents et les groupes avec le serveur
  const handleSyncDocuments = useCallback(async () => {
    try {
      // Synchroniser les documents
      const docsResult = await syncWithServer(documents);
      
      // Synchroniser les groupes séparément
      const groupsResult = await syncGroups(groups);
      
      return docsResult.success && groupsResult.success;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation des documents.",
      });
      return false;
    }
  }, [documents, groups, syncWithServer, syncGroups, toast]);

  // Fonctions CRUD pour les documents
  const handleAddDocument = useCallback((doc: Document) => {
    const newDoc = { 
      ...doc, 
      id: doc.id || `doc-${uuidv4()}`
    };
    
    const updatedDocuments = [...documents, newDoc];
    setDocuments(updatedDocuments);
    setIsDialogOpen(false);
    
    // Synchroniser avec le serveur
    syncWithServer(updatedDocuments, { showToasts: true });
    
    toast({
      title: "Document ajouté",
      description: `Le document ${newDoc.name} a été ajouté.`,
    });
  }, [documents, setDocuments, syncWithServer, toast]);

  const handleUpdateDocument = useCallback((doc: Document) => {
    let updatedDocuments = [...documents];
    let updatedGroups = [...groups];
    
    if (doc.groupId) {
      // Mettre à jour un document dans un groupe
      updatedGroups = groups.map(group => 
        group.id === doc.groupId 
          ? { 
              ...group, 
              items: group.items.map(item => 
                item.id === doc.id ? doc : item
              ) 
            }
          : group
      );
      setGroups(updatedGroups);
      
      // Synchroniser les groupes
      syncGroups(updatedGroups, { showToasts: true });
    } else {
      // Mettre à jour un document hors groupe
      updatedDocuments = documents.map(d => d.id === doc.id ? doc : d);
      setDocuments(updatedDocuments);
      
      // Synchroniser les documents
      syncWithServer(updatedDocuments, { showToasts: true });
    }
    
    setIsDialogOpen(false);
    
    toast({
      title: "Document mis à jour",
      description: `Le document ${doc.name} a été mis à jour.`,
    });
  }, [documents, groups, setDocuments, setGroups, syncWithServer, syncGroups, toast]);

  const handleDeleteDocument = useCallback((id: string) => {
    // Vérifier si le document est dans un groupe
    let documentInGroup = false;
    let updatedGroups = [...groups];
    
    updatedGroups = updatedGroups.map(group => {
      const documentIndex = group.items.findIndex(item => item.id === id);
      if (documentIndex !== -1) {
        documentInGroup = true;
        return {
          ...group,
          items: group.items.filter(item => item.id !== id)
        };
      }
      return group;
    });
    
    let updatedDocuments = [...documents];
    
    if (documentInGroup) {
      setGroups(updatedGroups);
      
      // Synchroniser les groupes
      syncGroups(updatedGroups, { showToasts: true });
    } else {
      updatedDocuments = documents.filter(d => d.id !== id);
      setDocuments(updatedDocuments);
      
      // Synchroniser les documents
      syncWithServer(updatedDocuments, { showToasts: true });
    }
    
    setIsDialogOpen(false);
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé.",
    });
  }, [documents, groups, setDocuments, setGroups, syncWithServer, syncGroups, toast]);

  // Fonctions CRUD pour les groupes
  const handleAddGroup = useCallback((group: DocumentGroup) => {
    const newGroup = { 
      ...group, 
      id: group.id || `group-${uuidv4()}`,
      items: [],
      expanded: false
    };
    
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    setIsGroupDialogOpen(false);
    
    // Synchroniser les groupes
    syncGroups(updatedGroups, { showToasts: true });
    
    toast({
      title: "Groupe ajouté",
      description: `Le groupe ${newGroup.name} a été ajouté.`,
    });
  }, [groups, setGroups, syncGroups, toast]);

  const handleUpdateGroup = useCallback((group: DocumentGroup) => {
    const updatedGroups = groups.map(g => 
      g.id === group.id 
        ? { ...group, items: g.items } 
        : g
    );
    
    setGroups(updatedGroups);
    setIsGroupDialogOpen(false);
    
    // Synchroniser les groupes
    syncGroups(updatedGroups, { showToasts: true });
    
    toast({
      title: "Groupe mis à jour",
      description: `Le groupe ${group.name} a été mis à jour.`,
    });
  }, [groups, setGroups, syncGroups, toast]);

  const handleDeleteGroup = useCallback((id: string) => {
    // Libérer les documents du groupe avant de le supprimer
    const groupToDelete = groups.find(g => g.id === id);
    let docsToMove: Document[] = [];
    
    if (groupToDelete) {
      docsToMove = groupToDelete.items.map(item => ({
        ...item,
        groupId: undefined
      }));
    }
    
    const updatedGroups = groups.filter(g => g.id !== id);
    const updatedDocuments = [...documents, ...docsToMove];
    
    setGroups(updatedGroups);
    setDocuments(updatedDocuments);
    setIsGroupDialogOpen(false);
    
    // Synchroniser les deux collections
    syncGroups(updatedGroups, { silent: true });
    syncWithServer(updatedDocuments, { showToasts: true });
    
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé et ses documents ont été déplacés.",
    });
  }, [documents, groups, setDocuments, setGroups, syncWithServer, syncGroups, toast]);

  const handleToggleGroup = useCallback((id: string) => {
    const updatedGroups = groups.map(group => 
      group.id === id ? { ...group, expanded: !group.expanded } : group
    );
    
    setGroups(updatedGroups);
    
    // Sauvegarder l'état d'expansion dans le stockage local seulement
    // (pas besoin de synchroniser avec le serveur pour cela)
    saveToLocalStorage(updatedGroups, 'collaboration-groups');
  }, [groups, setGroups, saveToLocalStorage]);

  return {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setIsEditing,
    setCurrentDocument,
    setCurrentGroup,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleToggleGroup,
    handleSyncDocuments
  };
};
