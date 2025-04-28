
import { useCallback } from 'react';
import { DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';

export const useDocumentGroups = (
  groups: DocumentGroup[],
  setGroups: React.Dispatch<React.SetStateAction<DocumentGroup[]>>
) => {
  const { toast } = useToast();

  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    setGroups(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, [setGroups]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    );
  }, [setGroups]);

  const handleSaveGroup = useCallback((group: DocumentGroup, isEditing: boolean) => {
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
    setGroups(prev => prev.filter(g => g.id !== groupId));
    toast({
      title: "Suppression",
      description: "Le groupe a été supprimé",
    });
  }, [setGroups, toast]);

  const handleAddGroup = useCallback(() => {
    const newGroup: DocumentGroup = {
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
    handleGroupReorder,
    handleToggleGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleAddGroup
  };
};
