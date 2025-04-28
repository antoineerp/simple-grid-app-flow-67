
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useDocumentSync } from '@/features/documents/hooks/useDocumentSync';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  // Get current user
  const user = getCurrentUser();
  const userId = typeof user === 'object' ? (user?.email || user?.identifiant_technique || 'p71x6d_system') : user || 'p71x6d_system';

  const { loadFromServer, syncWithServer } = useDocumentSync();
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

  // Calculate document statistics
  const stats: DocumentStats = {
    total: documents.length,
    conforme: documents.filter(d => d.etat === 'C').length,
    partiellementConforme: documents.filter(d => d.etat === 'PC').length,
    nonConforme: documents.filter(d => d.etat === 'NC').length,
    exclusion: documents.filter(d => d.etat === 'EX' || d.exclusion === true).length
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
        setLoadError(error instanceof Error ? error.message : "Erreur inconnue");
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
        setLastSynced(new Date());
        
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
      nom: '',
      titre: '',
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      atteinte: null,
      etat: null,
      exclusion: false,
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
  
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    console.log('Reorder documents:', startIndex, endIndex, targetGroupId);
    const newDocuments = [...documents];
    const [removed] = newDocuments.splice(startIndex, 1);
    const updated = { ...removed, groupId: targetGroupId };
    newDocuments.splice(endIndex, 0, updated);
    setDocuments(newDocuments);
  }, [documents]);
  
  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    console.log('Reorder groups:', startIndex, endIndex);
    const newGroups = [...groups];
    const [removed] = newGroups.splice(startIndex, 1);
    newGroups.splice(endIndex, 0, removed);
    setGroups(newGroups);
  }, [groups]);
  
  const handleResetLoadAttempts = useCallback(() => {
    setLoadError(null);
    setSyncFailed(false);
    handleSyncWithServer().catch(console.error);
  }, [handleSyncWithServer]);

  // Handle group adding
  const handleAddGroup = useCallback(() => {
    const newGroup = groupOperations.handleAddGroup();
    setEditingGroup(newGroup);
    setGroupDialogOpen(true);
  }, [groupOperations]);

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
    isOnline,
    lastSynced,
    loadError,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleDelete: documentMutations.handleDelete,
    handleReorder,
    handleAddDocument,
    handleSaveDocument,
    handleAddGroup,
    handleEditGroup: (group: DocumentGroup) => {
      setEditingGroup(group);
      setGroupDialogOpen(true);
    },
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleGroupReorder,
    handleToggleGroup: groupOperations.handleToggleGroup,
    syncWithServer: handleSyncWithServer,
    handleResetLoadAttempts,
    ...documentMutations
  };
};
