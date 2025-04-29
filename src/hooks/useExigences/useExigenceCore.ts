
import { useState, useCallback } from 'react';
import { Exigence, ExigenceGroup, ExigenceStats } from '@/types/exigences';
import { getCurrentUser } from '@/services/auth/authService';

export const useExigenceCore = () => {
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [lastSyncedDate, setLastSyncedDate] = useState<Date | null>(null);

  // Récupération de l'utilisateur courant
  const user = getCurrentUser();
  const userId = typeof user === 'object' 
    ? (user?.email || user?.identifiant_technique || 'p71x6d_system') 
    : user || 'p71x6d_system';

  // Calcul des statistiques
  const calculateStats = useCallback((): ExigenceStats => {
    return {
      total: exigences.length,
      conforme: exigences.filter(e => e.atteinte === 'C').length,
      partiellementConforme: exigences.filter(e => e.atteinte === 'PC').length,
      nonConforme: exigences.filter(e => e.atteinte === 'NC').length,
      exclusion: exigences.filter(e => e.exclusion).length
    };
  }, [exigences]);

  return {
    exigences,
    setExigences,
    groups,
    setGroups,
    selectedNiveau,
    setSelectedNiveau,
    editingExigence,
    setEditingExigence,
    editingGroup,
    setEditingGroup,
    dialogOpen,
    setDialogOpen,
    groupDialogOpen,
    setGroupDialogOpen,
    lastSyncedDate,
    setLastSyncedDate,
    userId,
    stats: calculateStats()
  };
};
