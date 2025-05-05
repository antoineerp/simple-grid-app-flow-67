
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
  const { toast } = useToast();
  const { syncTable, isOnline } = useGlobalSync();

  // Utiliser le hook de gestion des groupes
  const { 
    handleGroupReorder,
    handleToggleGroup,
    handleSaveGroup,
    handleDeleteGroup
  } = useDocumentGroups(groups, setGroups);

  // Chargement initial des données
  useEffect(() => {
    const loadData = () => {
      try {
        // Charger les documents
        const storedDocs = localStorage.getItem(`documents_${currentUser}`);
        if (storedDocs) {
          const parsedDocs = JSON.parse(storedDocs);
          // Assurez-vous que tous les documents ont un userId
          const docsWithUser = parsedDocs.map((doc: Document) => ({
            ...doc,
            userId: doc.userId || currentUser
          }));
          setDocuments(docsWithUser);
        }

        // Charger les groupes
        const storedGroups = localStorage.getItem(`document_groups_${currentUser}`);
        if (storedGroups) {
          const parsedGroups = JSON.parse(storedGroups);
          // Assurez-vous que tous les groupes ont un userId
          const groupsWithUser = parsedGroups.map((group: DocumentGroup) => ({
            ...group,
            userId: group.userId || currentUser
          }));
          setGroups(groupsWithUser);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
      }
    };

    loadData();
    
    // Sync initialement si en ligne
    if (isOnline) {
      setTimeout(() => {
        syncDocumentsWithServer();
      }, 1000);
    }
  }, [currentUser, isOnline]);

  // Sauvegarder les documents quand ils changent
  useEffect(() => {
    if (documents.length > 0) {
      // Assurez-vous que tous les documents ont un userId
      const docsWithUser = documents.map(doc => ({
        ...doc,
        userId: doc.userId || currentUser
      }));
      
      localStorage.setItem(`documents_${currentUser}`, JSON.stringify(docsWithUser));
      
      // Synchroniser avec le serveur (debounced)
      if (isOnline) {
        const timer = setTimeout(() => {
          syncTable('documents', docsWithUser).catch(console.error);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [documents, currentUser, syncTable, isOnline]);

  // Sauvegarder les groupes quand ils changent
  useEffect(() => {
    if (groups.length > 0) {
      // Assurez-vous que tous les groupes ont un userId
      const groupsWithUser = groups.map(group => ({
        ...group,
        userId: group.userId || currentUser
      }));
      
      localStorage.setItem(`document_groups_${currentUser}`, JSON.stringify(groupsWithUser));
      
      // Synchroniser avec le serveur (debounced)
      if (isOnline) {
        const timer = setTimeout(() => {
          syncTable('document_groups', groupsWithUser).catch(console.error);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [groups, currentUser, syncTable, isOnline]);

  // Fonctions de mutation pour les documents
  const handleAddDocument = useCallback(() => {
    // Créer un nouveau document avec l'userId
    const newDocument: Document = {
      id: uuidv4(),
      nom: 'Nouveau document',
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date(),
      userId: currentUser
    };
    
    setDocuments(prev => [...prev, newDocument]);
    toast({
      title: 'Document créé',
      description: 'Un nouveau document a été ajouté',
    });
  }, [toast, currentUser]);

  const handleEdit = useCallback((id: string) => {
    // Fonction pour éditer un document
    console.log(`Édition du document ${id}`);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: 'Document supprimé',
      description: 'Le document a été supprimé avec succès',
    });
  }, [toast]);

  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    // Déplacer un document (potentiellement vers un autre groupe)
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      // Mettre à jour le groupId si nécessaire
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          responsabilites: {
            ...doc.responsabilites,
            [type]: values
          },
          date_modification: new Date()
        };
      }
      return doc;
    }));
  }, []);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          etat: atteinte,
          date_modification: new Date()
        };
      }
      return doc;
    }));
  }, []);

  const handleExclusionChange = useCallback((id: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          excluded: !doc.excluded,
          date_modification: new Date()
        };
      }
      return doc;
    }));
  }, []);

  // Fonction spécifique pour la gestion des groupes
  const handleAddGroup = useCallback((group: DocumentGroup) => {
    // Assurez-vous que le groupe a un userId
    const groupWithUser = {
      ...group,
      userId: group.userId || currentUser
    };
    
    handleSaveGroup(groupWithUser, false);
  }, [handleSaveGroup, currentUser]);

  const handleEditGroup = useCallback((group: DocumentGroup) => {
    // Assurez-vous que le groupe a un userId lors de l'édition
    const groupWithUser = {
      ...group,
      userId: group.userId || currentUser
    };
    
    handleSaveGroup(groupWithUser, true);
  }, [handleSaveGroup, currentUser]);

  // Fonction pour forcer la synchronisation avec le serveur
  const syncDocumentsWithServer = async (): Promise<void> => {
    try {
      setIsSyncing(true);
      
      // Synchroniser les documents
      await syncTable('documents', documents.map(doc => ({
        ...doc,
        userId: doc.userId || currentUser
      })));
      
      // Synchroniser les groupes
      await syncTable('document_groups', groups.map(group => ({
        ...group,
        userId: group.userId || currentUser
      })));
      
      toast({
        title: 'Synchronisation terminée',
        description: 'Les documents ont été synchronisés avec le serveur',
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de synchronisation',
        description: 'La synchronisation avec le serveur a échoué',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Fonction pour forcer le rechargement des données
  const forceReload = async () => {
    await syncDocumentsWithServer();
  };

  return {
    documents,
    groups,
    handleAddDocument,
    handleEdit,
    handleDelete,
    handleReorder,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleAddGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleToggleGroup,
    handleGroupReorder,
    forceReload,
    isSyncing
  };
};
