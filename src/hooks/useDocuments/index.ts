
import { useEffect, useCallback } from 'react';
import { useDocumentCore } from '@/features/documents/hooks/useDocumentCore';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { useDocumentHandlers } from '@/features/documents/hooks/useDocumentHandlers';
import { useDocumentReorder } from '@/features/documents/hooks/useDocumentReorder';
import { useSyncService } from '@/services/core/syncService';
import { Document } from '@/types/documents';

export const useDocuments = () => {
  const core = useDocumentCore();
  const {
    documents, setDocuments, groups, setGroups,
    editingDocument, setEditingDocument, editingGroup,
    dialogOpen, setDialogOpen, groupDialogOpen, setGroupDialogOpen,
    isSyncing: coreIsSyncing, setIsSyncing: setIsCoreSync, 
    syncFailed: coreSyncFailed, setSyncFailed: setCoreSyncFailed,
    loadError, setLoadError, lastSynced: coreLastSynced, setLastSynced: setCoreLastSynced,
    stats, isOnline, userId, toast
  } = core;
  
  // Utilisation du service de synchronisation centralisé
  const syncService = useSyncService();
  
  // Utiliser les états du service de synchronisation centralisé
  const isSyncing = syncService.isSyncing;
  const syncFailed = syncService.syncFailed;
  const lastSynced = syncService.lastSynced || coreLastSynced;
  
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);
  
  // Fonction de synchronisation avec le serveur adaptée pour utiliser le service centralisé
  const handleSyncWithServer = useCallback(async () => {
    if (!isOnline || isSyncing) return false;
    
    try {
      const success = await syncService.syncWithServer<Document>({
        endpoint: 'documents-sync.php',
        loadEndpoint: 'documents-load.php',
        data: documents,
        userId: userId,
        dataName: 'documents'
      });
      
      if (success) {
        setCoreSyncFailed(false);
        setCoreLastSynced(new Date());
        
        // Charger discrètement les données après une synchronisation réussie
        try {
          const result = await syncService.loadFromServer({
            loadEndpoint: 'documents-load.php',
            userId: userId
          });
          
          if (Array.isArray(result)) {
            setDocuments(result);
          }
        } catch (loadError) {
          console.error("Erreur lors du rechargement après synchronisation:", loadError);
        }
        
        return true;
      } else {
        setCoreSyncFailed(true);
        return false;
      }
    } catch (error) {
      setCoreSyncFailed(true);
      return false;
    }
  }, [documents, userId, isOnline, isSyncing, syncService, setCoreSyncFailed, setCoreLastSynced, setDocuments]);
  
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
    setCoreSyncFailed(false);
    syncService.resetSyncStatus();
    handleSyncWithServer().catch(console.error);
  }, [handleSyncWithServer, setLoadError, setCoreSyncFailed, syncService]);

  // Chargement initial des données avec le service centralisé
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        console.log(`Chargement des documents pour l'utilisateur: ${userId}`);
        const result = await syncService.loadFromServer<Document>({
          loadEndpoint: 'documents-load.php',
          userId: userId
        });
        
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
    }, 60000); // Une minute

    return () => clearInterval(syncInterval);
  }, [userId, isOnline, syncFailed, isSyncing, handleSyncWithServer, setDocuments, setLoadError, syncService]);

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
    handleEditGroup: groupOperations.handleEditGroup,
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleGroupReorder: reorderHandlers.handleGroupReorder,
    handleToggleGroup: groupOperations.handleToggleGroup,
    syncWithServer: handleSyncWithServer,
    handleResetLoadAttempts,
    ...documentMutations
  };
};
