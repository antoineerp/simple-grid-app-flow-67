
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

  // Utiliser le hook de synchronisation central
  const { syncAndProcess } = useSync('documents');

  // Calculer les statistiques lorsque les documents changent
  useEffect(() => {
    setStats(calculateDocumentStats(documents));
    
    // Sauvegarder dans sessionStorage pour persistance entre les pages
    try {
      if (documents.length > 0) {
        const pageState = {
          documents,
          groups,
          lastSynced: lastSynced ? lastSynced.toISOString() : null,
          timestamp: Date.now()
        };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(pageState));
        console.log(`${documents.length} documents sauvegardés dans sessionStorage`);
      }
    } catch (e) {
      console.error("Erreur lors de la sauvegarde dans sessionStorage:", e);
    }
  }, [documents, groups, lastSynced]);

  // Charger les documents au démarrage
  useEffect(() => {
    if (!initialLoadDone) {
      const loadInitialData = async () => {
        setIsSyncing(true);
        try {
          // Vérifier d'abord si nous avons des données en sessionStorage
          const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
          
          if (sessionData) {
            try {
              const parsedData = JSON.parse(sessionData);
              console.log("Données trouvées dans sessionStorage:", parsedData.documents.length, "documents");
              
              // Vérifier si les données sont récentes (moins de 10 minutes)
              const dataAge = Date.now() - parsedData.timestamp;
              if (dataAge < 10 * 60 * 1000) {
                setDocuments(parsedData.documents);
                setGroups(parsedData.groups || []);
                if (parsedData.lastSynced) {
                  setLastSynced(new Date(parsedData.lastSynced));
                }
                console.log("Utilisation des données de sessionStorage (âge:", Math.round(dataAge/1000), "secondes)");
                setIsSyncing(false);
                setInitialLoadDone(true);
                return; // Sortir tôt, on a déjà des données récentes
              } else {
                console.log("Données de session trop anciennes, rechargement complet");
              }
            } catch (e) {
              console.error("Erreur lors de la lecture des données de session:", e);
            }
          }
          
          // Charger d'abord les documents locaux pour affichage immédiat
          const localDocs = getLocalDocuments();
          if (localDocs.length > 0) {
            console.log(`${localDocs.length} documents chargés depuis le stockage local`);
            setDocuments(localDocs);
          }
          
          // Ensuite, essayer de charger depuis le serveur
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
          
          // En cas d'erreur, essayer d'utiliser les documents locaux comme solution de secours
          const localDocs = getLocalDocuments();
          if (localDocs.length > 0) {
            console.log(`Solution de secours: ${localDocs.length} documents chargés depuis le stockage local`);
            setDocuments(localDocs);
          }
        } finally {
          setIsSyncing(false);
          setInitialLoadDone(true);
        }
      };
      
      loadInitialData();
    }
  }, [initialLoadDone, setDocuments, setGroups, setIsSyncing, setLastSynced, setSyncFailed]);

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
    
    setDocuments(prev => [...prev, newDocument]);
    
    // Sauvegarde locale immédiate
    const currentUser = getCurrentUser() || 'p71x6d_system';
    const allDocs = [...documents, newDocument];
    localStorage.setItem(`documents_${currentUser}`, JSON.stringify(allDocs));
    
    // Sauvegarde dans sessionStorage pour persistance entre les pages
    try {
      const pageState = {
        documents: allDocs,
        groups,
        lastSynced: new Date().toISOString(),
        timestamp: Date.now()
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(pageState));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde dans sessionStorage:", e);
    }
    
    syncWithServer().catch(error => {
      console.error("Erreur lors de la synchronisation après ajout:", error);
    });
    
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
    });
  }, [documents, groups, toast, setDocuments]);

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
      
      // Sauvegarde locale immédiate
      const currentUser = getCurrentUser() || 'p71x6d_system';
      localStorage.setItem(`documents_${currentUser}`, JSON.stringify(result));
      
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
      // Nettoyer sessionStorage pour forcer un rechargement complet
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      
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
