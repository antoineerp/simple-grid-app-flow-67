
import { useEffect, useCallback } from 'react';
import { useDocumentCore } from '@/features/documents/hooks/useDocumentCore';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { useDocumentHandlers } from '@/features/documents/hooks/useDocumentHandlers';
import { useDocumentReorder } from '@/features/documents/hooks/useDocumentReorder';
import { useSyncService, SYNC_CONFIG } from '@/services/core/syncService';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { Document } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';

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
  const { toast: internalToast } = useToast();
  
  // Utilisation du service de synchronisation centralisé
  const syncService = useSyncService();
  
  // Utiliser le service de synchronisation globale
  const globalSync = useGlobalSync({
    syncIntervalSeconds: SYNC_CONFIG.intervalSeconds,
    autoSyncTypes: ['documents']
  });
  
  // Utiliser les états du service de synchronisation centralisé
  const isSyncing = syncService.isSyncing || globalSync.isGlobalSyncing;
  const syncFailed = syncService.syncFailed;
  const lastSynced = syncService.lastSynced || coreLastSynced || globalSync.lastGlobalSync;
  
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);
  
  // Fonction de synchronisation avec le serveur adaptée pour utiliser le service centralisé
  const handleSyncWithServer = useCallback(async () => {
    if (!isOnline || isSyncing) return false;
    
    try {
      console.log("Tentative de synchronisation des documents avec le serveur...");
      
      // Utiliser le service global pour synchroniser
      const success = await globalSync.syncData('documents', documents);
      
      if (success) {
        setCoreSyncFailed(false);
        setCoreLastSynced(new Date());
        
        // Charger discrètement les données après une synchronisation réussie
        try {
          const result = await syncService.loadFromServer<Document>({
            endpoint: 'documents-sync.php',
            loadEndpoint: 'documents-load.php',
            userId: userId,
            maxRetries: 2,
            retryDelay: 1000
          });
          
          if (Array.isArray(result)) {
            setDocuments(result as Document[]);
            internalToast({
              title: "Synchronisation réussie",
              description: `${result.length} documents chargés du serveur`,
            });
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
      console.error("Erreur lors de la synchronisation:", error);
      setCoreSyncFailed(true);
      internalToast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur lors de la synchronisation",
        variant: "destructive"
      });
      return false;
    }
  }, [documents, userId, isOnline, isSyncing, globalSync, syncService, setCoreSyncFailed, setCoreLastSynced, setDocuments, internalToast]);
  
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
    
    // Réessayer le chargement
    loadDocuments();
  }, [setLoadError, setCoreSyncFailed, syncService]);

  // Fonction de chargement initial des documents
  const loadDocuments = useCallback(async () => {
    try {
      if (!userId) {
        console.log("Pas d'utilisateur identifié, chargement des documents ignoré");
        return;
      }
      
      console.log(`Chargement des documents pour l'utilisateur: ${userId}`);
      const result = await syncService.loadFromServer<Document>({
        endpoint: 'documents-sync.php',
        loadEndpoint: 'documents-load.php',
        userId: userId,
        maxRetries: 2,
        retryDelay: 1000
      });
      
      if (Array.isArray(result)) {
        setDocuments(result as Document[]);
        console.log(`${result.length} documents chargés avec succès`);
        internalToast({
          title: "Documents chargés",
          description: `${result.length} documents disponibles`
        });
      } else {
        console.error("Format de résultat inattendu:", result);
        // Ne pas vider les documents si le résultat est invalide mais qu'on a déjà des documents
        if (documents.length === 0) {
          setDocuments([]);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      setLoadError(error instanceof Error ? error.message : "Erreur inconnue");
      internalToast({
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Erreur lors du chargement des documents",
        variant: "destructive"
      });
      // Ne pas vider les documents en cas d'erreur si on en a déjà
      if (documents.length === 0) {
        setDocuments([]);
      }
    }
  }, [userId, syncService, setDocuments, setLoadError, documents, internalToast]);

  // Chargement initial des données avec le service centralisé
  useEffect(() => {
    if (userId) {
      loadDocuments();
    } else {
      console.log("Pas d'utilisateur identifié, chargement des documents ignoré");
    }
    
    // Configurer la synchronisation périodique
    const cleanup = syncService.setupPeriodicSync(() => {
      if (isOnline && !syncFailed && !isSyncing && userId && documents.length > 0) {
        console.log(`Synchronisation périodique des documents (${documents.length})`);
        return handleSyncWithServer();
      }
      return Promise.resolve(false);
    }, SYNC_CONFIG.intervalSeconds);
    
    return cleanup;
  }, [userId, isOnline, syncFailed, isSyncing, handleSyncWithServer, loadDocuments, syncService, documents.length]);

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
    loadDocuments,
    ...documentMutations
  };
};
