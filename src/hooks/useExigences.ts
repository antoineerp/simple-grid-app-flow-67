
import { useState, useEffect } from 'react';
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useExigenceMutations } from './useExigenceMutations';
import { useExigenceGroups } from './useExigenceGroups';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useSync } from './useSync';

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

  // Nouveau hook de synchronisation
  const { isSyncing, isOnline, lastSynced, syncFailed, syncAndProcess, resetSyncStatus } = useSync('exigences');
  
  const mutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

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

  // Updated to return Promise<void>
  const handleResetLoadAttempts = async (): Promise<void> => {
    setLoadError(null);
    setLoadAttempts(0);
    resetSyncStatus();
    return Promise.resolve();
  };

  const syncWithServer = async () => {
    try {
      return await syncAndProcess({
        tableName: 'exigences',
        data: exigences,
        groups: groups
      });
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Erreur inconnue' };
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
    syncFailed,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleResetLoadAttempts,
    ...mutations,
    ...groupOperations,
    syncWithServer
  };
};
