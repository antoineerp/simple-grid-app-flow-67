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
  syncDocumentsWithServer,
  getLocalDocuments
} from '@/services/documents/documentSyncService';
import {
  saveLocalData,
  loadLocalData
} from '@/services/sync/AutoSyncService';

// Clé pour stocker l'état global dans sessionStorage (persistance entre les pages)
const SESSION_STORAGE_KEY = 'documents_page_state';

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

  // Utiliser le hook de synchronisation centralisée
  const { syncAndProcess } = useSync('documents');

  // Calculer les statistiques lorsque les documents changent
  useEffect(() => {
    setStats(calculateDocumentStats(documents));
    
    // Sauvegarder les documents avec le nouveau système centralisé
    if (documents.length > 0) {
      saveLocalData('documents', documents);
      
      if (groups.length > 0) {
        saveLocalData('document_groups', groups);
      }
      
      console.log(`${documents.length} documents sauvegardés dans le stockage centralisé`);
    }
  }, [documents, groups]);

  // Charger les documents au démarrage
  useEffect(() => {
    if (!initialLoadDone) {
      const loadInitialData = async () => {
        setIsSyncing(true);
        try {
          // Charger les documents depuis le stockage centralisé
          const localDocs = loadLocalData<Document>('documents');
          
          if (localDocs.length > 0) {
            console.log(`${localDocs.length} documents chargés depuis le stockage centralisé`);
            setDocuments(localDocs);
            
            // Charger également les groupes
            const localGroups = loadLocalData<DocumentGroup>('document_groups');
            if (localGroups.length > 0) {
              console.log(`${localGroups.length} groupes chargés depuis le stockage centralisé`);
              setGroups(localGroups);
            }
          }
          
          // Essayer de synchroniser avec le serveur si en ligne
          if (isOnline) {
            await syncWithServer();
          }
        } catch (error) {
          console.error("Erreur lors du chargement initial des documents:", error);
          setSyncFailed(true);
          
          toast({
            variant: "destructive",
            title: "Erreur de chargement",
            description: "Une erreur est survenue lors du chargement des documents. Mode hors-ligne activé.",
          });
        } finally {
          setIsSyncing(false);
          setInitialLoadDone(true);
        }
      };
      
      loadInitialData();
    }
  }, [initialLoadDone, isOnline, setDocuments, setGroups, setIsSyncing, setLastSynced, setSyncFailed, toast]);

  // Fonction de synchronisation avec le serveur
  const syncWithServer = async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      // Utiliser le nouveau système de synchronisation
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

  // Initialiser les mutations et opérations de groupe
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

  // Fonction d'édition d'un document
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

  // Fonction de sauvegarde d'un document
  const handleSaveDocument = useCallback(
    (updatedDocument: Document) => {
      const newDoc = {
        ...updatedDocument,
        date_modification: new Date(),
      };

      setDocuments((prev) => prev.map((doc) => (doc.id === newDoc.id ? newDoc : doc)));

      // Sauvegarder avec le nouveau système centralisé
      const allDocs = documents.map(doc => doc.id === newDoc.id ? newDoc : doc);
      saveLocalData('documents', allDocs);
      
      // Synchroniser automatiquement
      syncWithServer().catch(error => {
        console.error("Erreur lors de la synchronisation après mise à jour:", error);
      });

      toast({
        title: "Document mis à jour",
        description: `Le document ${newDoc.id} a été mis à jour avec succès`,
      });
    },
    [documents, toast]
  );

  // Fonction d'ajout d'un document
  const handleAddDocument = useCallback(() => {
    const maxId = documents.length > 0 
      ? Math.max(...documents.map(d => parseInt(d.id.toString())))
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
    
    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    
    // Sauvegarder avec le nouveau système centralisé
    saveLocalData('documents', updatedDocuments);
    
    // Synchroniser automatiquement
    syncWithServer().catch(error => {
      console.error("Erreur lors de la synchronisation après ajout:", error);
    });
    
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté et sauvegardé localement`,
    });
  }, [documents, toast]);

  // Fonction de réorganisation des documents
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      // Mettre à jour le groupId du document
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId === 'null' ? undefined : targetGroupId;
      } else if (removed.groupId) {
        delete removed.groupId;
      }
      
      result.splice(endIndex, 0, removed);
      
      // Sauvegarder avec le nouveau système centralisé
      saveLocalData('documents', result);
      
      // Synchroniser automatiquement
      syncWithServer().catch(error => {
        console.error("Erreur lors de la synchronisation après réorganisation:", error);
      });
      
      return result;
    });
  }, []);

  // Fonctions pour les groupes
  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  // Forcer le rechargement depuis le serveur
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
          description: `${loadedDocs.length} documents chargés depuis le serveur`,
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
  }, [setDocuments, setIsSyncing, setLastSynced, setSyncFailed, toast]);

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
