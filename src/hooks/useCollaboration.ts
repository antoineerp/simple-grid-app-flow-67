
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentGroup } from '@/types/collaboration';
import { useUnifiedSync } from '@/hooks/useUnifiedSync';

export const useCollaboration = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState<boolean>(false);

  // Use the unified sync hook for data synchronization
  const {
    data,
    setData,
    loadFromLocalStorage,
    loadFromServer,
    syncWithServer,
    syncState,
    isOnline,
  } = useUnifiedSync<Document[]>('collaboration', []);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // First try to load from localStorage
        const localData = loadFromLocalStorage();
        if (localData && localData.length > 0) {
          setDocuments(localData);
        }

        // Then try to fetch from server
        if (isOnline) {
          try {
            await loadFromServer({ showToast: false });
          } catch (error) {
            console.error('Failed to load from server:', error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [isOnline]);

  // Update local state when data from sync changes
  useEffect(() => {
    if (data) {
      setDocuments(data);
    }
  }, [data]);

  // Sync data when documents change
  const syncDocuments = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Hors connexion",
        description: "Impossible de synchroniser en mode hors connexion",
        variant: "destructive"
      });
      return;
    }

    try {
      await syncWithServer(documents, { showToast: true });
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec succès"
      });
    } catch (error) {
      console.error('Failed to sync documents:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les documents",
        variant: "destructive"
      });
    }
  }, [documents, isOnline, syncWithServer, toast]);

  // CRUD operations
  const handleAddDocument = useCallback(async (doc: Document) => {
    const newDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      date_creation: new Date(),
      date_modification: new Date()
    };
    
    const updatedDocs = [...documents, newDocument];
    setDocuments(updatedDocs);
    setData(updatedDocs, { showToast: true });
    setIsDialogOpen(false);
    
    if (isOnline) {
      try {
        await syncWithServer(updatedDocs, { showToast: true });
      } catch (error) {
        console.error('Failed to sync after adding document:', error);
      }
    }
    
    toast({
      title: "Document ajouté",
      description: `Le document ${newDocument.name} a été créé`
    });
  }, [documents, setData, isOnline, syncWithServer, toast]);

  const handleUpdateDocument = useCallback(async (doc: Document) => {
    const updatedDoc = {
      ...doc,
      date_modification: new Date()
    };
    
    const updatedDocs = documents.map(d => d.id === doc.id ? updatedDoc : d);
    setDocuments(updatedDocs);
    setData(updatedDocs, { showToast: true });
    setIsDialogOpen(false);
    
    if (isOnline) {
      try {
        await syncWithServer(updatedDocs, { showToast: true });
      } catch (error) {
        console.error('Failed to sync after updating document:', error);
      }
    }
    
    toast({
      title: "Document mis à jour",
      description: `Le document ${doc.name} a été mis à jour`
    });
  }, [documents, setData, isOnline, syncWithServer, toast]);

  const handleDeleteDocument = useCallback(async (id: string) => {
    const updatedDocs = documents.filter(d => d.id !== id);
    setDocuments(updatedDocs);
    setData(updatedDocs, { showToast: true });
    setIsDialogOpen(false);
    
    if (isOnline) {
      try {
        await syncWithServer(updatedDocs, { showToast: true });
      } catch (error) {
        console.error('Failed to sync after deleting document:', error);
      }
    }
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé"
    });
  }, [documents, setData, isOnline, syncWithServer, toast]);

  // Group operations - added to fix the missing properties in the Collaboration component
  const handleAddGroup = useCallback(async (group: DocumentGroup) => {
    const newGroup = {
      ...group,
      id: group.id || `group-${Date.now()}`
    };
    
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    
    toast({
      title: "Groupe ajouté",
      description: `Le groupe ${newGroup.name} a été créé`
    });
  }, [groups, toast]);

  const handleUpdateGroup = useCallback(async (group: DocumentGroup) => {
    const updatedGroups = groups.map(g => g.id === group.id ? group : g);
    setGroups(updatedGroups);
    
    toast({
      title: "Groupe mis à jour",
      description: `Le groupe ${group.name} a été mis à jour`
    });
  }, [groups, toast]);

  const handleDeleteGroup = useCallback(async (id: string) => {
    const updatedGroups = groups.filter(g => g.id !== id);
    setGroups(updatedGroups);
    
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé"
    });
  }, [groups, toast]);

  const handleToggleGroup = useCallback((groupId: string) => {
    const updatedGroups = groups.map(group => 
      group.id === groupId ? { ...group, expanded: !group.expanded } : group
    );
    setGroups(updatedGroups);
  }, [groups]);

  const handleSyncDocuments = useCallback(async () => {
    return await syncDocuments();
  }, [syncDocuments]);

  return {
    documents,
    groups,
    isLoading,
    currentDocument,
    currentGroup,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    setCurrentDocument,
    setCurrentGroup,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setIsEditing,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleToggleGroup,
    handleSyncDocuments,
    syncDocuments,
    isSyncing: syncState.isSyncing,
    lastSynced: syncState.lastSynced,
    syncFailed: syncState.syncFailed,
    isOnline
  };
};
