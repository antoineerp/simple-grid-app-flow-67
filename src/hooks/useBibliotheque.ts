
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';
import { useSyncContext } from '@/hooks/useSyncContext';

export const useBibliotheque = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: "",
    name: "",
    link: "",
    groupId: undefined
  });
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({
    id: "",
    name: "",
    expanded: false,
    items: []
  });
  
  const { toast } = useToast();
  
  // Utiliser le hook useSyncContext pour la synchronisation
  // Mise à jour du nom de la table de "bibliotheque" à "collaboration"
  const { 
    syncWithServer, 
    isSyncing, 
    isOnline, 
    lastSynced, 
    syncFailed, 
    notifyChanges 
  } = useSyncContext('collaboration', documents, { autoSync: true });
  
  // Charger les données locales au démarrage
  useEffect(() => {
    const loadLocalData = () => {
      try {
        // Mise à jour pour vérifier aussi les données sous l'ancien nom
        let docsData = localStorage.getItem('collaboration');
        if (!docsData) {
          docsData = localStorage.getItem('bibliotheque');
          // Si trouvé sous l'ancien nom, migrer vers le nouveau
          if (docsData) {
            localStorage.setItem('collaboration', docsData);
          }
        }
        
        let groupsData = localStorage.getItem('collaboration_groups');
        if (!groupsData) {
          groupsData = localStorage.getItem('bibliotheque_groups');
          // Si trouvé sous l'ancien nom, migrer vers le nouveau
          if (groupsData) {
            localStorage.setItem('collaboration_groups', groupsData);
          }
        }
        
        if (docsData) {
          setDocuments(JSON.parse(docsData));
        }
        
        if (groupsData) {
          setGroups(JSON.parse(groupsData));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données locales:", error);
      }
    };
    
    loadLocalData();
  }, []);
  
  // Sauvegarder les documents localement quand ils changent
  useEffect(() => {
    if (documents.length > 0) {
      // Mise à jour pour utiliser le nouveau nom de stockage
      localStorage.setItem('collaboration', JSON.stringify(documents));
      notifyChanges();
    }
  }, [documents, notifyChanges]);
  
  // Sauvegarder les groupes localement quand ils changent
  useEffect(() => {
    if (groups.length > 0) {
      // Mise à jour pour utiliser le nouveau nom de stockage
      localStorage.setItem('collaboration_groups', JSON.stringify(groups));
      notifyChanges();
    }
  }, [groups, notifyChanges]);
  
  // Fonctions pour gérer les documents
  const handleAddDocument = useCallback((doc: Document) => {
    setDocuments((prevDocs) => [...prevDocs, doc]);
  }, []);
  
  const handleUpdateDocument = useCallback((doc: Document) => {
    setDocuments((prevDocs) =>
      prevDocs.map((d) => (d.id === doc.id ? doc : d))
    );
  }, []);
  
  const handleDeleteDocument = useCallback((id: string) => {
    setDocuments((prevDocs) => prevDocs.filter((d) => d.id !== id));
  }, []);

  // Fonctions pour gérer les documents - pour la compatibilité avec Collaboration.tsx
  const handleEditDocument = useCallback((doc: Document) => {
    setDocuments((prevDocs) =>
      prevDocs.map((d) => (d.id === doc.id ? doc : d))
    );
  }, []);
  
  // Fonctions pour gérer les groupes
  const handleAddGroup = useCallback((group: DocumentGroup) => {
    setGroups((prevGroups) => [...prevGroups, group]);
  }, []);
  
  const handleUpdateGroup = useCallback((group: DocumentGroup) => {
    setGroups((prevGroups) =>
      prevGroups.map((g) => (g.id === group.id ? group : g))
    );
  }, []);
  
  const handleDeleteGroup = useCallback((id: string) => {
    // Mettre à jour les documents qui étaient dans ce groupe
    setDocuments((prevDocs) =>
      prevDocs.map((d) => (d.groupId === id ? { ...d, groupId: undefined } : d))
    );
    
    // Supprimer le groupe
    setGroups((prevGroups) => prevGroups.filter((g) => g.id !== id));
  }, []);

  // Fonctions pour gérer les groupes - pour la compatibilité avec Collaboration.tsx
  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setGroups((prevGroups) =>
      prevGroups.map((g) => (g.id === group.id ? group : g))
    );
  }, []);

  const handleToggleGroup = useCallback((id: string) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === id ? { ...group, expanded: !group.expanded } : group
      )
    );
  }, []);
  
  // Fonction de synchronisation manuelle
  const handleSyncDocuments = async (): Promise<void> => {
    try {
      // Ajouter des logs pour déboguer la synchronisation
      console.log("Début de la synchronisation des documents de collaboration");
      console.log("Documents à synchroniser:", documents);
      console.log("Groupes à synchroniser:", groups);
      
      await syncWithServer();
      
      console.log("Fin de la synchronisation des documents de collaboration");
      return Promise.resolve();
    } catch (error) {
      console.error("Erreur lors de la synchronisation des documents:", error);
      return Promise.reject(error);
    }
  };
  
  return {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
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
    handleSyncDocuments,
    // Ajouter ces méthodes pour la compatibilité avec Collaboration.tsx
    handleEditDocument,
    handleEditGroup,
    handleToggleGroup,
    syncWithServer,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed
  };
};
