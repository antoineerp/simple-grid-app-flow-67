
import { useCallback } from 'react';
import { DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

export const useDocumentGroups = (
  groups: DocumentGroup[],
  setGroups: React.Dispatch<React.SetStateAction<DocumentGroup[]>>
) => {
  const { toast } = useToast();
  const currentUserId = getDatabaseConnectionCurrentUser() || 'default';

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
    // S'assurer que l'userId est préservé ou ajouté
    const updatedGroup = {
      ...group,
      userId: group.userId || currentUserId
    };
    
    if (isEditing) {
      setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      toast({
        title: "Groupe mis à jour",
        description: `Le groupe ${updatedGroup.name} a été mis à jour avec succès`,
      });
    } else {
      setGroups(prev => [...prev, updatedGroup]);
      toast({
        title: "Nouveau groupe",
        description: `Le groupe ${updatedGroup.name} a été créé`,
      });
    }
  }, [setGroups, toast, currentUserId]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    toast({
      title: "Suppression",
      description: "Le groupe a été supprimé",
    });
  }, [setGroups, toast]);

  return {
    handleGroupReorder,
    handleToggleGroup,
    handleSaveGroup,
    handleDeleteGroup
  };
};
