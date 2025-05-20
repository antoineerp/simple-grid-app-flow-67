
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useCollaborationSync } from '@/features/collaboration/hooks/useCollaborationSync';
import { useToast } from '@/hooks/use-toast';
import { loadCollaborationFromStorage, saveCollaborationToStorage } from '@/services/collaboration/collaborationService';

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

  // Chargement initial des données
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        console.log("Chargement initial des documents de collaboration");
        
        // Charger d'abord depuis le stockage local
        const { documents: localDocs, groups: localGroups } = loadCollaborationFromStorage();
        
        if (localDocs.length > 0 || localGroups.length > 0) {
          setDocuments(localDocs);
          setGroups(localGroups);
          console.log("Documents chargés depuis le stockage local:", localDocs.length, "groups:", localGroups.length);
        }
        
        // Puis essayer de charger depuis le serveur si en ligne
        if (isOnline) {
          console.log("Tentative de chargement depuis le serveur");
          
          const serverDocuments = await loadFromServer();
          
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
            
            // Sauvegarder ces données server en local pour assurer la cohérence
            saveCollaborationToStorage(ungroupedDocs, newGroups);
          } else if (localDocs.length === 0 && localGroups.length === 0) {
            console.log("Aucun document reçu du serveur, initialisation avec des données par défaut");
            
            // Si aucune donnée locale ni serveur, créer des données par défaut
            const defaultDocs = [
              { id: "1", name: 'Document de référence', link: 'Voir le document' },
              { id: "2", name: 'Document technique', link: 'Voir le document' },
            ];
            
            const defaultGroups = [
              { id: "1", name: 'Documents organisationnels', expanded: false, items: [] },
              { id: "2", name: 'Documents techniques', expanded: false, items: [] },
            ];
            
            setDocuments(defaultDocs);
            setGroups(defaultGroups);
            
            // Synchroniser immédiatement avec le serveur pour conserver ces données
            await syncWithServer(defaultDocs, defaultGroups);
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
  }, [loadFromServer, toast, isOnline, syncWithServer]);

  // Fonction pour synchroniser les documents avec le serveur
  const handleSyncDocuments = useCallback(async () => {
    try {
      const result = await syncWithServer(documents, groups);
      if (result) {
        toast({
          title: "Synchronisation réussie",
          description: "Les documents ont été synchronisés avec succès.",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation des documents.",
      });
    }
  }, [documents, groups, syncWithServer, toast]);

  // Fonctions CRUD pour les documents
  const handleAddDocument = useCallback((doc: Document) => {
    const newDoc = { 
      ...doc, 
      id: doc.id || `doc-${uuidv4()}`
    };
    
    const updatedDocuments = [...documents, newDoc];
    setDocuments(updatedDocuments);
    setIsDialogOpen(false);
    
    // Synchroniser avec le serveur
    debounceSyncWithServer(updatedDocuments, groups);
    
    // Sauvegarder aussi dans le stockage local
    saveCollaborationToStorage(updatedDocuments, groups);
    
    toast({
      title: "Document ajouté",
      description: `Le document ${newDoc.name} a été ajouté.`,
    });
  }, [documents, groups, debounceSyncWithServer, toast]);

  const handleUpdateDocument = useCallback((doc: Document) => {
    let updatedDocuments = [...documents];
    let updatedGroups = [...groups];
    
    if (doc.groupId) {
      // Mettre à jour un document dans un groupe
      updatedGroups = groups.map(group => 
        group.id === doc.groupId 
          ? { 
              ...group, 
              items: group.items.map(item => 
                item.id === doc.id ? doc : item
              ) 
            }
          : group
      );
      setGroups(updatedGroups);
    } else {
      // Mettre à jour un document hors groupe
      updatedDocuments = documents.map(d => d.id === doc.id ? doc : d);
      setDocuments(updatedDocuments);
    }
    
    setIsDialogOpen(false);
    
    // Synchroniser avec le serveur
    debounceSyncWithServer(updatedDocuments, updatedGroups);
    
    // Sauvegarder aussi dans le stockage local
    saveCollaborationToStorage(updatedDocuments, updatedGroups);
    
    toast({
      title: "Document mis à jour",
      description: `Le document ${doc.name} a été mis à jour.`,
    });
  }, [documents, groups, debounceSyncWithServer, toast]);

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
    
    let updatedDocuments = [...documents];
    
    if (documentInGroup) {
      setGroups(updatedGroups);
    } else {
      updatedDocuments = documents.filter(d => d.id !== id);
      setDocuments(updatedDocuments);
    }
    
    setIsDialogOpen(false);
    
    // Synchroniser avec le serveur
    debounceSyncWithServer(updatedDocuments, updatedGroups);
    
    // Sauvegarder aussi dans le stockage local
    saveCollaborationToStorage(updatedDocuments, updatedGroups);
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé.",
    });
  }, [documents, groups, debounceSyncWithServer, toast]);

  // Fonctions CRUD pour les groupes
  const handleAddGroup = useCallback((group: DocumentGroup) => {
    const newGroup = { 
      ...group, 
      id: group.id || `group-${uuidv4()}`,
      items: [],
      expanded: false
    };
    
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    setIsGroupDialogOpen(false);
    
    // Synchroniser avec le serveur
    debounceSyncWithServer(documents, updatedGroups);
    
    // Sauvegarder aussi dans le stockage local
    saveCollaborationToStorage(documents, updatedGroups);
    
    toast({
      title: "Groupe ajouté",
      description: `Le groupe ${newGroup.name} a été ajouté.`,
    });
  }, [documents, groups, debounceSyncWithServer, toast]);

  const handleUpdateGroup = useCallback((group: DocumentGroup) => {
    const updatedGroups = groups.map(g => 
      g.id === group.id 
        ? { ...group, items: g.items } 
        : g
    );
    
    setGroups(updatedGroups);
    setIsGroupDialogOpen(false);
    
    // Synchroniser avec le serveur
    debounceSyncWithServer(documents, updatedGroups);
    
    // Sauvegarder aussi dans le stockage local
    saveCollaborationToStorage(documents, updatedGroups);
    
    toast({
      title: "Groupe mis à jour",
      description: `Le groupe ${group.name} a été mis à jour.`,
    });
  }, [documents, groups, debounceSyncWithServer, toast]);

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
    
    const updatedGroups = groups.filter(g => g.id !== id);
    const updatedDocuments = [...documents, ...docsToMove];
    
    setGroups(updatedGroups);
    setDocuments(updatedDocuments);
    setIsGroupDialogOpen(false);
    
    // Synchroniser avec le serveur
    debounceSyncWithServer(updatedDocuments, updatedGroups);
    
    // Sauvegarder aussi dans le stockage local
    saveCollaborationToStorage(updatedDocuments, updatedGroups);
    
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé et ses documents ont été déplacés.",
    });
  }, [documents, groups, debounceSyncWithServer, toast]);

  const handleToggleGroup = useCallback((id: string) => {
    const updatedGroups = groups.map(group => 
      group.id === id ? { ...group, expanded: !group.expanded } : group
    );
    
    setGroups(updatedGroups);
    
    // Sauvegarder l'état d'expansion dans le stockage local
    saveCollaborationToStorage(documents, updatedGroups);
  }, [documents, groups]);

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
