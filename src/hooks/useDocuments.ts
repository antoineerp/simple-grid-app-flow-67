import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentGroup, DocumentStats } from '@/types/documents';
import { v4 as uuidv4 } from 'uuid';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { saveLocalDocuments, getLocalDocuments, syncDocumentsWithServer, loadDocumentsFromServer } from '@/services/documents/documentSyncService';
import { calculateDocumentStats } from '@/services/documents/documentStatsService';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  
  // Calculate statistics
  const stats = calculateDocumentStats(documents);

  // Charger les documents au démarrage
  useEffect(() => {
    loadDocuments();
  }, []);
  
  // Fonction principale de chargement des documents (compatible avec DataSyncManager)
  const loadDocuments = useCallback(async (forceRefresh?: boolean): Promise<Document[]> => {
    try {
      setIsSyncing(true);
      const userId = getCurrentUser();
      
      // Si en ligne et rafraîchissement forcé, charger depuis le serveur
      if (isOnline && forceRefresh) {
        const serverDocs = await loadDocumentsFromServer(userId);
        if (serverDocs && serverDocs.length > 0) {
          setDocuments(serverDocs);
          
          // Extraire les groupes des documents
          const groupIds = new Set(serverDocs.filter(d => d.groupId).map(d => d.groupId));
          const extractedGroups = Array.from(groupIds).map(groupId => {
            const docsInGroup = serverDocs.filter(d => d.groupId === groupId);
            const groupName = docsInGroup[0]?.nom || 'Groupe sans nom';
            return {
              id: groupId!,
              name: groupName, // Utiliser 'name' au lieu de 'nom' pour correspondre au type DocumentGroup
              expanded: true,
              items: [] // Initialiser le tableau items vide, sera rempli plus tard
            };
          });
          
          setGroups(extractedGroups);
          setLastSynced(new Date());
          setSyncFailed(false);
          return serverDocs;
        }
      }
      
      // En mode hors ligne ou si le serveur n'a pas retourné de documents
      const localDocs = getLocalDocuments();
      setDocuments(localDocs);
      
      // Extraire les groupes des documents locaux
      const groupIds = new Set(localDocs.filter(d => d.groupId).map(d => d.groupId));
      const extractedGroups = Array.from(groupIds).map(groupId => {
        const docsInGroup = localDocs.filter(d => d.groupId === groupId);
        const groupName = docsInGroup[0]?.nom || 'Groupe sans nom';
        return {
          id: groupId!,
          name: groupName, // Utiliser 'name' au lieu de 'nom' pour correspondre au type DocumentGroup
          expanded: true,
          items: [] // Initialiser le tableau items vide, sera rempli plus tard
        };
      });
      
      setGroups(extractedGroups);
      return localDocs;
      
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      setSyncFailed(true);
      
      // En cas d'erreur, essayer de charger les documents locaux
      const localDocs = getLocalDocuments();
      setDocuments(localDocs);
      return localDocs;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Fonction de synchronisation pour utilisation avec DataSyncManager
  const syncWithServer = useCallback(async (docs: Document[] = documents): Promise<boolean> => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Mode hors ligne",
        description: "Synchronisation impossible en mode hors ligne."
      });
      return false;
    }
    
    setIsSyncing(true);
    try {
      // Sauvegarder localement d'abord
      saveLocalDocuments(docs);
      
      // Puis synchroniser avec le serveur
      const success = await syncDocumentsWithServer(docs);
      
      if (success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        return true;
      }
      
      setSyncFailed(true);
      return false;
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setSyncFailed(true);
      
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, documents]);

  // Fonctions de gestion des documents
  const handleResponsabiliteChange = (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id
          ? {
              ...doc,
              responsabilites: {
                ...doc.responsabilites,
                [type]: values,
              },
            }
          : doc
      )
    );
  };

  const handleAtteinteChange = (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id
          ? {
              ...doc,
              etat: atteinte,
            }
          : doc
      )
    );
  };

  const handleExclusionChange = (id: string) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id
          ? {
              ...doc,
              excluded: doc.excluded === true ? false : true,
            }
          : doc
      )
    );
  };

  const handleEdit = (id: string) => {
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
  };

  const handleSaveDocument = (updatedDocument: Document) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === updatedDocument.id
          ? updatedDocument
          : doc
      )
    );
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleAddDocument = () => {
    const newId = uuidv4();
    const newDocument: Document = {
      id: newId,
      nom: 'Nouveau document',
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date(),
      excluded: false
    };
    setDocuments(prev => [...prev, newDocument]);
    
    // For direct adding in table, don't open dialog
    // but still set the editing document for reference
    setEditingDocument(newDocument);
    setDialogOpen(true);
    
    return newDocument;
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    setGroups(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const handleToggleGroup = (id: string) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === id ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = (updatedGroup: DocumentGroup) => {
    if (editingGroup) {
      // Mise à jour d'un groupe existant
      setGroups(prev =>
        prev.map(group =>
          group.id === updatedGroup.id ? updatedGroup : group
        )
      );
    } else {
      // Ajout d'un nouveau groupe
      setGroups(prev => [...prev, { ...updatedGroup, id: uuidv4() }]);
    }
    setGroupDialogOpen(false);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(prev => prev.filter(group => group.id !== id));
  };

  // Fonctions pour DataSyncManager
  

  return {
    documents,
    groups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    setIsSyncing,
    isOnline,
    lastSynced,
    setLastSynced,
    syncFailed,
    setDialogOpen,
    setGroupDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveDocument,
    handleDelete,
    handleAddDocument,
    handleReorder,
    handleGroupReorder,
    handleToggleGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleAddGroup,
    // Fonctions pour DataSyncManager
    syncWithServer,
    loadDocuments,
  };
}
