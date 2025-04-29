
import { useCallback } from 'react';
import { Exigence } from '@/types/exigences';
import { useToast } from '@/hooks/use-toast';

export const useExigenceEditHandlers = (
  exigences: Exigence[],
  setEditingExigence: React.Dispatch<React.SetStateAction<Exigence | null>>,
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  selectedNiveau: string | null
) => {
  // Edition d'une exigence existante
  const handleEdit = useCallback((id: string) => {
    const exigence = exigences.find(e => e.id === id);
    if (exigence) {
      setEditingExigence(exigence);
      setDialogOpen(true);
    }
  }, [exigences, setEditingExigence, setDialogOpen]);

  // Ajout d'une nouvelle exigence
  const handleAddExigence = useCallback(() => {
    const newExigence: Exigence = {
      id: crypto.randomUUID(),
      nom: '',
      code: '',
      titre: '',
      description: '',
      niveau: selectedNiveau || 'NA',
      atteinte: null,
      exclusion: false,
      documents_associes: [],
      responsabilites: {
        r: [],
        a: [],
        c: [],
        i: []
      },
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString()
    };
    setEditingExigence(newExigence);
    setDialogOpen(true);
  }, [selectedNiveau, setEditingExigence, setDialogOpen]);

  return {
    handleEdit,
    handleAddExigence
  };
};
