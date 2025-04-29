
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useDocumentSync } from '@/features/documents/hooks/useDocumentSync';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const { toast } = useToast();

  // Get current user
  const user = getCurrentUser();
  const userId = typeof user === 'object' ? (user?.email || user?.identifiant_technique || 'p71x6d_system') : user || 'p71x6d_system';

  const { loadFromServer, syncWithServer } = useDocumentSync();
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

  // Calculate document statistics
  const stats: DocumentStats = {
    total: documents.length,
    conforme: documents.filter(d => d.atteinte === 'C').length,
    partiellementConforme: documents.filter(d => d.atteinte === 'PC').length,
    nonConforme: documents.filter(d => d.atteinte === 'NC').length,
    exclusion: documents.filter(d => d.exclusion).length
  };

  // Initial data loading
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        console.log(`Loading documents for user: ${userId}`);
        const result = await loadFromServer(userId);
        if (Array.isArray(result)) {
          console.log(`Loaded ${result.length} documents`);
          setDocuments(result);
          toast({
            title: "Chargement réussi",
            description: `${result.length} documents chargés`,
          });
        } else {
          console.error("Unexpected result format:", result);
          setDocuments([]);
        }
      } catch (error) {
        console.error("Error loading documents:", error);
        toast({
          title: "Erreur de chargement",
          description: error instanceof Error ? error.message : "Erreur lors du chargement des documents",
          variant: "destructive",
        });
        setDocuments([]);
      }
    };

    loadDocuments();
  }, [loadFromServer, userId, toast]);

  // Handle synchronization with server
  const handleSyncWithServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      const success = await syncWithServer(documents, userId);
      if (success) {
        toast({
          title: "Synchronisation réussie",
          description: "Les documents ont été synchronisés avec le serveur",
        });
        setSyncFailed(false);
        
        // Reload data after successful sync
        const result = await loadFromServer(userId);
        if (Array.isArray(result)) {
          setDocuments(result);
        }
        
        return true;
      } else {
        setSyncFailed(true);
        toast({
          title: "Échec de synchronisation",
          description: "La synchronisation avec le serveur a échoué",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      setSyncFailed(true);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [documents, userId, syncWithServer, loadFromServer, toast]);

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
      titre: '',
      // Propriétés typées correctement pour Document type
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString()
    };
    setEditingDocument(newDocument);
    setDialogOpen(true);
  }, []);

  // Handle document save
  const handleSaveDocument = useCallback(async (document: Document) => {
    const isNew = !documents.some(d => d.id === document.id);
    
    if (isNew) {
      documentMutations.handleAddDocument(document);
    } else {
      documentMutations.handleEditDocument(document);
    }
    
    setDialogOpen(false);
    
    // Sync with server after saving
    try {
      console.log("Synchronizing after document save");
      await handleSyncWithServer();
    } catch (error) {
      console.error("Error synchronizing after document save:", error);
    }
  }, [documents, documentMutations, handleSyncWithServer]);
  
  // Définir les fonctions manquantes pour corriger les erreurs
  const handleAddGroup = useCallback(() => {
    // Implémenter selon besoin
    groupOperations.handleSaveGroup({
      id: crypto.randomUUID(),
      name: 'Nouveau groupe',
      expanded: false,
      items: []
    }, false);
  }, [groupOperations]);
  
  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);
  
  const handleReorderDocuments = useCallback((startIndex: number, endIndex: number) => {
    // Implémenter selon besoin
    console.log('Reorder documents:', startIndex, endIndex);
  }, []);
  
  const handleReorderGroups = useCallback((startIndex: number, endIndex: number) => {
    // Implémenter selon besoin
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
    syncFailed,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleDelete: documentMutations.handleDelete,
    handleReorder: handleReorderDocuments,
    handleAddDocument,
    handleSaveDocument,
    handleAddGroup,
    handleEditGroup,
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleGroupReorder: handleReorderGroups,
    handleToggleGroup: groupOperations.handleToggleGroup,
    syncWithServer: handleSyncWithServer,
    // Ajout des fonctions supplémentaires
    handleEditDocument: documentMutations.handleEditDocument,
    handleDeleteDocument: documentMutations.handleDelete,
    handleReorderDocuments,
    ...documentMutations
  };
};
