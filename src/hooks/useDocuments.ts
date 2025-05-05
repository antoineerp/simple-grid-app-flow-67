import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { 
  syncDocumentsWithServer, 
  loadDocumentsFromServer,
  checkDocumentApiAvailability 
} from '@/services/documents/documentSyncService';
import { 
  loadDocumentsFromStorage, 
  saveDocumentsToStorage, 
  calculateDocumentStats 
} from '@/services/documents/documentsService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useDocuments = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const currentUser = localStorage.getItem('currentUser') || 'default';
  
  const [documents, setDocuments] = useState<Document[]>(() => loadDocumentsFromStorage(currentUser));
  const [groups, setGroups] = useState<DocumentGroup[]>(() => {
    const storedGroups = localStorage.getItem(`document_groups_${currentUser}`);
    return storedGroups ? JSON.parse(storedGroups) : [];
  });
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [stats, setStats] = useState<DocumentStats>(() => calculateDocumentStats(documents));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const [apiAvailable, setApiAvailable] = useState({ load: false, sync: false });
  const [apiChecked, setApiChecked] = useState(false);

  useEffect(() => {
    const checkApiEndpoints = async () => {
      const availability = await checkDocumentApiAvailability();
      setApiAvailable({
        load: availability.loadAvailable,
        sync: availability.syncAvailable
      });
      setApiChecked(true);
      
      if (!availability.loadAvailable || !availability.syncAvailable) {
        console.warn("Certains endpoints de l'API des documents ne sont pas disponibles:", 
          availability.loadAvailable ? "✅" : "❌", "Load |", 
          availability.syncAvailable ? "✅" : "❌", "Sync");
      }
    };
    
    checkApiEndpoints();
  }, []);

  useEffect(() => {
    const fetchDocumentsFromServer = async () => {
      if (!apiChecked || !apiAvailable.load) {
        if (apiChecked) {
          console.log("API de chargement des documents non disponible, utilisation des données locales");
        }
        return;
      }
      
      try {
        const serverDocuments = await loadDocumentsFromServer(currentUser);
        if (serverDocuments) {
          setDocuments(serverDocuments);
          localStorage.setItem(`documents_${currentUser}`, JSON.stringify(serverDocuments));
          console.log('Documents chargés depuis le serveur et mis en cache');
        } else {
          console.log('Aucun document trouvé sur le serveur, utilisation des données locales');
          if (apiAvailable.sync) {
            syncWithServer();
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des documents depuis le serveur:', error);
        toast({
          title: "Erreur de synchronisation",
          description: "Impossible de charger les données depuis le serveur. Utilisation des données locales.",
          variant: "destructive"
        });
      }
    };

    fetchDocumentsFromServer();
  }, [currentUser, apiChecked, apiAvailable.load]);

  useEffect(() => {
    setStats(calculateDocumentStats(documents));
  }, [documents]);

  useEffect(() => {
    saveDocumentsToStorage(documents, currentUser);
  }, [documents, currentUser]);

  useEffect(() => {
    localStorage.setItem(`document_groups_${currentUser}`, JSON.stringify(groups));
  }, [groups, currentUser]);

  useEffect(() => {
    if (!apiAvailable.sync) return;
    
    const debounceSync = setTimeout(() => {
      syncWithServer();
    }, 2000);

    return () => clearTimeout(debounceSync);
  }, [documents, apiAvailable.sync]);

  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              responsabilites: { 
                ...doc.responsabilites, 
                [type]: values
              },
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

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

  const handleSaveDocument = useCallback((updatedDocument: Document) => {
    const newDoc = {
      ...updatedDocument,
      date_modification: new Date()
    };
    
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === newDoc.id ? newDoc : doc
      )
    );
    toast({
      title: "Document mis à jour",
      description: `Le document ${newDoc.id} a été mis à jour avec succès`
    });
  }, [toast]);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              etat: atteinte,
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

  const handleExclusionChange = useCallback((id: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              etat: doc.etat === 'EX' ? null : 'EX',
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
    });
  }, [toast]);

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
    
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
    });
  }, [documents, toast]);

  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId;
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
    setDocuments(prev => prev.map(doc => 
      doc.groupId === groupId ? { ...doc, groupId: undefined } : doc
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

  const syncWithServer = async () => {
    if (isSyncing || !apiAvailable.sync) return;
    
    setIsSyncing(true);
    try {
      await syncDocumentsWithServer(documents, currentUser);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const forceSyncWithServer = async () => {
    if (isSyncing) return;
    
    if (!apiAvailable.sync) {
      const availability = await checkDocumentApiAvailability();
      setApiAvailable(prev => ({ ...prev, sync: availability.syncAvailable }));
      
      if (!availability.syncAvailable) {
        toast({
          title: "Synchronisation impossible",
          description: "L'API de synchronisation n'est pas disponible.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setIsSyncing(true);
    try {
      const success = await syncDocumentsWithServer(documents, currentUser);
      
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Vos documents ont été synchronisés avec le serveur",
        });
      } else {
        toast({
          title: "Échec de la synchronisation",
          description: "Une erreur est survenue lors de la synchronisation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        title: "Erreur de synchronisation",
        description: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const processedGroups = groups.map(group => {
    const groupItems = documents.filter(doc => doc.groupId === group.id);
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
    syncWithServer: forceSyncWithServer,
    isOnline,
    lastSynced,
    apiAvailable
  };
};
