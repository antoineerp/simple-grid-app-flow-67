import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useCollaborationSync } from '@/features/collaboration/hooks/useCollaborationSync';
import { useToast } from '@/hooks/use-toast';
import { loadCollaborationFromStorage, saveCollaborationToStorage } from '@/services/collaboration/collaborationService';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

export const useCollaboration = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: '',
    name: '',
    link: ''
  });
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({
    id: '',
    name: '',
    expanded: false,
    items: []
  });
  const { toast } = useToast();
  const { 
    loadFromServer, 
    syncWithServer, 
    debounceSyncWithServer, 
    isSyncing, 
    isOnline,
    lastSynced,
    syncFailed
  } = useCollaborationSync();

  // Fonction pour obtenir l'ID utilisateur actuel
  const getCurrentUserId = useCallback(() => {
    const user = getDatabaseConnectionCurrentUser();
    if (typeof user === 'string') return user;
    if (user && typeof user === 'object') {
      const userObj = user as any;
      if (userObj.identifiant_technique) return userObj.identifiant_technique;
      if (userObj.email) return userObj.email;
      if (userObj.id) return userObj.id;
    }
    return 'p71x6d_richard'; // Utiliser une valeur par défaut valide
  }, []);

  // Chargement initial des données
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        console.log("Chargement initial des documents de collaboration");
        
        // Charger d'abord depuis le stockage local
        const { documents: localDocs, groups: localGroups } = loadCollaborationFromStorage();
        setDocuments(localDocs);
        setGroups(localGroups);
        
        // Puis essayer de charger depuis le serveur si en ligne
        if (isOnline) {
          const userId = getCurrentUserId();
          console.log("Tentative de chargement depuis le serveur avec userId:", userId);
          
          const serverDocuments = await loadFromServer(userId);
          
          if (serverDocuments && serverDocuments.length > 0) {
            // Si on a des documents du serveur, on les utilise
            console.log("Documents chargés depuis le serveur:", serverDocuments.length);
            
            const groupedDocs = serverDocuments.filter(doc => doc.groupId);
            const ungroupedDocs = serverDocuments.filter(doc => !doc.groupId);
            
            // Créer les groupes à partir des documents groupés
            const uniqueGroups = Array.from(new Set(groupedDocs.map(doc => doc.groupId))).filter(Boolean);
            const newGroups = uniqueGroups.map(groupId => {
              const docs = groupedDocs.filter(doc => doc.groupId === groupId);
              const groupName = docs.length > 0 ? `Groupe ${groupId}` : `Groupe ${groupId}`;
              return {
                id: groupId as string,
                name: groupName,
                expanded: false,
                items: docs
              };
            });
            
            setGroups(newGroups);
            setDocuments(ungroupedDocs);
          } else {
            console.log("Aucun document reçu du serveur, utilisation des données locales");
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les documents. Veuillez réessayer plus tard.",
        });
      }
    };
    
    loadDocuments();
  }, [loadFromServer, toast, getCurrentUserId, isOnline]);

  // Fonction pour synchroniser les documents avec le serveur
  const handleSyncDocuments = useCallback(async () => {
    try {
      const userId = getCurrentUserId();
      await syncWithServer(documents, groups, userId);
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation des documents.",
      });
    }
  }, [documents, groups, syncWithServer, toast, getCurrentUserId]);

  // Fonctions CRUD pour les documents
  const handleAddDocument = useCallback((doc: Document) => {
    const newDoc = { 
      ...doc, 
      id: doc.id || `doc-${uuidv4()}`,
      userId: getCurrentUserId()
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setIsDialogOpen(false);
    
    const userId = getCurrentUserId();
    debounceSyncWithServer([...documents, newDoc], groups, userId);
    
    toast({
      title: "Document ajouté",
      description: `Le document ${newDoc.name} a été ajouté.`,
    });
  }, [documents, groups, debounceSyncWithServer, toast, getCurrentUserId]);

  const handleUpdateDocument = useCallback((doc: Document) => {
    if (doc.groupId) {
      // Mettre à jour un document dans un groupe
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === doc.groupId 
            ? { 
                ...group, 
                items: group.items.map(item => 
                  item.id === doc.id ? doc : item
                ) 
              }
            : group
        )
      );
    } else {
      // Mettre à jour un document hors groupe
      setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    }
    
    setIsDialogOpen(false);
    
    const userId = getCurrentUserId();
    const updatedDocuments = documents.map(d => d.id === doc.id ? doc : d);
    debounceSyncWithServer(updatedDocuments, groups, userId);
    
    toast({
      title: "Document mis à jour",
      description: `Le document ${doc.name} a été mis à jour.`,
    });
  }, [documents, groups, debounceSyncWithServer, toast, getCurrentUserId]);

  const handleDeleteDocument = useCallback((id: string) => {
    // Vérifier si le document est dans un groupe
    let documentInGroup = false;
    let updatedGroups = [...groups];
    
    updatedGroups = updatedGroups.map(group => {
      const documentIndex = group.items.findIndex(item => item.id === id);
      if (documentIndex !== -1) {
        documentInGroup = true;
        return {
          ...group,
          items: group.items.filter(item => item.id !== id)
        };
      }
      return group;
    });
    
    if (documentInGroup) {
      setGroups(updatedGroups);
    } else {
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
    
    setIsDialogOpen(false);
    
    const userId = getCurrentUserId();
    const updatedDocuments = documents.filter(d => d.id !== id);
    debounceSyncWithServer(updatedDocuments, documentInGroup ? updatedGroups : groups, userId);
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé.",
    });
  }, [documents, groups, debounceSyncWithServer, toast, getCurrentUserId]);

  // Fonctions CRUD pour les groupes
  const handleAddGroup = useCallback((group: DocumentGroup) => {
    const newGroup = { 
      ...group, 
      id: group.id || `group-${uuidv4()}`,
      items: [],
      expanded: false,
      userId: getCurrentUserId()
    };
    
    setGroups(prev => [...prev, newGroup]);
    setIsGroupDialogOpen(false);
    
    const userId = getCurrentUserId();
    debounceSyncWithServer(documents, [...groups, newGroup], userId);
    
    toast({
      title: "Groupe ajouté",
      description: `Le groupe ${newGroup.name} a été ajouté.`,
    });
  }, [documents, groups, debounceSyncWithServer, toast, getCurrentUserId]);

  const handleUpdateGroup = useCallback((group: DocumentGroup) => {
    setGroups(prev => 
      prev.map(g => 
        g.id === group.id 
          ? { ...group, items: g.items } 
          : g
      )
    );
    
    setIsGroupDialogOpen(false);
    
    const userId = getCurrentUserId();
    const updatedGroups = groups.map(g => g.id === group.id ? { ...group, items: g.items } : g);
    debounceSyncWithServer(documents, updatedGroups, userId);
    
    toast({
      title: "Groupe mis à jour",
      description: `Le groupe ${group.name} a été mis à jour.`,
    });
  }, [documents, groups, debounceSyncWithServer, toast, getCurrentUserId]);

  const handleDeleteGroup = useCallback((id: string) => {
    // Libérer les documents du groupe avant de le supprimer
    const groupToDelete = groups.find(g => g.id === id);
    let docsToMove: Document[] = [];
    
    if (groupToDelete) {
      docsToMove = groupToDelete.items.map(item => ({
        ...item,
        groupId: undefined
      }));
    }
    
    setGroups(prev => prev.filter(g => g.id !== id));
    setDocuments(prev => [...prev, ...docsToMove]);
    setIsGroupDialogOpen(false);
    
    const userId = getCurrentUserId();
    const updatedGroups = groups.filter(g => g.id !== id);
    const updatedDocuments = [...documents, ...docsToMove];
    debounceSyncWithServer(updatedDocuments, updatedGroups, userId);
    
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé et ses documents ont été déplacés.",
    });
  }, [documents, groups, debounceSyncWithServer, toast, getCurrentUserId]);

  const handleToggleGroup = useCallback((id: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === id ? { ...group, expanded: !group.expanded } : group
      )
    );
  }, []);

  return {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setIsEditing,
    setCurrentDocument,
    setCurrentGroup,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleToggleGroup,
    handleSyncDocuments
  };
};
