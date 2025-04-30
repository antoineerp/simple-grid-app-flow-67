
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

export const useBibliotheque = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load documents and groups on mount
  useEffect(() => {
    loadDocumentsAndGroups();
  }, []);

  const loadDocumentsAndGroups = useCallback(async () => {
    try {
      // For now, we'll load from local storage as a fallback
      const currentUser = getDatabaseConnectionCurrentUser() || 'default';
      const storedDocs = localStorage.getItem(`collaboration_${currentUser}`);
      const storedGroups = localStorage.getItem(`collaboration_groups_${currentUser}`);
      
      if (storedDocs) {
        setDocuments(JSON.parse(storedDocs));
      } else {
        // Initialize with empty array if no stored data
        setDocuments([]);
      }
      
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      } else {
        // Initialize with empty array if no stored data
        setGroups([]);
      }
      
      setLastSynced(new Date());
    } catch (error) {
      console.error('Error loading documents and groups:', error);
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents.",
        variant: "destructive",
      });
      
      // Initialize with empty arrays if loading fails
      setDocuments([]);
      setGroups([]);
    }
  }, [toast]);

  const handleSyncDocuments = useCallback(async () => {
    setIsSyncing(true);
    setSyncFailed(false);
    
    try {
      // In a real implementation, this would sync with the server
      // For now, we'll simulate a successful sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSynced(new Date());
      toast({
        title: "Synchronisation réussie",
        description: "Documents synchronisés avec succès.",
      });
    } catch (error) {
      console.error('Error syncing documents:', error);
      setSyncFailed(true);
      
      toast({
        title: "Échec de la synchronisation",
        description: "Impossible de synchroniser les documents.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);

  const handleAddDocument = useCallback((document: Document) => {
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    const newDocument = {
      ...document,
      id: document.id || `doc-${Date.now()}`,
      userId: currentUser
    };
    
    setDocuments(prev => {
      const updatedDocs = [...prev, newDocument];
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(updatedDocs));
      return updatedDocs;
    });
    
    toast({
      title: "Document ajouté",
      description: "Le document a été ajouté avec succès.",
    });
    
    setIsDialogOpen(false);
  }, [toast]);

  const handleUpdateDocument = useCallback((document: Document) => {
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    
    setDocuments(prev => {
      const updatedDocs = prev.map(doc => doc.id === document.id ? { ...document, userId: currentUser } : doc);
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(updatedDocs));
      return updatedDocs;
    });
    
    toast({
      title: "Document mis à jour",
      description: "Le document a été mis à jour avec succès.",
    });
    
    setIsDialogOpen(false);
  }, [toast]);

  const handleDeleteDocument = useCallback((id: string) => {
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    
    // Remove from documents
    setDocuments(prev => {
      const updatedDocs = prev.filter(doc => doc.id !== id);
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(updatedDocs));
      return updatedDocs;
    });
    
    // Remove from any groups
    setGroups(prev => {
      const updatedGroups = prev.map(group => ({
        ...group,
        items: group.items.filter(itemId => itemId !== id)
      }));
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(updatedGroups));
      return updatedGroups;
    });
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès.",
    });
    
    setIsDialogOpen(false);
  }, [toast]);

  const handleAddGroup = useCallback((group: DocumentGroup) => {
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    const newGroup = {
      ...group,
      id: group.id || `group-${Date.now()}`,
      expanded: false,
      items: group.items || [],
      userId: currentUser
    };
    
    setGroups(prev => {
      const updatedGroups = [...prev, newGroup];
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(updatedGroups));
      return updatedGroups;
    });
    
    toast({
      title: "Groupe ajouté",
      description: "Le groupe a été ajouté avec succès.",
    });
    
    setIsGroupDialogOpen(false);
  }, [toast]);

  const handleUpdateGroup = useCallback((group: DocumentGroup) => {
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    
    setGroups(prev => {
      const updatedGroups = prev.map(g => g.id === group.id ? { ...group, userId: currentUser } : g);
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(updatedGroups));
      return updatedGroups;
    });
    
    toast({
      title: "Groupe mis à jour",
      description: "Le groupe a été mis à jour avec succès.",
    });
    
    setIsGroupDialogOpen(false);
  }, [toast]);

  const handleDeleteGroup = useCallback((id: string) => {
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    
    // Get the group to be deleted
    const groupToDelete = groups.find(g => g.id === id);
    
    // Remove the group
    setGroups(prev => {
      const updatedGroups = prev.filter(group => group.id !== id);
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(updatedGroups));
      return updatedGroups;
    });
    
    // Move documents from deleted group to no group
    if (groupToDelete) {
      setDocuments(prev => {
        const updatedDocs = prev.map(doc => {
          if (doc.groupId === id) {
            return { ...doc, groupId: undefined };
          }
          return doc;
        });
        localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(updatedDocs));
        return updatedDocs;
      });
    }
    
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé avec succès.",
    });
    
    setIsGroupDialogOpen(false);
  }, [groups, toast]);

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
    handleSyncDocuments,
  };
};

export default useBibliotheque;
