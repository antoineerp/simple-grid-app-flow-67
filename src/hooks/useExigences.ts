
import { useState, useEffect, useCallback } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getDeviceId } from '@/services/core/userService';
import { useSyncContext } from './useSyncContext';

interface UseExigencesOptions {
  initialExigences?: Exigence[];
  initialStatus?: 'loading' | 'loaded' | 'error';
  forceLoad?: boolean;
  autoSync?: boolean;
}

export function useExigences(options: UseExigencesOptions = {}) {
  const [exigences, setExigences] = useState<Exigence[]>(options.initialExigences || []);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(options.initialStatus || 'loading');
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const { addExigence, updateExigence, deleteExigence } = useExigenceMutations();
  const { groups } = useExigenceGroups();
  const { toast } = useToast();
  const syncContext = useSyncContext();
  
  // Effet pour initialiser l'ID de l'appareil
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);
  
  // Vérification et initialisation du contexte de synchronisation
  useEffect(() => {
    if (!syncContext.isInitialized()) {
      console.log("useExigences: Le contexte de synchronisation n'est pas initialisé");
    } else {
      console.log("useExigences: Le contexte de synchronisation est initialisé");
    }
  }, [syncContext]);
  
  // Chargement initial des exigences avec vérification de l'API URL
  const loadExigences = useCallback(async (forceRefresh = false) => {
    if (status === 'loading' && !forceRefresh && exigences.length > 0) return;
    
    setStatus('loading');
    setError(null);
    
    try {
      const currentUser = getCurrentUser();
      const deviceId = getDeviceId();
      const API_URL = getApiUrl();
      
      // Vérifier que l'URL de l'API est configurée
      if (!API_URL) {
        throw new Error("URL de l'API non configurée");
      }
      
      console.log(`Chargement des exigences pour l'utilisateur: ${currentUser}`);
      
      const response = await fetch(`${API_URL}/exigences-load.php?userId=${currentUser}&deviceId=${deviceId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Device-ID': deviceId
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      if (!responseText.trim()) {
        console.warn('Réponse vide du serveur pour les exigences');
        setExigences([]);
        setStatus('loaded');
        return;
      }
      
      try {
        const data = JSON.parse(responseText);
        
        if (data.success === false) {
          throw new Error(data.message || 'Erreur lors du chargement des exigences');
        }
        
        // Vérifier le format des données reçues - priorité aux exigences dans la clé principale
        if (data.exigences && Array.isArray(data.exigences)) {
          console.log(`${data.exigences.length} exigences chargées depuis le serveur (format principal)`);
          setExigences(data.exigences);
          
          // Mise à jour du stockage local pour utilisation hors ligne
          const storageKey = `exigences_${currentUser || 'default'}`;
          localStorage.setItem(storageKey, JSON.stringify({
            timestamp: new Date().getTime(),
            data: data.exigences
          }));
          
        } else if (data.records && Array.isArray(data.records)) {
          console.log(`${data.records.length} exigences chargées depuis le serveur (format alternatif)`);
          setExigences(data.records);
          
          // Mise à jour du stockage local pour utilisation hors ligne
          const storageKey = `exigences_${currentUser || 'default'}`;
          localStorage.setItem(storageKey, JSON.stringify({
            timestamp: new Date().getTime(),
            data: data.records
          }));
        } else {
          console.log('Aucune exigence trouvée ou format de réponse incorrect');
          setExigences([]);
        }
        
        setStatus('loaded');
        setLastSynced(new Date());
        
      } catch (parseError) {
        console.error('Erreur lors de l\'analyse de la réponse JSON:', parseError);
        console.error('Réponse brute:', responseText);
        throw new Error('Format de réponse invalide');
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des exigences:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
      
      // Essayer de récupérer depuis le stockage local seulement si c'est une erreur réseau
      // et non une erreur de configuration
      if (err instanceof Error && !err.message.includes("API non configurée")) {
        try {
          const currentUser = getCurrentUser();
          const storageKey = `exigences_${currentUser || 'default'}`;
          const cachedData = localStorage.getItem(storageKey);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed.data && Array.isArray(parsed.data)) {
              console.log('Utilisation des données en cache pour les exigences');
              setExigences(parsed.data as Exigence[]);
            }
          }
        } catch (cacheError) {
          console.error('Erreur lors de la lecture du cache:', cacheError);
        }
      } else {
        // En cas d'erreur de configuration, s'assurer que les données locales ne sont pas utilisées
        console.log("Erreur de configuration - pas de récupération locale des données");
      }
      
      toast({
        title: "Erreur de chargement",
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: "destructive",
      });
    }
  }, [exigences.length, status, toast]);
  
  // Synchronisation manuelle
  const handleSync = useCallback(async () => {
    if (isSyncing) return false;
    
    setIsSyncing(true);
    setSyncFailed(false);
    
    try {
      // Vérifier que le contexte de synchronisation est initialisé
      if (!syncContext.isInitialized()) {
        console.error("Sync context not initialized");
        setSyncFailed(true);
        return false;
      }
      
      await loadExigences(true);
      setLastSynced(new Date());
      return true;
    } catch (error) {
      console.error("Échec de la synchronisation des exigences:", error);
      setSyncFailed(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, loadExigences, syncContext]);

  // Statistiques des exigences
  const getStats = useCallback((): ExigenceStats => {
    const stats: ExigenceStats = {
      exclusion: 0,
      nonConforme: 0,
      partiellementConforme: 0,
      conforme: 0,
      total: exigences.length
    };
    
    // Calculer les statistiques
    exigences.forEach(exigence => {
      if (exigence.exclusion) {
        stats.exclusion++;
      } else if (exigence.atteinte === 'NC') {
        stats.nonConforme++;
      } else if (exigence.atteinte === 'PC') {
        stats.partiellementConforme++;
      } else if (exigence.atteinte === 'C') {
        stats.conforme++;
      }
    });
    
    return stats;
  }, [exigences]);

  // Effet de chargement initial
  useEffect(() => {
    // Charger seulement si forceLoad est true ou si c'est undefined
    if (options.forceLoad !== false) {
      loadExigences();
    }
    
    // Synchronisation périodique si demandée
    let syncInterval: NodeJS.Timeout | null = null;
    if (options.autoSync !== false) {
      syncInterval = setInterval(() => {
        // Vérifier le contexte de synchronisation avant de synchroniser
        if (syncContext.isInitialized()) {
          handleSync();
        } else {
          console.log("Synchronisation périodique ignorée - contexte non initialisé");
        }
      }, 300000); // 5 minutes
    }
    
    return () => {
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [loadExigences, options.forceLoad, options.autoSync, handleSync, syncContext]);

  // État pour les dialog d'édition
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Écouter les changements de connectivité
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Les handlers standards pour manipuler les exigences
  const handleEdit = useCallback((exigence: Exigence) => {
    setEditingExigence(exigence);
    setDialogOpen(true);
  }, []);

  const handleAddExigence = useCallback(() => {
    setEditingExigence(null);
    setDialogOpen(true);
  }, []);

  const handleSaveExigence = useCallback((exigence: Exigence) => {
    if (editingExigence) {
      updateExigence(exigence);
    } else {
      addExigence(exigence);
    }
    setDialogOpen(false);
  }, [editingExigence, updateExigence, addExigence]);

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const handleSaveGroup = useCallback((group: ExigenceGroup) => {
    // Ici vous implémenteriez la logique pour sauvegarder le groupe
    setGroupDialogOpen(false);
  }, []);

  const handleDeleteGroup = useCallback((groupId: string) => {
    // Ici vous implémenteriez la logique pour supprimer un groupe
  }, []);

  const handleGroupReorder = useCallback((sourceIndex: number, destIndex: number) => {
    // Ici vous implémenteriez la logique pour réorganiser les groupes
  }, []);

  const handleToggleGroup = useCallback((groupId: string) => {
    // Ici vous implémenteriez la logique pour ouvrir/fermer un groupe
  }, []);

  const handleReorder = useCallback((sourceIndex: number, destIndex: number) => {
    // Ici vous implémenteriez la logique pour réorganiser les exigences
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteExigence(id);
  }, [deleteExigence]);

  const handleResponsabiliteChange = useCallback((id: string, newValue: string) => {
    // Ici vous implémenteriez la logique pour changer la responsabilité
  }, []);

  const handleAtteinteChange = useCallback((id: string, newValue: string) => {
    // Ici vous implémenteriez la logique pour changer l'atteinte
  }, []);

  const handleExclusionChange = useCallback((id: string, excluded: boolean) => {
    // Ici vous implémenteriez la logique pour changer l'exclusion
  }, []);

  // Exposer les données et méthodes nécessaires
  return {
    exigences,
    groups,
    stats: getStats(),
    status,
    error: error,
    loadError: error,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    deviceId,
    dialogOpen,
    groupDialogOpen,
    editingExigence,
    editingGroup,
    loadExigences,
    setDialogOpen,
    setGroupDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveExigence,
    handleDelete,
    handleAddExigence,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleToggleGroup,
    handleSync
  };
}

// Export des fonctions utilitaires
export function createExigence(data: Partial<Exigence>): Exigence {
  return {
    id: `exg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    numero: data.numero || '',
    description: data.description || '',
    indicateur: data.indicateur || '',
    niveau: data.niveau || 'standard',
    statut: data.statut || 'à traiter',
    proprietaire: data.proprietaire || '',
    userId: getCurrentUser() || '',
    date_creation: new Date().toISOString(),
    date_modification: new Date().toISOString(),
    ...data
  };
}

export function organizeExigencesIntoGroups(exigences: Exigence[], groups: ExigenceGroup[]): ExigenceGroup[] {
  if (!groups || groups.length === 0) return [];
  
  // Créer une copie des groupes pour éviter de modifier l'original
  const result = groups.map(group => ({
    ...group,
    items: []
  }));
  
  // Répartir les exigences dans les groupes appropriés
  exigences.forEach(exigence => {
    const groupIndex = result.findIndex(group => group.id === exigence.groupId);
    if (groupIndex >= 0) {
      result[groupIndex].items.push(exigence);
    } else {
      // Si l'exigence n'a pas de groupe assigné ou si le groupe n'existe plus, 
      // l'ajouter au premier groupe (par défaut)
      if (result.length > 0) {
        result[0].items.push(exigence);
      }
    }
  });
  
  return result;
}
