import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Exigence, ExigenceStats, ExigenceGroup } from '@/types/exigences';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useGlobalSync } from '@/hooks/useGlobalSync';

export const useExigences = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { isSyncing, lastSynced, syncWithServer, appData, saveData } = useGlobalSync();
  const currentUser = localStorage.getItem('currentUser') || 'default';
  
  const [exigences, setExigences] = useState<Exigence[]>(() => {
    // Tenter de charger depuis les données globales d'abord
    if (appData.exigences && appData.exigences.length > 0) {
      return appData.exigences;
    }
    
    // Sinon, charger depuis le stockage local
    const storedExigences = localStorage.getItem(`exigences_${currentUser}`);
    
    if (storedExigences) {
      return JSON.parse(storedExigences);
    } else {
      const defaultExigences = localStorage.getItem('exigences_template') || localStorage.getItem('exigences');
      
      if (defaultExigences) {
        return JSON.parse(defaultExigences);
      }
      
      return [
        { 
          id: '1', 
          nom: 'Levée du courrier', 
          responsabilites: { r: [], a: [], c: [], i: [] },
          exclusion: false,
          atteinte: null,
          date_creation: new Date(),
          date_modification: new Date()
        },
        { 
          id: '2', 
          nom: 'Ouverture du courrier', 
          responsabilites: { r: [], a: [], c: [], i: [] },
          exclusion: false,
          atteinte: null,
          date_creation: new Date(),
          date_modification: new Date()
        },
      ];
    }
  });

  const [groups, setGroups] = useState<ExigenceGroup[]>(() => {
    const storedGroups = localStorage.getItem(`exigence_groups_${currentUser}`);
    return storedGroups ? JSON.parse(storedGroups) : [];
  });

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

  const notifyExigenceUpdate = () => {
    window.dispatchEvent(new Event('exigenceUpdate'));
  };

  useEffect(() => {
    localStorage.setItem(`exigences_${currentUser}`, JSON.stringify(exigences));
    
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin' || userRole === 'administrateur') {
      localStorage.setItem('exigences_template', JSON.stringify(exigences));
    }
    
    // Mettre à jour les données globales
    saveData({
      ...appData,
      exigences: exigences
    });
    
    notifyExigenceUpdate();
  }, [exigences, currentUser, appData, saveData]);

  useEffect(() => {
    localStorage.setItem(`exigence_groups_${currentUser}`, JSON.stringify(groups));
  }, [groups, currentUser]);

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

  const handleResponsabiliteChange = (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { 
              ...exigence, 
              responsabilites: { 
                ...exigence.responsabilites, 
                [type]: values
              } 
            } 
          : exigence
      )
    );
  };

  const handleAtteinteChange = (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { ...exigence, atteinte } 
          : exigence
      )
    );
  };

  const handleExclusionChange = (id: string) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { ...exigence, exclusion: !exigence.exclusion } 
          : exigence
      )
    );
  };

  const handleEdit = (id: string) => {
    const exigenceToEdit = exigences.find(exigence => exigence.id === id);
    if (exigenceToEdit) {
      setEditingExigence(exigenceToEdit);
      setDialogOpen(true);
    } else {
      toast({
        title: "Erreur",
        description: `L'exigence ${id} n'a pas été trouvée`,
        variant: "destructive"
      });
    }
  };

  const handleSaveExigence = (updatedExigence: Exigence) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === updatedExigence.id ? updatedExigence : exigence
      )
    );
    toast({
      title: "Exigence mise à jour",
      description: `L'exigence ${updatedExigence.id} a été mise à jour avec succès`
    });
  };

  const handleDelete = (id: string) => {
    setExigences(prev => prev.filter(exigence => exigence.id !== id));
    toast({
      title: "Suppression",
      description: `L'exigence ${id} a été supprimée`,
    });
  };

  const handleAddExigence = () => {
    const maxId = exigences.length > 0 
      ? Math.max(...exigences.map(e => parseInt(e.id)))
      : 0;
    
    const newId = (maxId + 1).toString();
    
    const newExigence: Exigence = {
      id: newId,
      nom: `Nouvelle exigence ${newId}`,
      responsabilites: { r: [], a: [], c: [], i: [] },
      exclusion: false,
      atteinte: null,
      date_creation: new Date(),
      date_modification: new Date()
    };
    
    setExigences(prev => [...prev, newExigence]);
    toast({
      title: "Nouvelle exigence",
      description: `L'exigence ${newId} a été ajoutée`,
    });
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

    toast({
      title: "Réorganisation",
      description: "L'ordre des exigences a été mis à jour",
    });
  };

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const handleSaveGroup = useCallback((group: ExigenceGroup) => {
    if (editingGroup) {
      setGroups(prev => prev.map(g => g.id === group.id ? group : g));
      toast({
        title: "Groupe mis à jour",
        description: `Le groupe ${group.name} a été mis à jour avec succès`,
      });
    } else {
      setGroups(prev => [...prev, group]);
      toast({
        title: "Nouveau groupe",
        description: `Le groupe ${group.name} a été créé`,
      });
    }
  }, [editingGroup, toast]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    setExigences(prev => prev.map(exigence => 
      exigence.groupId === groupId ? { ...exigence, groupId: undefined } : exigence
    ));
    
    setGroups(prev => prev.filter(g => g.id !== groupId));
    
    toast({
      title: "Suppression",
      description: "Le groupe a été supprimé",
    });
  }, [toast]);

  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    setGroups(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des groupes a été mis à jour",
    });
  }, [toast]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    );
  }, []);

  const processedGroups = groups.map(group => {
    const groupItems = exigences.filter(exigence => exigence.groupId === group.id);
    return {
      ...group,
      items: groupItems
    };
  });

  return {
    exigences,
    groups: processedGroups,
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
    syncWithServer
  };
};
