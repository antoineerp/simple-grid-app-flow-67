
import { useCallback } from 'react';
import { Exigence } from '@/types/exigences';
import { useToast } from '@/hooks/use-toast';

export const useExigenceMutations = (
  exigences: Exigence[],
  setExigences: React.Dispatch<React.SetStateAction<Exigence[]>>
) => {
  const { toast } = useToast();

  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { 
              ...exigence, 
              responsabilites: { ...exigence.responsabilites, [type]: values },
              date_modification: new Date()
            } 
          : exigence
      )
    );
  }, [setExigences]);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { ...exigence, atteinte, date_modification: new Date() }
          : exigence
      )
    );
  }, [setExigences]);

  const handleExclusionChange = useCallback((id: string) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { ...exigence, exclusion: !exigence.exclusion, date_modification: new Date() }
          : exigence
      )
    );
  }, [setExigences]);

  const handleSaveExigence = useCallback((updatedExigence: Exigence) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === updatedExigence.id ? updatedExigence : exigence
      )
    );
    toast({
      title: "Exigence mise à jour",
      description: `L'exigence ${updatedExigence.id} a été mise à jour avec succès`
    });
  }, [setExigences, toast]);

  const handleDelete = useCallback((id: string) => {
    setExigences(prev => prev.filter(exigence => exigence.id !== id));
    toast({
      title: "Suppression",
      description: `L'exigence ${id} a été supprimée`,
    });
  }, [setExigences, toast]);

  const handleAddExigence = useCallback(() => {
    const maxId = Math.max(...exigences.map(e => parseInt(e.id)), 0);
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
  }, [exigences, setExigences, toast]);

  return {
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleSaveExigence,
    handleDelete,
    handleAddExigence
  };
};
