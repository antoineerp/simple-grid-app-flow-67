
import { useState, useEffect } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceSync } from './useExigenceSync';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';

export const useExigences = () => {
  // Extraire un identifiant utilisateur valide
  const extractValidUserId = (user: any): string => {
    if (typeof user === 'string') {
      return user;
    }
    
    if (user && typeof user === 'object') {
      return user.identifiant_technique || 
             user.email ||
             user.id || 
             'p71x6d_system';
    }
    
    return 'p71x6d_system';
  };

  // Extraire un identifiant string valide au lieu de l'objet complet
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
        const serverData = await loadFromServer(currentUser);
        if (serverData) {
          console.log(`Données chargées: exigences=${serverData.exigences?.length || 0}, groupes=${serverData.groups?.length || 0}`);
          // Fix: Set each state separately with the correct types
          setExigences(serverData.exigences || []);
          setGroups(serverData.groups || []);
          setLoadError(null);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des exigences:", error);
        setLoadError(error instanceof Error ? error.message : "Erreur de chargement");
        setLoadAttempts(prev => prev + 1);
        // Initialiser avec des tableaux vides pour éviter les erreurs
        setExigences([]);
        setGroups([]);
      }
    };

    if (currentUser) {
      loadExigences();
    }
  }, [currentUser, loadFromServer]);

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

  const handleEdit = (id: string) => {
    const exigenceToEdit = exigences.find(exigence => exigence.id === id);
    if (exigenceToEdit) {
      setEditingExigence(exigenceToEdit);
      setDialogOpen(true);
    }
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    setExigences(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId === 'null' ? undefined : targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const handleResetLoadAttempts = () => {
    setLoadError(null);
    setLoadAttempts(0);
    // Retenter le chargement
    if (currentUser) {
      loadFromServer(currentUser).then(serverData => {
        if (serverData) {
          setExigences(serverData.exigences || []);
          setGroups(serverData.groups || []);
        }
      }).catch(err => {
        console.error("Nouvelle tentative échouée:", err);
        setLoadError(err instanceof Error ? err.message : "Erreur de chargement");
      });
    }
  };

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
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleResetLoadAttempts,
    ...mutations,
    ...groupOperations,
    syncWithServer: () => syncWithServer(exigences, currentUser, groups)
  };
};
