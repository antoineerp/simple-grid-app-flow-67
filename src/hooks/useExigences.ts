
import { useState, useEffect, useCallback } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceSync } from './useExigenceSync';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

export const useExigences = () => {
  const { toast } = useToast();
  
  // Extraire un identifiant utilisateur valide
  const extractValidUserId = (user: any): string => {
    if (!user) {
      console.warn("Aucun utilisateur fourni, utilisation de l'ID système");
      return 'p71x6d_system';
    }
    
    // Si c'est déjà une chaîne, la retourner directement
    if (typeof user === 'string') {
      return user;
    }
    
    // Si c'est un objet, extraire un identifiant
    if (typeof user === 'object') {
      // Vérifier si l'objet n'est pas null
      if (user === null) {
        console.warn("Objet utilisateur null, utilisation de l'ID système");
        return 'p71x6d_system';
      }
      
      // Identifiants potentiels par ordre de priorité
      const possibleIds = ['identifiant_technique', 'email', 'id'];
      
      for (const idField of possibleIds) {
        if (user[idField] && typeof user[idField] === 'string') {
          console.log(`ID utilisateur extrait: ${idField} = ${user[idField]}`);
          return user[idField];
        }
      }
      
      console.warn("Aucun identifiant valide trouvé dans l'objet utilisateur:", user);
    }
    
    console.warn("Type d'utilisateur non pris en charge, utilisation de l'ID système");
    return 'p71x6d_system';
  };

  // Récupérer l'utilisateur et extraire un ID valide
  const user = getCurrentUser();
  const currentUser = extractValidUserId(user);
  console.log("ID utilisateur extrait pour les exigences:", currentUser);
  
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [stats, setStats] = useState<ExigenceStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  const { syncWithServer, loadFromServer, isSyncing, isOnline, lastSynced } = useExigenceSync();
  const mutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  // Initial load from server
  useEffect(() => {
    const loadExigences = async () => {
      if (loadAttempts > 3) {
        console.warn("Trop de tentatives de chargement échouées, abandon");
        setLoadError("Trop de tentatives de chargement échouées");
        return;
      }
      
      try {
        console.log(`Chargement des exigences pour l'utilisateur ${currentUser}`);
        if (typeof currentUser !== 'string') {
          throw new Error(`ID utilisateur invalide: ${typeof currentUser}`);
        }
        
        const serverData = await loadFromServer(currentUser);
        if (serverData) {
          console.log(`Données chargées: exigences=${serverData.exigences?.length || 0}, groupes=${serverData.groups?.length || 0}`);
          // Fix: Set each state separately with the correct types
          setExigences(serverData.exigences || []);
          setGroups(serverData.groups || []);
          setLoadError(null);
          
          // Notify user of successful load
          toast({
            title: "Chargement réussi",
            description: `${serverData.exigences?.length || 0} exigences chargées`,
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des exigences:", error);
        setLoadError(error instanceof Error ? error.message : "Erreur de chargement");
        setLoadAttempts(prev => prev + 1);
        
        toast({
          title: "Erreur de chargement",
          description: error instanceof Error ? 
            `${error.message}. Vérifiez la console pour plus de détails.` : 
            "Une erreur s'est produite lors du chargement des exigences",
          variant: "destructive"
        });
        
        // Initialiser avec des tableaux vides pour éviter les erreurs
        setExigences([]);
        setGroups([]);
      }
    };

    if (currentUser) {
      loadExigences();
    }
  }, [currentUser, loadFromServer, loadAttempts, toast]);

  // Stats calculation
  useEffect(() => {
    const exclusionCount = exigences.filter(e => e.exclusion).length;
    const nonExcludedExigences = exigences.filter(e => !e.exclusion);
    
    const newStats = {
      exclusion: exclusionCount,
      nonConforme: nonExcludedExigences.filter(e => e.atteinte === 'NC').length,
      partiellementConforme: nonExcludedExigences.filter(e => e.atteinte === 'PC').length,
      conforme: nonExcludedExigences.filter(e => e.atteinte === 'C').length,
      total: nonExcludedExigences.length
    };
    setStats(newStats);
  }, [exigences]);

  const handleEdit = useCallback((id: string) => {
    const exigenceToEdit = exigences.find(exigence => exigence.id === id);
    if (exigenceToEdit) {
      setEditingExigence(exigenceToEdit);
      setDialogOpen(true);
    }
  }, [exigences]);

  const handleAddExigence = useCallback(() => {
    setEditingExigence({
      id: crypto.randomUUID(),
      nom: '',
      responsabilites: { r: [], a: [], c: [], i: [] },
      exclusion: false,
      atteinte: null,
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString()
    });
    setDialogOpen(true);
  }, []);

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    setExigences(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId === 'null' ? undefined : targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const handleSaveExigence = useCallback(async (exigence: Exigence) => {
    const isNew = !exigences.some(e => e.id === exigence.id);
    
    if (isNew) {
      mutations.handleAddExigence(exigence);
    } else {
      mutations.handleEditExigence(exigence);
    }
    
    setDialogOpen(false);
    
    // Sync with server after adding/updating
    try {
      console.log("Synchronisation après sauvegarde d'une exigence");
      await syncWithServer([...exigences, exigence], currentUser, groups);
    } catch (error) {
      console.error("Erreur lors de la synchronisation après sauvegarde:", error);
    }
  }, [exigences, groups, mutations, syncWithServer, currentUser]);

  const handleResetLoadAttempts = useCallback(() => {
    setLoadError(null);
    setLoadAttempts(0);
    // Retenter le chargement
    if (currentUser) {
      loadFromServer(currentUser).then(serverData => {
        if (serverData) {
          setExigences(serverData.exigences || []);
          setGroups(serverData.groups || []);
          
          toast({
            title: "Chargement réussi",
            description: `${serverData.exigences?.length || 0} exigences chargées`,
          });
        }
      }).catch(err => {
        console.error("Nouvelle tentative échouée:", err);
        setLoadError(err instanceof Error ? err.message : "Erreur de chargement");
        
        toast({
          title: "Erreur de chargement",
          description: err instanceof Error ? err.message : "Une erreur s'est produite",
          variant: "destructive"
        });
      });
    }
  }, [currentUser, loadFromServer, toast]);

  return {
    exigences,
    groups,
    stats,
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    isOnline,
    lastSynced,
    loadError,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleSaveExigence,
    handleAddExigence,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleResetLoadAttempts,
    ...mutations,
    ...groupOperations,
    syncWithServer: async () => {
      const success = await syncWithServer(exigences, currentUser, groups);
      // Reload data after successful sync
      if (success) {
        const serverData = await loadFromServer(currentUser);
        if (serverData) {
          setExigences(serverData.exigences || []);
          setGroups(serverData.groups || []);
        }
      }
      return success;
    }
  };
};
