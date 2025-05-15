import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSyncContext } from '@/features/sync/hooks/useSyncContext';
import { SyncService } from '@/services/sync/SyncService'; // Corrigé la casse pour correspondre au fichier réel
import { DatabaseHelper } from '@/services/sync/DatabaseHelper';
import { useMembresContext } from '@/contexts/MembresContext';
import { BibliothequeDocument, BibliothequeGroup } from '@/types/bibliotheque';

// Types pour les états de synchronisation
interface SyncState {
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;
}

// Interface pour les mutations de la bibliothèque
interface BibliothequeOperations {
  createGroup: (group: Partial<BibliothequeGroup>) => Promise<BibliothequeGroup>;
  updateGroup: (group: BibliothequeGroup) => Promise<BibliothequeGroup>;
  deleteGroup: (groupId: string) => Promise<void>;
  createDocument: (document: Partial<BibliothequeDocument>) => Promise<BibliothequeDocument>;
  updateDocument: (document: BibliothequeDocument) => Promise<BibliothequeDocument>;
  deleteDocument: (documentId: string) => Promise<void>;
}

export const useBibliothequeSync = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    isSyncing: false,
    lastSynced: null,
    error: null
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [groups, setGroups] = useState<BibliothequeGroup[]>([]);
  const [documents, setDocuments] = useState<BibliothequeDocument[]>([]);
  const { syncContext, isSyncEnabled } = useSyncContext();
  const { addMembres } = useMembresContext();

  const TABLE_NAME = 'bibliotheque';
  const syncService = new SyncService(syncContext);
  const dbHelper = new DatabaseHelper(syncContext);

  // Fonction pour charger les données
  const fetchData = async () => {
    setSyncState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Remplaçons loadDataFromServer par les appels appropriés
      await syncService.syncTable(TABLE_NAME);
      
      // Récupérer les groupes et documents de la base de données
      const fetchedGroups = await dbHelper.getAll<BibliothequeGroup>(`${TABLE_NAME}_groups`);
      const fetchedDocuments = await dbHelper.getAll<BibliothequeDocument>(`${TABLE_NAME}_documents`);
      
      // Mettre à jour l'état
      setGroups(fetchedGroups);
      setDocuments(fetchedDocuments);
      
      // Au lieu de getLastSynced, nous allons utiliser la date actuelle
      const now = new Date().toISOString();
      setSyncState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastSynced: now 
      }));
      
      setIsInitialized(true);
      return { groups: fetchedGroups, documents: fetchedDocuments };
    } catch (error) {
      console.error('Erreur lors du chargement des données de la bibliothèque:', error);
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
      return { groups: [], documents: [] };
    }
  };

  // Mutation pour synchroniser les données
  const syncMutation = useMutation({
    mutationFn: fetchData,
    onSuccess: () => {
      console.log('Données de la bibliothèque synchronisées avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la synchronisation des données de la bibliothèque:', error);
    }
  });

  // Initialiser les données au chargement du composant
  useEffect(() => {
    if (!isInitialized && isSyncEnabled) {
      fetchData();
    }
  }, [isInitialized, isSyncEnabled]);

  // Fonction pour forcer une synchronisation
  const forceSync = async () => {
    if (syncMutation.isPending) return;
    
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    try {
      await syncMutation.mutateAsync();
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    } catch (error) {
      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    }
  };

  // Opérations CRUD
  const operations: BibliothequeOperations = {
    createGroup: async (group) => {
      try {
        const newGroup = await dbHelper.add<BibliothequeGroup>(`${TABLE_NAME}_groups`, { ...group, id: crypto.randomUUID() } as BibliothequeGroup);
        setGroups(prev => [...prev, newGroup]);
        return newGroup;
      } catch (error) {
        console.error('Erreur lors de la création du groupe:', error);
        throw error;
      }
    },
    updateGroup: async (group) => {
      try {
        const updatedGroup = await dbHelper.update<BibliothequeGroup>(`${TABLE_NAME}_groups`, group);
        setGroups(prev => prev.map(g => g.id === group.id ? group : g));
        return updatedGroup;
      } catch (error) {
        console.error('Erreur lors de la mise à jour du groupe:', error);
        throw error;
      }
    },
    deleteGroup: async (groupId) => {
      try {
        await dbHelper.remove<BibliothequeGroup>(`${TABLE_NAME}_groups`, groupId);
        setGroups(prev => prev.filter(g => g.id !== groupId));
      } catch (error) {
        console.error('Erreur lors de la suppression du groupe:', error);
        throw error;
      }
    },
    createDocument: async (document) => {
      try {
        const newDocument = await dbHelper.add<BibliothequeDocument>(`${TABLE_NAME}_documents`, { ...document, id: crypto.randomUUID() } as BibliothequeDocument);
        setDocuments(prev => [...prev, newDocument]);
        return newDocument;
      } catch (error) {
        console.error('Erreur lors de la création du document:', error);
        throw error;
      }
    },
    updateDocument: async (document) => {
      try {
        const updatedDocument = await dbHelper.update<BibliothequeDocument>(`${TABLE_NAME}_documents`, document);
        setDocuments(prev => prev.map(d => d.id === document.id ? document : d));
        return updatedDocument;
      } catch (error) {
        console.error('Erreur lors de la mise à jour du document:', error);
        throw error;
      }
    },
    deleteDocument: async (documentId) => {
      try {
        await dbHelper.remove<BibliothequeDocument>(`${TABLE_NAME}_documents`, documentId);
        setDocuments(prev => prev.filter(d => d.id !== documentId));
      } catch (error) {
        console.error('Erreur lors de la suppression du document:', error);
        throw error;
      }
    }
  };

  // État de synchronisation pour l'interface utilisateur
  const syncInfo = {
    isLoading: syncState.isLoading || syncMutation.isPending,
    isSyncing: syncState.isSyncing,
    // Au lieu de getLastSynced, nous utilisons l'état local lastSynced
    lastSynced: syncState.lastSynced,
    error: syncState.error || syncMutation.error,
    forceSync
  };

  return {
    groups,
    documents,
    syncInfo,
    operations,
    isInitialized
  };
};
