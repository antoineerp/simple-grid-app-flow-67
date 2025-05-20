
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/collaboration';
import { useUnifiedSync } from '@/hooks/useUnifiedSync';

export const useCollaboration = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Use the unified sync hook for data synchronization
  const {
    data,
    setData,
    loadFromLocalStorage,
    loadFromServer,
    syncWithServer,
    syncState,
    isOnline,
  } = useUnifiedSync<Document>('collaboration');

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
      description: `Le document ${newDocument.title} a été créé`
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
      description: `Le document ${doc.title} a été mis à jour`
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

  return {
    documents,
    isLoading,
    currentDocument,
    setCurrentDocument,
    isDialogOpen,
    setIsDialogOpen,
    isEditing,
    setIsEditing,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    syncDocuments,
    isSyncing: syncState.isSyncing,
    lastSynced: syncState.lastSynced,
    syncFailed: syncState.syncFailed,
    isOnline
  };
};
