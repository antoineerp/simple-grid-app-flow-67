
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

  // Harmonisation avec RessourcesHumaines: synchroniser uniquement quand nécessaire
  const handleSyncWithServer = useCallback(async () => {
    if (!isOnline || isSyncing) return false;
    
    setIsSyncing(true);
    try {
      const success = await syncWithServer(documents, userId);
      if (success) {
        setSyncFailed(false);
        setLastSynced(new Date());
        
        // Charger discrètement les données après une synchronisation réussie
        try {
          const result = await loadFromServer(userId);
          if (Array.isArray(result)) {
            setDocuments(result);
          }
        } catch (loadError) {
          console.error("Erreur lors du rechargement après synchronisation:", loadError);
        }
        
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur",
        });
        
        return true;
      } else {
        setSyncFailed(true);
        toast({
          title: "Erreur de synchronisation",
          description: "Une erreur s'est produite lors de la synchronisation",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      setSyncFailed(true);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [documents, userId, syncWithServer, loadFromServer, isOnline, isSyncing, toast]);

  // Chargement initial des données (comme dans RessourcesHumaines)
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        console.log(`Chargement des documents pour l'utilisateur: ${userId}`);
        const result = await loadFromServer(userId);
        if (Array.isArray(result)) {
          setDocuments(result);
        } else {
          console.error("Format de résultat inattendu:", result);
          setDocuments([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des documents:", error);
        setLoadError(error instanceof Error ? error.message : "Erreur inconnue");
        setDocuments([]);
      }
    };

    loadDocuments();
    
    // Synchronisation périodique moins fréquente (toutes les 60 secondes)
    const syncInterval = setInterval(() => {
      if (isOnline && !syncFailed && !isSyncing) {
        handleSyncWithServer().catch(error => {
          console.error("Erreur lors de la synchronisation périodique:", error);
        });
      }
    }, 60000); // Une minute au lieu de 10 secondes

    return () => clearInterval(syncInterval);
  }, [loadFromServer, userId, isOnline, syncFailed, isSyncing, handleSyncWithServer]);

  // Gestion des documents
  const handleEdit = useCallback((id: string | null) => {
    if (id === null) {
      // Ajout d'un nouveau document
      handleAddDocument();
      return;
    }
    
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

  // Sauvegarde d'un document + synchronisation
  const handleSaveDocument = useCallback(async (document: Document) => {
    const isNew = !documents.some(d => d.id === document.id);
    
    if (isNew) {
      documentMutations.handleAddDocument(document);
    } else {
      documentMutations.handleEditDocument(document);
    }
    
    setDialogOpen(false);
    
    // Synchroniser après sauvegarde
    try {
      console.log("Synchronisation après sauvegarde de document");
      await handleSyncWithServer();
    } catch (error) {
      console.error("Erreur lors de la synchronisation après sauvegarde:", error);
    }
  }, [documents, documentMutations, handleSyncWithServer]);
  
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    console.log('Réorganisation des documents:', startIndex, endIndex, targetGroupId);
    const newDocuments = [...documents];
    const [removed] = newDocuments.splice(startIndex, 1);
    const updated = { ...removed, groupId: targetGroupId };
    newDocuments.splice(endIndex, 0, updated);
    setDocuments(newDocuments);
    
    // Synchroniser après réorganisation
    handleSyncWithServer().catch(err => console.error("Erreur lors de la synchronisation après réorganisation:", err));
  }, [documents, handleSyncWithServer]);
  
  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    console.log('Réorganisation des groupes:', startIndex, endIndex);
    const newGroups = [...groups];
    const [removed] = newGroups.splice(startIndex, 1);
    newGroups.splice(endIndex, 0, removed);
    setGroups(newGroups);
    
    // Synchroniser après réorganisation des groupes
    handleSyncWithServer().catch(err => console.error("Erreur lors de la synchronisation après réorganisation des groupes:", err));
  }, [groups, handleSyncWithServer]);
  
  const handleResetLoadAttempts = useCallback(() => {
    setLoadError(null);
    setSyncFailed(false);
    handleSyncWithServer().catch(console.error);
  }, [handleSyncWithServer]);

  // Gestion des groupes
  const handleAddGroup = useCallback(() => {
    const newGroup = groupOperations.handleAddGroup();
    setEditingGroup(newGroup);
    setGroupDialogOpen(true);
    return newGroup;
  }, [groupOperations]);
  
  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
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
    handleEditGroup,
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleGroupReorder,
    handleToggleGroup: groupOperations.handleToggleGroup,
    syncWithServer: handleSyncWithServer,
    handleResetLoadAttempts,
    ...documentMutations
  };
};
