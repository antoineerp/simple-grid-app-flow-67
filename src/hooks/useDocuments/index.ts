
import { useEffect, useCallback } from 'react';
import { useDocumentCore } from '@/features/documents/hooks/useDocumentCore';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { useDocumentHandlers } from '@/features/documents/hooks/useDocumentHandlers';
import { useDocumentReorder } from '@/features/documents/hooks/useDocumentReorder';

export const useDocuments = () => {
  const core = useDocumentCore();
  const {
    documents, setDocuments, groups, setGroups,
    editingDocument, setEditingDocument, editingGroup,
    dialogOpen, setDialogOpen, groupDialogOpen, setGroupDialogOpen,
    isSyncing, setIsSyncing, syncFailed, setSyncFailed,
    loadError, setLoadError, lastSynced, setLastSynced,
    stats, isOnline, userId, toast, loadFromServer
  } = core;
  
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

  // Harmonisation avec RessourcesHumaines: synchroniser uniquement quand nécessaire
  const handleSyncWithServer = useCallback(async () => {
    if (!isOnline || isSyncing) return false;
    
    setIsSyncing(true);
    try {
      const success = await core.syncWithServer(documents, userId);
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
  }, [documents, userId, core.syncWithServer, loadFromServer, isOnline, isSyncing, toast, setSyncFailed, setIsSyncing, setLastSynced, setDocuments]);
  
  const documentHandlers = useDocumentHandlers({
    documents,
    setEditingDocument,
    setDialogOpen,
    handleSyncWithServer,
    documentMutations
  });
  
  const reorderHandlers = useDocumentReorder({
    documents,
    setDocuments,
    groups,
    setGroups,
    handleSyncWithServer
  });

  const handleResetLoadAttempts = useCallback(() => {
    setLoadError(null);
    setSyncFailed(false);
    handleSyncWithServer().catch(console.error);
  }, [handleSyncWithServer, setLoadError, setSyncFailed]);

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
  }, [loadFromServer, userId, isOnline, syncFailed, isSyncing, handleSyncWithServer, setDocuments, setLoadError]);

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
    handleEdit: documentHandlers.handleEdit,
    handleDelete: documentMutations.handleDelete,
    handleReorder: reorderHandlers.handleReorder,
    handleAddDocument: documentHandlers.handleAddDocument,
    handleSaveDocument: documentHandlers.handleSaveDocument,
    handleAddGroup: groupOperations.handleAddGroup,
    handleEditGroup: groupOperations.handleEditGroup,  // Utilisation correcte de la propriété
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleGroupReorder: reorderHandlers.handleGroupReorder,
    handleToggleGroup: groupOperations.handleToggleGroup,
    syncWithServer: handleSyncWithServer,
    handleResetLoadAttempts,
    ...documentMutations
  };
};
