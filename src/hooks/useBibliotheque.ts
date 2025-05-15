
import { useState, useEffect, useCallback } from 'react';
import { BibliothequeDocument, BibliothequeFolder } from '@/types/bibliotheque';
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
          { id: '1', name: 'Rapport annuel.pdf', type: 'pdf', size: 1250000, createdAt: new Date('2023-01-15'), updatedAt: new Date('2023-01-15'), folderId: '1', tags: ['rapport', 'annuel'] },
          { id: '2', name: 'Procédure qualité.docx', type: 'docx', size: 450000, createdAt: new Date('2023-02-20'), updatedAt: new Date('2023-03-10'), folderId: '1', tags: ['procédure', 'qualité'] },
          { id: '3', name: 'Plan stratégique.pptx', type: 'pptx', size: 2800000, createdAt: new Date('2023-03-05'), updatedAt: new Date('2023-03-05'), folderId: '2', tags: ['plan', 'stratégie'] },
          { id: '4', name: 'Budget prévisionnel.xlsx', type: 'xlsx', size: 850000, createdAt: new Date('2023-02-28'), updatedAt: new Date('2023-04-10'), folderId: null, tags: ['budget', 'finance'] },
        ];
        
        const mockFolders: BibliothequeFolder[] = [
          { id: '1', name: 'Rapports', parentId: null },
          { id: '2', name: 'Plans stratégiques', parentId: null },
          { id: '3', name: 'Archives', parentId: '1' },
        ];
        
        setState(prev => ({
          ...prev,
          documents: mockDocuments,
          folders: mockFolders,
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
    if (syncStatus.isSyncing) return;
    
    try {
      // Indiquer que la synchronisation commence
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
        
        // Recharger les données
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
    }
  }, [syncStatus.isSyncing, startSync, endSync, toast]);

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
      
      const newDocument: BibliothequeDocument = {
        ...document,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
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

  return {
    ...state,
    filteredDocuments: filteredDocuments(),
    currentSubFolders: currentSubFolders(),
    searchDocuments,
    navigateToFolder,
    synchronize,
    addDocument,
    deleteDocument,
    createFolder
  };
};
