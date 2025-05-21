
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';
import { useSyncContext } from '@/hooks/useSyncContext';
import { getCurrentUser } from '@/services/auth/authService';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

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
  
  // S'assurer que currentUser est toujours une chaîne
  const [currentUser, setCurrentUser] = useState<string>(() => {
    // Priorité à l'utilisateur de la base de données
    const dbUser = getDatabaseConnectionCurrentUser();
    if (dbUser) return dbUser;
    
    // Fallback sur l'utilisateur authentifié
    const authUser = getCurrentUser();
    // Ici, authUser est maintenant un string (id technique) ou null
    if (authUser) {
      return authUser;
    }
    
    return 'default';
  });
  
  // Use the GlobalSync context
  const { syncTable, syncAll, isOnline } = useGlobalSync();
  const { syncStates } = useGlobalSync();
  
  // Récupérer l'état de synchronisation spécifique pour 'collaboration'
  const collaborationSyncState = syncStates['collaboration'] || { 
    isSyncing: false, 
    lastSynced: null,
    syncFailed: false 
  };
  
  // Déstructurer l'état de synchronisation pour faciliter l'accès
  const { isSyncing, lastSynced, syncFailed } = collaborationSyncState;
  
  // Create local implementation for missing functions
  const syncWithServer = useCallback(async (documents: Document[], groups: DocumentGroup[], userId?: string) => {
    try {
      console.log(`useBibliotheque: Manually syncing ${documents.length} documents`);
      return await syncTable('collaboration', documents);
    } catch (error) {
      console.error('useBibliotheque: Sync error:', error);
      return false;
    }
  }, [syncTable]);
  
  const notifyChanges = useCallback(() => {
    console.log('useBibliotheque: Notifying data changes');
    
    // Dispatch an event that can be caught by other components
    window.dispatchEvent(new CustomEvent('collaboration-data-changed', {
      detail: { timestamp: Date.now() }
    }));
  }, []);
  
  // Écouter les changements d'utilisateur de base de données
  useEffect(() => {
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.user) {
        const newUser = customEvent.detail.user;
        console.log(`useBibliotheque: Changement d'utilisateur détecté - ${newUser}`);
        setCurrentUser(newUser);
        
        // Vider les données actuelles
        setDocuments([]);
        setGroups([]);
        
        // Charger les données du nouvel utilisateur
        loadLocalData(newUser);
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
  }, []);
  
  // Fonction pour charger les données locales
  const loadLocalData = useCallback((userId: string) => {
    try {
      console.log(`useBibliotheque: Chargement des données pour l'utilisateur ${userId}`);
      
      // Mise à jour pour vérifier aussi les données sous l'ancien nom
      let docsData = localStorage.getItem(`collaboration_${userId}`);
      if (!docsData) {
        docsData = localStorage.getItem('collaboration');
        if (!docsData) {
          docsData = localStorage.getItem(`bibliotheque_${userId}`);
          if (!docsData) {
            docsData = localStorage.getItem('bibliotheque');
          }
        }
        
        // Si trouvé sous l'ancien nom, migrer vers le nouveau
        if (docsData) {
          localStorage.setItem(`collaboration_${userId}`, docsData);
        }
      }
      
      let groupsData = localStorage.getItem(`collaboration_groups_${userId}`);
      if (!groupsData) {
        groupsData = localStorage.getItem('collaboration_groups');
        if (!groupsData) {
          groupsData = localStorage.getItem(`bibliotheque_groups_${userId}`);
          if (!groupsData) {
            groupsData = localStorage.getItem('bibliotheque_groups');
          }
        }
        
        // Si trouvé sous l'ancien nom, migrer vers le nouveau
        if (groupsData) {
          localStorage.setItem(`collaboration_groups_${userId}`, groupsData);
        }
      }
      
      if (docsData) {
        const parsedDocs = JSON.parse(docsData);
        // Ensure all documents have userId
        const docsWithUser = parsedDocs.map((doc: Document) => ({
          ...doc,
          userId: doc.userId || userId
        }));
        setDocuments(docsWithUser);
        console.log(`Chargé ${docsWithUser.length} documents pour l'utilisateur ${userId}`);
      }
      
      if (groupsData) {
        const parsedGroups = JSON.parse(groupsData);
        // Ensure all groups have userId
        const groupsWithUser = parsedGroups.map((group: DocumentGroup) => ({
          ...group,
          userId: group.userId || userId
        }));
        setGroups(groupsWithUser);
        console.log(`Chargé ${groupsWithUser.length} groupes pour l'utilisateur ${userId}`);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données locales:", error);
    }
  }, []);
  
  // Charger les données locales au démarrage
  useEffect(() => {
    loadLocalData(currentUser);
    
    // Initial sync when component mounts
    if (isOnline) {
      setTimeout(() => {
        handleSyncDocuments().catch(console.error);
      }, 1000);
    }
  }, [currentUser, isOnline, loadLocalData]);
  
  // Sauvegarder les documents localement quand ils changent
  useEffect(() => {
    if (documents.length > 0) {
      // Make sure all documents have a userId
      const docsWithUser = documents.map(doc => ({
        ...doc,
        userId: doc.userId || currentUser
      }));
      
      // Mise à jour pour utiliser le nouveau nom de stockage avec l'ID utilisateur
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(docsWithUser));
      notifyChanges();
      console.log(`Sauvegardé ${docsWithUser.length} documents pour l'utilisateur ${currentUser}`);
      
      // Sync with server (debounced)
      if (isOnline) {
        const timer = setTimeout(() => {
          syncTable('collaboration', docsWithUser).catch(console.error);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [documents, notifyChanges, currentUser, syncTable, isOnline]);
  
  // Sauvegarder les groupes localement quand ils changent
  useEffect(() => {
    if (groups.length > 0) {
      // Make sure all groups have a userId
      const groupsWithUser = groups.map(group => ({
        ...group,
        userId: group.userId || currentUser
      }));
      
      // Mise à jour pour utiliser le nouveau nom de stockage avec l'ID utilisateur
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groupsWithUser));
      notifyChanges();
      console.log(`Sauvegardé ${groupsWithUser.length} groupes pour l'utilisateur ${currentUser}`);
      
      // Sync with server (debounced)
      if (isOnline) {
        const timer = setTimeout(() => {
          syncTable('collaboration_groups', groupsWithUser).catch(console.error);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [groups, notifyChanges, currentUser, syncTable, isOnline]);
  
  // Fonctions pour gérer les documents
  const handleAddDocument = useCallback((doc: Document) => {
    setDocuments((prevDocs) => [
      ...prevDocs,
      { ...doc, userId: currentUser }
    ]);
  }, [currentUser]);
  
  const handleUpdateDocument = useCallback((doc: Document) => {
    setDocuments((prevDocs) =>
      prevDocs.map((d) => (d.id === doc.id ? { ...doc, userId: doc.userId || currentUser } : d))
    );
  }, [currentUser]);
  
  const handleDeleteDocument = useCallback((id: string) => {
    setDocuments((prevDocs) => prevDocs.filter((d) => d.id !== id));
  }, []);

  // Fonctions pour gérer les documents - pour la compatibilité avec Collaboration.tsx
  const handleEditDocument = useCallback((doc: Document) => {
    setDocuments((prevDocs) =>
      prevDocs.map((d) => (d.id === doc.id ? { ...doc, userId: doc.userId || currentUser } : d))
    );
  }, [currentUser]);
  
  // Fonctions pour gérer les groupes
  const handleAddGroup = useCallback((group: DocumentGroup) => {
    setGroups((prevGroups) => [
      ...prevGroups, 
      { ...group, userId: currentUser }
    ]);
  }, [currentUser]);
  
  const handleUpdateGroup = useCallback((group: DocumentGroup) => {
    setGroups((prevGroups) =>
      prevGroups.map((g) => (g.id === group.id ? { ...group, userId: group.userId || currentUser } : g))
    );
  }, [currentUser]);
  
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
      prevGroups.map((g) => (g.id === group.id ? { ...group, userId: group.userId || currentUser } : g))
    );
  }, [currentUser]);

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
      console.log(`Documents à synchroniser pour l'utilisateur ${currentUser}:`, documents);
      console.log(`Groupes à synchroniser pour l'utilisateur ${currentUser}:`, groups);
      
      // Synchroniser les documents
      await syncTable('collaboration', documents.map(doc => ({
        ...doc,
        userId: doc.userId || currentUser
      })));
      
      // Synchroniser les groupes
      await syncTable('collaboration_groups', groups.map(group => ({
        ...group,
        userId: group.userId || currentUser
      })));
      
      // Forcer la synchronisation des groupes également
      const syncEvent = new CustomEvent('force-sync-required', {
        detail: {
          timestamp: Date.now(),
          tables: ['collaboration', 'collaboration_groups']
        }
      });
      window.dispatchEvent(syncEvent);
      
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
    syncFailed,
    currentUser
  };
};
