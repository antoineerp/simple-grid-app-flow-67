
import { useCallback } from 'react';
import { ExigenceGroup } from '@/types/exigences';
import { useToast } from '@/hooks/use-toast';

export const useExigenceGroups = (
  groups: ExigenceGroup[],
  setGroups: React.Dispatch<React.SetStateAction<ExigenceGroup[]>>,
  setExigences?: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const { toast } = useToast();

  const handleSaveGroup = useCallback((group: ExigenceGroup, isEditing: boolean) => {
    if (isEditing) {
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
  }, [setGroups, toast]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    if (setExigences) {
      setExigences(prev => prev.map(exigence => 
        exigence.groupId === groupId ? { ...exigence, groupId: undefined } : exigence
      ));
    }
    
    setGroups(prev => prev.filter(g => g.id !== groupId));
    
    toast({
      title: "Suppression",
      description: "Le groupe a été supprimé",
    });
  }, [setGroups, setExigences, toast]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    );
  }, [setGroups]);

  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    setGroups(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, [setGroups]);

  const handleAddGroup = useCallback(() => {
    const newGroup: ExigenceGroup = {
      id: crypto.randomUUID(),
      name: "Nouveau groupe",
      expanded: true,
      items: []
    };
    
    toast({
      title: "Nouveau groupe",
      description: "Veuillez modifier les informations du groupe",
    });
    
    return newGroup;
  }, [toast]);

  return {
    handleSaveGroup,
    handleDeleteGroup,
    handleToggleGroup,
    handleGroupReorder,
    handleAddGroup
  };
};
