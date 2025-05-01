
import { useState, useEffect } from 'react';
import { Exigence, ExigenceGroup, ExigenceStats } from '@/types/exigences';
import { getCurrentUserId } from '@/utils/userUtils';

export const useExigenceState = (tableName = 'exigences') => {
  const currentUser = getCurrentUserId();
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
  const [dataChanged, setDataChanged] = useState(false);

  // Load data from local storage on initial render
  useEffect(() => {
    const loadLocalData = () => {
      try {
        const storedExigences = localStorage.getItem(`${tableName}_${currentUser}`);
        const storedGroups = localStorage.getItem(`${tableName}_groups_${currentUser}`);
        
        if (storedExigences) {
          const parsedExigences = JSON.parse(storedExigences);
          setExigences(parsedExigences);
          console.log(`Loaded ${parsedExigences.length} exigences from local storage`);
        }
        
        if (storedGroups) {
          const parsedGroups = JSON.parse(storedGroups);
          setGroups(parsedGroups);
          console.log(`Loaded ${parsedGroups.length} groups from local storage`);
        }
      } catch (error) {
        console.error("Error loading data from local storage:", error);
        setLoadError("Erreur lors du chargement des données locales");
      }
    };
    
    loadLocalData();
  }, [currentUser, tableName]);

  // Save exigences to local storage when they change
  useEffect(() => {
    if (exigences.length > 0) {
      localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(exigences));
      setDataChanged(true);
    }
  }, [exigences, currentUser, tableName]);
  
  // Save groups to local storage when they change
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem(`${tableName}_groups_${currentUser}`, JSON.stringify(groups));
      setDataChanged(true);
    }
  }, [groups, currentUser, tableName]);

  // Calculate statistics whenever exigences change
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

  const handleResetLoadAttempts = async (): Promise<void> => {
    setLoadError(null);
    setLoadAttempts(0);
    return Promise.resolve();
  };

  return {
    exigences,
    setExigences,
    groups,
    setGroups,
    stats,
    editingExigence,
    setEditingExigence,
    editingGroup,
    setEditingGroup,
    dialogOpen,
    setDialogOpen,
    groupDialogOpen,
    setGroupDialogOpen,
    loadError,
    setLoadError,
    loadAttempts,
    setLoadAttempts,
    dataChanged,
    setDataChanged,
    currentUser,
    tableName,
    handleResetLoadAttempts
  };
};
