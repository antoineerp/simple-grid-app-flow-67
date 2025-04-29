
import { useState, useCallback, useEffect } from 'react';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { useExigenceMutations } from '@/hooks/useExigenceMutations';
import { useExigenceGroups } from '@/hooks/useExigenceGroups';
import { useExigenceStats } from '@/hooks/exigences/useExigenceStats';
import { useExigenceSync } from '@/hooks/exigences/useExigenceSync';
import { useExigenceEditing } from '@/hooks/exigences/useExigenceEditing';
import { useExigenceDragDrop } from '@/hooks/exigences/useExigenceDragDrop';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

export const useExigences = () => {
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);
  const { toast } = useToast();
  
  // Import functionality from smaller hooks
  const stats = useExigenceStats(exigences);
  const exigenceMutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);
  const syncOperations = useExigenceSync();
  const editingOperations = useExigenceEditing();
  const dragDropOperations = useExigenceDragDrop();

  // Load exigences from server when component mounts
  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        try {
          const loadedData = await syncOperations.loadFromServer();
          if (loadedData && loadedData.exigences && loadedData.exigences.length > 0) {
            setExigences(loadedData.exigences);
            if (loadedData.groups && loadedData.groups.length > 0) {
              setGroups(loadedData.groups);
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement des exigences:", error);
        }
      }
    };
    
    loadData();
  }, [toast]);

  // Handle exigence save
  const handleSaveExigence = useCallback((exigence: Exigence) => {
    const isNew = !exigences.some(e => e.id === exigence.id);

    if (isNew) {
      exigenceMutations.handleAddExigence(exigence);
    } else {
      exigenceMutations.handleSaveExigence(exigence);
    }

    editingOperations.setDialogOpen(false);
    
    // Sync with server after saving
    syncOperations.syncWithServer(exigences, groups);
  }, [exigences, groups, exigenceMutations, syncOperations, editingOperations]);

  // Sync with server
  const syncWithServer = useCallback(async () => {
    return await syncOperations.syncWithServer(exigences, groups);
  }, [exigences, groups, syncOperations]);

  // Combine operations from all hooks for export
  return {
    exigences,
    groups,
    stats,
    isSyncing: syncOperations.isSyncing,
    lastSynced: syncOperations.lastSynced,
    handleSaveExigence,
    handleDelete: exigenceMutations.handleDelete,
    syncWithServer,
    ...editingOperations,
    ...exigenceMutations,
    ...dragDropOperations,
    ...groupOperations
  };
};
