
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { loadDocumentsFromStorage, saveDocumentsToStorage, calculateDocumentStatsLegacy } from '@/services/documents';
import { loadDocumentsFromServer, syncDocumentsWithServer, checkDocumentApiAvailability } from '@/services/documents';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useDocuments = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const currentUser = localStorage.getItem('currentUser') || 'default';

  const [documents, setDocuments] = useState<Document[]>(() => {
    return loadDocumentsFromStorage(currentUser);
  });

  const [groups, setGroups] = useState<DocumentGroup[]>(() => {
    const storedGroups = localStorage.getItem(`document_groups_${currentUser}`);
    return storedGroups ? JSON.parse(storedGroups) : [];
  });

  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [stats, setStats] = useState<DocumentStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const [apiAvailable, setApiAvailable] = useState<{
    load: boolean;
    sync: boolean;
  }>({
    load: false,
    sync: false
  });

  // Vérifier la disponibilité de l'API
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const apiStatus = await checkDocumentApiAvailability();
        setApiAvailable({
          load: apiStatus.loadAvailable,
          sync: apiStatus.syncAvailable
        });
      } catch (error) {
        console.error("Erreur lors de la vérification de l'API:", error);
        setApiAvailable({
          load: false,
          sync: false
        });
      }
    };
    
    checkApiStatus();
  }, []);

  // Chargement initial depuis le serveur
  useEffect(() => {
    const fetchDocumentsFromServer = async () => {
      try {
        const serverDocuments = await loadDocumentsFromServer(currentUser);
        if (serverDocuments) {
          setDocuments(serverDocuments);
          saveDocumentsToStorage(serverDocuments, currentUser);
          console.log('Documents chargés depuis le serveur et mis en cache');
          setLastSynced(new Date());
        } else {
          console.log('Aucun document trouvé sur le serveur, utilisation des données locales');
          syncWithServer();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des documents depuis le serveur:', error);
      }
    };

    if (isOnline && apiAvailable.load) {
      fetchDocumentsFromServer();
    }
  }, [currentUser, isOnline, apiAvailable.load]);

  // Sauvegarde locale à chaque changement
  useEffect(() => {
    saveDocumentsToStorage(documents, currentUser);
  }, [documents, currentUser]);

  // Sauvegarde des groupes
  useEffect(() => {
    localStorage.setItem(`document_groups_${currentUser}`, JSON.stringify(groups));
  }, [groups, currentUser]);

  // Calcul des statistiques
  useEffect(() => {
    setStats(calculateDocumentStatsLegacy(documents));
  }, [documents]);

  // Synchronisation auto différée
  useEffect(() => {
    if (!isOnline || !apiAvailable.sync) return;

    const debounceSync = setTimeout(() => {
      syncWithServer(false); // Sync silencieuse
    }, 5000);

    return () => clearTimeout(debounceSync);
  }, [documents, isOnline, apiAvailable.sync]);

  // Fonction de synchronisation
  const syncWithServer = async (showToast: boolean = true) => {
    if (isSyncing || !isOnline || !apiAvailable.sync) return;

    setIsSyncing(true);
    try {
      const success = await syncDocumentsWithServer(documents, currentUser);

      if (success) {
        setLastSynced(new Date());
        if (showToast) {
          toast({
            title: "Synchronisation réussie",
            description: "Vos documents ont été synchronisés avec le serveur",
          });
        }
      } else if (showToast) {
        toast({
          title: "Erreur de synchronisation",
          description: "Impossible de synchroniser vos documents",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      if (showToast) {
        toast({
          title: "Erreur de synchronisation",
          description: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`,
          variant: "destructive"
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Handlers pour les modifications de documents
  const handleResponsabiliteChange = (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => 
      prev.map(document => 
        document.id === id 
          ? { 
              ...document, 
              responsabilites: { 
                ...document.responsabilites, 
                [type]: values
              },
              date_modification: new Date()
            } 
          : document
      )
    );
  };

  const handleAtteinteChange = (id: string, etat: 'NC' | 'PC' | 'C' | 'EX' | null) => {
    setDocuments(prev => 
      prev.map(document => 
        document.id === id 
          ? { ...document, etat, date_modification: new Date() } 
          : document
      )
    );
  };

  const handleExclusionChange = (id: string) => {
    setDocuments(prev => 
      prev.map(document => 
        document.id === id 
          ? { ...document, etat: document.etat === 'EX' ? null : 'EX', date_modification: new Date() } 
          : document
      )
    );
  };

  const handleEdit = (id: string) => {
    const documentToEdit = documents.find(document => document.id === id);
    if (documentToEdit) {
      setEditingDocument(documentToEdit);
      setDialogOpen(true);
    }
  };

  const handleSaveDocument = (updatedDocument: Document) => {
    setDocuments(prev =>
      prev.map(document =>
        document.id === updatedDocument.id ? updatedDocument : document
      )
    );
    toast({
      title: "Document mis à jour",
      description: `Le document ${updatedDocument.nom} a été mis à jour`,
    });
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(document => document.id !== id));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
    });
  };

  const handleAddDocument = () => {
    // Generate a new ID for the new document
    const newId = documents.length > 0
      ? String(Math.max(...documents.map(doc => parseInt(doc.id))) + 1)
      : '1';

    const newDocument: Document = {
      id: newId,
      nom: `Nouveau document ${newId}`,
      fichier_path: null,
      etat: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      date_creation: new Date(),
      date_modification: new Date()
    };

    setDocuments(prev => [...prev, newDocument]);
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
    });
  };

  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId === 'null' ? undefined : targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des documents a été mis à jour",
    });
  };

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const handleSaveGroup = useCallback((group: DocumentGroup) => {
    if (editingGroup) {
      setGroups(prev => prev.map(g => g.id === group.id ? group : g));
      toast({
        title: "Groupe mis à jour",
        description: `Le groupe ${group.name} a été mis à jour avec succès`,
      });
    } else {
      setGroups(prev => [...prev, group]);
      toast({
        title: "Nouveau groupe",
        description: `Le groupe ${group.name} a été créé`,
      });
    }
  }, [editingGroup, toast]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    setDocuments(prev => prev.map(document => 
      document.groupId === groupId ? { ...document, groupId: undefined } : document
    ));
    
    setGroups(prev => prev.filter(g => g.id !== groupId));
    
    toast({
      title: "Suppression",
      description: "Le groupe a été supprimé",
    });
  }, [toast]);

  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    setGroups(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des groupes a été mis à jour",
    });
  }, [toast]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    );
  }, []);

  const processedGroups = groups.map(group => {
    const groupItems = documents.filter(document => document.groupId === group.id);
    return {
      ...group,
      items: groupItems
    };
  });

  return {
    documents,
    groups: processedGroups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    isOnline,
    lastSynced,
    apiAvailable,
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
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleToggleGroup,
    syncWithServer: () => syncWithServer(true)
  };
};
