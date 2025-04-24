
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { loadBibliothequeFromStorage, saveBibliothequeToStorage } from '@/services/bibliotheque/bibliothequeService';
import { syncBibliothequeWithServer, loadBibliothequeFromServer } from '@/services/bibliotheque/bibliothequeSync';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useBibliotheque = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: '',
    name: '',
    link: null
  });
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({
    id: '',
    name: '',
    expanded: false,
    items: []
  });
  const [draggedItem, setDraggedItem] = useState<{ id: string, groupId?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const { isOnline } = useNetworkStatus();

  const currentUser = localStorage.getItem('currentUser') || 'default';

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);
  
  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (documents.length > 0 || groups.length > 0) {
      saveBibliothequeToStorage(documents, groups, currentUser);
    }
  }, [documents, groups]);

  // Charger les données
  const loadData = async () => {
    // D'abord, essayer de charger depuis le serveur
    if (isOnline) {
      try {
        const serverData = await loadBibliothequeFromServer(currentUser);
        if (serverData) {
          setDocuments(serverData.documents);
          setGroups(serverData.groups);
          setLastSynced(new Date());
          return;
        }
      } catch (error) {
        console.error('Erreur lors du chargement depuis le serveur:', error);
      }
    }
    
    // Charger depuis le stockage local si le serveur n'est pas disponible
    const localData = loadBibliothequeFromStorage(currentUser);
    setDocuments(localData.documents);
    setGroups(localData.groups);
  };

  // Méthode de synchronisation avec le serveur
  const syncWithServer = async () => {
    if (!isOnline) {
      toast({
        title: "Synchronisation impossible",
        description: "Vous êtes actuellement hors ligne",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    
    try {
      // Extraction des documents des groupes
      const groupDocuments = groups.flatMap(group => 
        group.items.map(item => ({...item, groupId: group.id}))
      );
      
      // Combiner les documents indépendants et ceux des groupes
      const allDocuments = [...documents, ...groupDocuments];
      
      // Groupes sans les items (mais en gardant la structure complète)
      const groupsData: DocumentGroup[] = groups.map(group => ({
        id: group.id,
        name: group.name,
        expanded: group.expanded,
        items: [] // Adding empty items array to satisfy the type
      }));
      
      const success = await syncBibliothequeWithServer(allDocuments, groupsData, currentUser);
      
      if (success) {
        toast({
          title: "Synchronisation réussie",
          description: "La bibliothèque a été synchronisée avec le serveur",
        });
        setLastSynced(new Date());
      } else {
        toast({
          title: "Échec de la synchronisation",
          description: "Une erreur est survenue lors de la synchronisation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      toast({
        title: "Erreur de synchronisation",
        description: `${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Gestion des documents
  const handleEditDocument = (doc: Document) => {
    setCurrentDocument({ ...doc });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteDocument = (id: string) => {
    // Supprimer des documents non-groupés
    setDocuments(docs => docs.filter(doc => doc.id !== id));
    
    // Supprimer des groupes
    setGroups(groups => groups.map(group => ({
      ...group,
      items: group.items.filter(item => item.id !== id)
    })));
    
    toast({
      title: "Suppression",
      description: "Le document a été supprimé",
    });
  };

  const handleAddDocument = () => {
    // Générer un nouvel ID
    const allDocs = [...documents, ...groups.flatMap(g => g.items)];
    const newId = allDocs.length > 0 
      ? String(Math.max(...allDocs.map(d => parseInt(d.id))) + 1)
      : "1";
    
    setCurrentDocument({
      id: newId,
      name: '',
      link: null
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument({
      ...currentDocument,
      [name]: value
    });
  };

  const handleSaveDocument = () => {
    if (currentDocument.name.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom du document est requis",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      if (currentDocument.groupId) {
        setGroups(groups => 
          groups.map(group => 
            group.id === currentDocument.groupId 
              ? {
                  ...group,
                  items: group.items.map(item => 
                    item.id === currentDocument.id ? { 
                      ...currentDocument,
                      groupId: group.id  // Assurer que groupId est conservé
                    } : item
                  )
                }
              : group
          )
        );
      } else {
        setDocuments(docs => 
          docs.map(doc => doc.id === currentDocument.id ? currentDocument : doc)
        );
      }
      toast({
        title: "Modification",
        description: "Le document a été modifié",
      });
    } else {
      setDocuments(docs => [...docs, currentDocument]);
      toast({
        title: "Ajout",
        description: "Le document a été ajouté",
      });
    }
    
    setIsDialogOpen(false);
  };

  // Gestion des groupes
  const handleEditGroup = (group: DocumentGroup) => {
    setCurrentGroup({ ...group });
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };

  const handleDeleteGroup = (id: string) => {
    const groupToDelete = groups.find(g => g.id === id);
    if (groupToDelete && groupToDelete.items.length > 0) {
      const docsToMove = [...groupToDelete.items];
      setDocuments(prev => [...prev, ...docsToMove]);
    }
    
    setGroups(groups => groups.filter(group => group.id !== id));
    toast({
      title: "Suppression",
      description: "Le groupe a été supprimé",
    });
  };

  const handleAddGroup = () => {
    const newId = groups.length > 0 
      ? String(Math.max(...groups.map(g => parseInt(g.id))) + 1)
      : "1";
    setCurrentGroup({
      id: newId,
      name: '',
      expanded: false,
      items: []
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };

  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentGroup({
      ...currentGroup,
      [name]: value
    });
  };

  const handleSaveGroup = () => {
    if (currentGroup.name.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom du groupe est requis",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      setGroups(groups => 
        groups.map(group => group.id === currentGroup.id ? {
          ...currentGroup,
          items: group.items // Conserver les items existants
        } : group)
      );
      toast({
        title: "Modification",
        description: "Le groupe a été modifié",
      });
    } else {
      setGroups(groups => [...groups, { ...currentGroup, items: [] }]);
      toast({
        title: "Ajout",
        description: "Le groupe a été ajouté",
      });
    }
    
    setIsGroupDialogOpen(false);
  };

  // Gestion du drag & drop
  const handleDrop = (targetId: string, targetGroupId?: string) => {
    if (!draggedItem) return;
    
    const { id: sourceId, groupId: sourceGroupId } = draggedItem;
    
    if (sourceId === targetId && sourceGroupId === targetGroupId) return;
    
    if (targetGroupId !== undefined && sourceGroupId !== targetGroupId) {
      // Déplacer un document vers un groupe
      let docToMove;
      
      if (sourceGroupId) {
        // Document provient d'un autre groupe
        setGroups(groups => groups.map(group => 
          group.id === sourceGroupId 
            ? { ...group, items: group.items.filter(item => item.id !== sourceId) }
            : group
        ));
        
        // Trouver le document
        const sourceGroup = groups.find(g => g.id === sourceGroupId);
        docToMove = sourceGroup?.items.find(d => d.id === sourceId);
      } else {
        // Document provient de la liste principale
        setDocuments(docs => docs.filter(doc => doc.id !== sourceId));
        docToMove = documents.find(d => d.id === sourceId);
      }
      
      if (docToMove) {
        // Ajouter au nouveau groupe
        setGroups(groups => groups.map(group => 
          group.id === targetGroupId
            ? { ...group, items: [...group.items, { ...docToMove, groupId: targetGroupId }] }
            : group
        ));
        
        toast({
          title: "Déplacement",
          description: "Le document a été déplacé vers un groupe",
        });
      }
    } else if (sourceGroupId === targetGroupId) {
      // Réorganiser à l'intérieur d'un groupe ou de la liste principale
      if (sourceGroupId) {
        // Réorganiser à l'intérieur d'un groupe
        const group = groups.find(g => g.id === sourceGroupId);
        if (!group) return;
        
        const sourceIndex = group.items.findIndex(item => item.id === sourceId);
        const targetIndex = group.items.findIndex(item => item.id === targetId);
        
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
        
        setGroups(groups => groups.map(g => {
          if (g.id === sourceGroupId) {
            const newItems = [...g.items];
            const [removed] = newItems.splice(sourceIndex, 1);
            newItems.splice(targetIndex, 0, removed);
            return { ...g, items: newItems };
          }
          return g;
        }));
      } else {
        // Réorganiser dans la liste principale
        const sourceIndex = documents.findIndex(doc => doc.id === sourceId);
        const targetIndex = documents.findIndex(doc => doc.id === targetId);
        
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
        
        setDocuments(prev => {
          const result = Array.from(prev);
          const [removed] = result.splice(sourceIndex, 1);
          result.splice(targetIndex, 0, removed);
          return result;
        });
      }
      
      toast({
        title: "Réorganisation",
        description: "L'ordre des documents a été mis à jour",
      });
    }
    
    setDraggedItem(null);
  };

  const handleGroupDrop = (targetGroupId: string) => {
    if (!draggedItem) return;
    
    const { id: sourceId, groupId: sourceGroupId } = draggedItem;
    
    if (sourceGroupId !== undefined && sourceId === targetGroupId) return;
    
    if (sourceGroupId === undefined && sourceId) {
      // On déplace un document vers un groupe (en ciblant le groupe directement)
      setDocuments(docs => docs.filter(doc => doc.id !== sourceId));
      
      const docToMove = documents.find(d => d.id === sourceId);
      
      if (docToMove) {
        setGroups(groups => groups.map(group => 
          group.id === targetGroupId
            ? { ...group, items: [...group.items, { ...docToMove, groupId: targetGroupId }] }
            : group
        ));
        
        toast({
          title: "Déplacement",
          description: `Document déplacé dans le groupe ${groups.find(g => g.id === targetGroupId)?.name}`,
        });
      }
    }
    
    setDraggedItem(null);
  };

  const toggleGroup = (id: string) => {
    setGroups(groups => 
      groups.map(group => 
        group.id === id ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

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
    setIsDialogOpen,
    setIsGroupDialogOpen,
    handleEditDocument,
    handleDeleteDocument,
    handleAddDocument,
    handleDocumentInputChange,
    handleSaveDocument,
    handleEditGroup,
    handleDeleteGroup,
    handleAddGroup,
    handleGroupInputChange,
    handleSaveGroup,
    handleDrop,
    handleGroupDrop,
    toggleGroup,
    setDraggedItem,
    syncWithServer
  };
};
