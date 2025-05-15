
import { useCallback } from 'react';
import { DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';

export const useBibliothequeGroups = (
  groups: DocumentGroup[],
  setGroups: React.Dispatch<React.SetStateAction<DocumentGroup[]>>
) => {
  const { toast } = useToast();

  const handleSaveGroup = useCallback((group: DocumentGroup, isEditing: boolean) => {
    if (isEditing) {
      setGroups(prev => prev.map(g => g.id === group.id ? group : g));
      toast({
        title: "Groupe modifié",
        description: `Le groupe ${group.name} a été mis à jour`,
      });
    } else {
      setGroups(prev => [...prev, group]);
      toast({
        title: "Groupe ajouté",
        description: `Le groupe ${group.name} a été créé`,
      });
    }
  }, [setGroups, toast]);

  const handleDeleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(group => group.id !== id));
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé",
    });
  }, [setGroups, toast]);

  const handleToggleGroup = useCallback((id: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === id ? { ...group, expanded: !group.expanded } : group
      )
    );
  }, [setGroups]);

  return {
    handleSaveGroup,
    handleDeleteGroup,
    handleToggleGroup
  };
};
