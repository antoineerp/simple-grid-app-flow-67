
import { useState, useEffect, useCallback } from 'react';
import { BibliothequeDocument, BibliothequeFolder, Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from "@/hooks/use-toast";
import { useSyncContext } from '@/context/SyncContext';
import { startEntitySync } from '@/services/sync';

// État initial de la bibliothèque
const initialState = {
  documents: [] as BibliothequeDocument[],
  folders: [] as BibliothequeFolder[],
  isLoading: true,
  searchTerm: '',
  currentFolder: null as BibliothequeFolder | null,
  breadcrumbs: [] as BibliothequeFolder[],
  groups: [] as DocumentGroup[],
  isSyncing: false,
  syncFailed: false,
  lastSynced: null as Date | null,
  isOnline: true,
  currentUser: localStorage.getItem('userId') || "1",
};

/**
 * Hook pour la gestion de la bibliothèque de documents
 */
export const useBibliotheque = () => {
  const [state, setState] = useState(initialState);
  const { toast } = useToast();
  const { syncStatus, startSync, endSync } = useSyncContext();

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulation de chargement de données depuis une API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Données fictives
        const mockDocuments: BibliothequeDocument[] = [
          { 
            id: '1', 
            name: 'Rapport annuel.pdf', 
            titre: 'Rapport annuel', 
            type: 'pdf', 
            size: 1250000, 
            createdAt: new Date('2023-01-15'), 
            updatedAt: new Date('2023-01-15'), 
            folderId: '1', 
            tags: ['rapport', 'annuel'],
            date_creation: '2023-01-15',
            date_modification: '2023-01-15'
          },
          { 
            id: '2', 
            name: 'Procédure qualité.docx', 
            titre: 'Procédure qualité', 
            type: 'docx', 
            size: 450000, 
            createdAt: new Date('2023-02-20'), 
            updatedAt: new Date('2023-03-10'), 
            folderId: '1', 
            tags: ['procédure', 'qualité'],
            date_creation: '2023-02-20',
            date_modification: '2023-03-10'
          },
          { 
            id: '3', 
            name: 'Plan stratégique.pptx', 
            titre: 'Plan stratégique', 
            type: 'pptx', 
            size: 2800000, 
            createdAt: new Date('2023-03-05'), 
            updatedAt: new Date('2023-03-05'), 
            folderId: '2', 
            tags: ['plan', 'stratégie'],
            date_creation: '2023-03-05',
            date_modification: '2023-03-05'
          },
          { 
            id: '4', 
            name: 'Budget prévisionnel.xlsx', 
            titre: 'Budget prévisionnel', 
            type: 'xlsx', 
            size: 850000, 
            createdAt: new Date('2023-02-28'), 
            updatedAt: new Date('2023-04-10'), 
            folderId: null, 
            tags: ['budget', 'finance'],
            date_creation: '2023-02-28',
            date_modification: '2023-04-10'
          },
        ];
        
        const mockFolders: BibliothequeFolder[] = [
          { id: '1', name: 'Rapports', parentId: null },
          { id: '2', name: 'Plans stratégiques', parentId: null },
          { id: '3', name: 'Archives', parentId: '1' },
        ];
        
        const mockGroups: DocumentGroup[] = [
          { id: '1', name: 'Documents organisationnels', expanded: false, items: [], userId: initialState.currentUser },
          { id: '2', name: 'Documents administratifs', expanded: false, items: [], userId: initialState.currentUser },
        ];
        
        setState(prev => ({
          ...prev,
          documents: mockDocuments,
          folders: mockFolders,
          groups: mockGroups,
          isLoading: false
        }));
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les documents.",
          variant: "destructive",
        });
        setState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };
    
    loadData();
  }, [toast]);

  // Synchroniser avec le serveur
  const synchronize = useCallback(async () => {
    if (state.isSyncing) return;
    
    try {
      // Indiquer que la synchronisation commence
      setState(prev => ({ ...prev, isSyncing: true }));
      startSync('bibliotheque');
      
      // Appel à l'API de synchronisation
      const success = await startEntitySync('bibliotheque');
      
      // Mettre à jour le statut de synchronisation
      endSync('bibliotheque', success);
      
      if (success) {
        toast({
          title: "Synchronisation réussie",
          description: "Les documents ont été synchronisés avec succès.",
        });
        
        setState(prev => ({
          ...prev,
          isSyncing: false,
          syncFailed: false,
          lastSynced: new Date()
        }));
        
        // Recharger les données après synchronisation
        setState(prev => ({
          ...prev,
          isLoading: true
        }));
        
        // Simulation de chargement de données depuis une API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      endSync('bibliotheque', false, "Erreur de connexion au serveur");
      toast({
        title: "Échec de la synchronisation",
        description: "Impossible de synchroniser les documents.",
        variant: "destructive",
      });
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncFailed: true
      }));
    }
  }, [state.isSyncing, startSync, endSync, toast]);

  // Synchroniser avec le serveur (version pour Collaboration)
  const syncWithServer = useCallback(async (documents: Document[] = [], groups: DocumentGroup[] = []) => {
    // Utilise la même logique que synchronize
    return synchronize();
  }, [synchronize]);

  // Rechercher des documents
  const searchDocuments = useCallback((searchTerm: string) => {
    setState(prev => ({
      ...prev,
      searchTerm
    }));
  }, []);

  // Filtrer les documents selon le terme de recherche et le dossier actuel
  const filteredDocuments = useCallback(() => {
    return state.documents.filter(doc => {
      // Filtrer par terme de recherche
      const matchesSearch = state.searchTerm === '' || 
        doc.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(state.searchTerm.toLowerCase()));
      
      // Filtrer par dossier actuel
      const matchesFolder = state.currentFolder === null 
        ? doc.folderId === null 
        : doc.folderId === state.currentFolder.id;
      
      return matchesSearch && matchesFolder;
    });
  }, [state.documents, state.searchTerm, state.currentFolder]);

  // Récupérer les sous-dossiers du dossier actuel
  const currentSubFolders = useCallback(() => {
    const parentId = state.currentFolder ? state.currentFolder.id : null;
    return state.folders.filter(folder => folder.parentId === parentId);
  }, [state.folders, state.currentFolder]);

  // Naviguer vers un dossier
  const navigateToFolder = useCallback((folder: BibliothequeFolder | null) => {
    if (!folder) {
      // Retour à la racine
      setState(prev => ({
        ...prev,
        currentFolder: null,
        breadcrumbs: []
      }));
      return;
    }
    
    // Construire le fil d'Ariane
    const breadcrumbs: BibliothequeFolder[] = [folder];
    let parentId = folder.parentId;
    
    while (parentId) {
      const parentFolder = state.folders.find(f => f.id === parentId);
      if (parentFolder) {
        breadcrumbs.unshift(parentFolder);
        parentId = parentFolder.parentId;
      } else {
        break;
      }
    }
    
    setState(prev => ({
      ...prev,
      currentFolder: folder,
      breadcrumbs
    }));
  }, [state.folders]);

  // Ajouter un document
  const addDocument = useCallback(async (document: Omit<BibliothequeDocument, 'id'>) => {
    try {
      // Simulation d'ajout à l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date();
      
      const newDocument: BibliothequeDocument = {
        ...document,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: now,
        updatedAt: now,
        date_creation: now.toISOString().split('T')[0],
        date_modification: now.toISOString().split('T')[0],
        folderId: state.currentFolder?.id || null,
      };
      
      setState(prev => ({
        ...prev,
        documents: [...prev.documents, newDocument]
      }));
      
      toast({
        title: "Document ajouté",
        description: `${document.name} a été ajouté avec succès.`,
      });
      
      // Synchronisation après l'ajout
      startSync('bibliotheque');
      const success = await startEntitySync('bibliotheque');
      endSync('bibliotheque', success);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajout du document:", error);
      toast({
        title: "Échec de l'ajout",
        description: "Impossible d'ajouter le document.",
        variant: "destructive",
      });
      return false;
    }
  }, [state.currentFolder, toast, startSync, endSync]);

  // Supprimer un document
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      // Simulation de suppression via API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== documentId)
      }));
      
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès.",
      });
      
      // Synchronisation après la suppression
      startSync('bibliotheque');
      const success = await startEntitySync('bibliotheque');
      endSync('bibliotheque', success);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du document:", error);
      toast({
        title: "Échec de la suppression",
        description: "Impossible de supprimer le document.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, startSync, endSync]);

  // Créer un nouveau dossier
  const createFolder = useCallback(async (name: string) => {
    try {
      // Simulation de création via API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newFolder: BibliothequeFolder = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        parentId: state.currentFolder?.id || null
      };
      
      setState(prev => ({
        ...prev,
        folders: [...prev.folders, newFolder]
      }));
      
      toast({
        title: "Dossier créé",
        description: `Le dossier ${name} a été créé avec succès.`,
      });
      
      // Synchronisation après la création
      startSync('bibliotheque');
      const success = await startEntitySync('bibliotheque');
      endSync('bibliotheque', success);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la création du dossier:", error);
      toast({
        title: "Échec de la création",
        description: "Impossible de créer le dossier.",
        variant: "destructive",
      });
      return false;
    }
  }, [state.currentFolder, toast, startSync, endSync]);

  // Méthodes pour la compatibilité avec Collaboration.tsx
  const handleToggleGroup = useCallback((groupId: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(group => 
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    }));
  }, []);

  const handleEditDocument = useCallback((document: Document) => {
    const index = state.documents.findIndex(doc => doc.id === document.id);
    if (index !== -1) {
      setState(prev => {
        const updatedDocs = [...prev.documents];
        updatedDocs[index] = { ...prev.documents[index], ...document };
        return { ...prev, documents: updatedDocs };
      });
    }
    return true;
  }, [state.documents]);

  const handleDeleteDocument = useCallback((documentId: string) => {
    return deleteDocument(documentId);
  }, [deleteDocument]);

  const handleEditGroup = useCallback((group: DocumentGroup) => {
    const index = state.groups.findIndex(g => g.id === group.id);
    if (index !== -1) {
      setState(prev => {
        const updatedGroups = [...prev.groups];
        updatedGroups[index] = { ...group };
        return { ...prev, groups: updatedGroups };
      });
    }
    return true;
  }, [state.groups]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.filter(group => group.id !== groupId)
    }));
    return true;
  }, []);

  const handleAddGroup = useCallback((group: DocumentGroup) => {
    setState(prev => ({
      ...prev,
      groups: [...prev.groups, group]
    }));
    return true;
  }, []);

  const handleAddDocument = useCallback((document: Document) => {
    // Si le document a un groupId, l'ajouter aux items du groupe
    if (document.groupId) {
      setState(prev => ({
        ...prev,
        groups: prev.groups.map(group => 
          group.id === document.groupId 
            ? { ...group, items: [...group.items, document] } 
            : group
        )
      }));
    } else {
      // Sinon l'ajouter directement à la liste des documents
      const now = new Date();
      const bibiDocument: BibliothequeDocument = {
        id: document.id,
        name: document.name,
        link: document.link,
        groupe_id: document.groupId,
        userId: document.userId,
        date_creation: document.date_creation ? 
          (typeof document.date_creation === 'string' ? document.date_creation : document.date_creation.toISOString().split('T')[0]) : 
          now.toISOString().split('T')[0],
        date_modification: document.date_modification ? 
          (typeof document.date_modification === 'string' ? document.date_modification : document.date_modification.toISOString().split('T')[0]) : 
          now.toISOString().split('T')[0]
      };
      
      setState(prev => ({
        ...prev,
        documents: [...prev.documents, bibiDocument]
      }));
    }
    return true;
  }, []);

  return {
    ...state,
    filteredDocuments: filteredDocuments(),
    currentSubFolders: currentSubFolders(),
    searchDocuments,
    navigateToFolder,
    synchronize,
    syncWithServer,
    addDocument,
    deleteDocument,
    createFolder,
    handleToggleGroup,
    handleEditDocument,
    handleDeleteDocument,
    handleEditGroup,
    handleDeleteGroup,
    handleAddGroup,
    handleAddDocument
  };
};
