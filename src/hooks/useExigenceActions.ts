
import { useCallback } from 'react';
import { Exigence, ExigenceGroup } from '@/types/exigences';

export const useExigenceActions = (
  exigences: Exigence[],
  setExigences: React.Dispatch<React.SetStateAction<Exigence[]>>,
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setEditingExigence: React.Dispatch<React.SetStateAction<Exigence | null>>
) => {
  // Handle editing an exigence
  const handleEdit = useCallback((id: string) => {
    const exigenceToEdit = exigences.find(exigence => exigence.id === id);
    if (exigenceToEdit) {
      setEditingExigence(exigenceToEdit);
      setDialogOpen(true);
    }
  }, [exigences, setEditingExigence, setDialogOpen]);

  // Handle reordering exigences
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    setExigences(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId === 'null' ? undefined : targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, [setExigences]);

  // Handle changing responsibilities
  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', membres: string[]) => {
    setExigences(prev => 
      prev.map(e => {
        if (e.id === id) {
          return {
            ...e,
            responsabilites: {
              ...e.responsabilites,
              [type]: membres
            }
          };
        }
        return e;
      })
    );
  }, [setExigences]);

  // Handle changing attainment status
  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setExigences(prev => 
      prev.map(e => {
        if (e.id === id) {
          return {
            ...e,
            atteinte,
            date_modification: new Date()
          };
        }
        return e;
      })
    );
  }, [setExigences]);

  // Handle changing exclusion status
  const handleExclusionChange = useCallback((id: string, exclusion: boolean) => {
    setExigences(prev => 
      prev.map(e => {
        if (e.id === id) {
          return {
            ...e,
            exclusion,
            date_modification: new Date()
          };
        }
        return e;
      })
    );
  }, [setExigences]);

  return {
    handleEdit,
    handleReorder,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange
  };
};
