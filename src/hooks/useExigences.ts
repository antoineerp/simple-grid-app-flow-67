import { useState, useEffect } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceSync } from './useExigenceSync';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';

export const useExigences = () => {
  const currentUser = getCurrentUser() || 'p71x6d_system';
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

  const { syncWithServer, loadFromServer, isSyncing, isOnline, lastSynced } = useExigenceSync();
  const mutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  // Initial load from server
  useEffect(() => {
    const loadExigences = async () => {
      try {
        console.log(`Chargement des exigences pour l'utilisateur ${currentUser}`);
        const serverData = await loadFromServer(currentUser);
        if (serverData) {
          console.log(`Données chargées: exigences=${serverData.exigences?.length || 0}, groupes=${serverData.groups?.length || 0}`);
          // Fix: Set each state separately with the correct types
          setExigences(serverData.exigences || []);
          setGroups(serverData.groups || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des exigences:", error);
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
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    ...mutations,
    ...groupOperations,
    syncWithServer: () => syncWithServer(exigences, currentUser, groups)
  };
};
