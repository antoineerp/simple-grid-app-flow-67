
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { calculateDocumentStats } from '@/services/documents/documentStatsService';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { useSync } from './useSync';
import { useGlobalData } from '@/contexts/GlobalDataContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { 
  loadDocumentsFromServer, 
  syncDocumentsWithServer 
} from '@/services/documents/documentSyncService';

export const useDocuments = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  // Utiliser le contexte global au lieu des états locaux
  const { 
    documents, 
    setDocuments, 
    documentGroups: groups, 
    setDocumentGroups: setGroups,
    lastSynced,
    setLastSynced,
    syncFailed,
    setSyncFailed,
    isSyncing,
    setIsSyncing
  } = useGlobalData();
  
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [stats, setStats] = useState<DocumentStats>(() => calculateDocumentStats(documents));
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Utiliser le hook de synchronisation central
  const { syncAndProcess } = useSync('documents');

  useEffect(() => {
    setStats(calculateDocumentStats(documents));
  }, [documents]);

  // Charger les documents au démarrage
  useEffect(() => {
    if (!initialLoadDone) {
      const loadInitialData = async () => {
        setIsSyncing(true);
        try {
          console.log("Chargement initial des documents");
          const loadedDocs = await loadDocumentsFromServer();
          if (loadedDocs && loadedDocs.length > 0) {
            console.log(`${loadedDocs.length} documents chargés depuis le serveur`);
            setDocuments(loadedDocs);
          } else {
            console.log("Aucun document chargé depuis le serveur");
          }
          setLastSynced(new Date());
          setSyncFailed(false);
        } catch (error) {
          console.error("Erreur lors du chargement initial des documents:", error);
          setSyncFailed(true);
        } finally {
          setIsSyncing(false);
          setInitialLoadDone(true);
        }
      };
      
      loadInitialData();
    }
  }, [initialLoadDone]);

  const syncWithServer = async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const result = await syncDocumentsWithServer(documents);
      
      if (result) {
        setLastSynced(new Date());
        setSyncFailed(false);
      } else {
        setSyncFailed(true);
      }
      
      setIsSyncing(false);
      return result;
    } catch (error) {
      console.error("Erreur lors de la synchronisation des documents:", error);
      setSyncFailed(true);
      setIsSyncing(false);
      return false;
    }
  };

  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

  const handleEdit = useCallback((id: string) => {
    const documentToEdit = documents.find(doc => doc.id === id);
    if (documentToEdit) {
      setEditingDocument(documentToEdit);
      setDialogOpen(true);
    } else {
      toast({
        title: "Erreur",
        description: `Le document ${id} n'a pas été trouvé`,
        variant: "destructive"
      });
    }
  }, [documents, toast]);

  const handleSaveDocument = useCallback(
    (updatedDocument: Document) => {
      const newDoc = {
        ...updatedDocument,
        date_modification: new Date(),
      };

      setDocuments((prev) => prev.map((doc) => (doc.id === newDoc.id ? newDoc : doc)));

      syncWithServer().catch(error => {
        console.error("Erreur lors de la synchronisation après mise à jour:", error);
      });

      toast({
        title: "Document mis à jour",
        description: `Le document ${newDoc.id} a été mis à jour avec succès`,
      });
    },
    [toast, setDocuments]
  );

  const handleAddDocument = useCallback(() => {
    const maxId = documents.length > 0 
      ? Math.max(...documents.map(d => parseInt(d.id)))
      : 0;
    
    const newId = (maxId + 1).toString();
    const newDocument: Document = {
      id: newId,
      nom: `Document ${newId}`,
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date()
    };
    
    setDocuments(prev => [...prev, newDocument]);
    
    syncWithServer().catch(error => {
      console.error("Erreur lors de la synchronisation après ajout:", error);
    });
    
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
    });
  }, [documents, toast, setDocuments]);

  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      // Mettre à jour le groupId du document
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId === 'null' ? undefined : targetGroupId;
      } else if (removed.groupId) {
        // Si le document est déplacé hors d'un groupe, supprimer la propriété groupId
        delete removed.groupId;
      }
      
      result.splice(endIndex, 0, removed);
      
      // Log pour le débogage
      console.log(`Document ${removed.id} déplacé: groupId=${removed.groupId || 'aucun'}`);
      
      // Synchroniser les changements
      syncWithServer().catch(error => {
        console.error("Erreur lors de la synchronisation après réorganisation:", error);
      });
      
      return result;
    });
  }, [setDocuments]);

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const forceReload = useCallback(async () => {
    setIsSyncing(true);
    try {
      const loadedDocs = await loadDocumentsFromServer();
      if (loadedDocs && loadedDocs.length > 0) {
        setDocuments(loadedDocs);
        setLastSynced(new Date());
        setSyncFailed(false);
        toast({
          title: "Rechargement réussi",
          description: `${loadedDocs.length} documents chargés depuis le serveur Infomaniak`,
        });
      }
    } catch (error) {
      console.error("Erreur lors du rechargement forcé:", error);
      setSyncFailed(true);
      toast({
        variant: "destructive",
        title: "Erreur de rechargement",
        description: "Impossible de recharger les documents depuis le serveur.",
      });
    } finally {
      setIsSyncing(false);
    }
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
    lastSynced,
    isOnline,
    setDialogOpen,
    setGroupDialogOpen,
    ...documentMutations,
    handleEdit,
    handleSaveDocument,
    handleAddDocument,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    ...groupOperations,
    syncWithServer,
    forceReload
  };
};
