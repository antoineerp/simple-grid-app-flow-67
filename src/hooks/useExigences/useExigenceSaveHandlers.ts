
import { useCallback } from 'react';
import { Exigence } from '@/types/exigences';

export const useExigenceSaveHandlers = (
  exigences: Exigence[],
  handleAddExigence: (exigence: Exigence) => void,
  handleSaveExigence: (exigence: Exigence) => void,
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  syncWithServer: () => Promise<boolean>
) => {
  // Fonction sauvegarde synchronisée
  const handleSaveExigenceWithSync = useCallback(async (exigence: Exigence) => {
    const isNew = !exigences.some(e => e.id === exigence.id);

    if (isNew) {
      handleAddExigence(exigence);
    } else {
      handleSaveExigence(exigence);
    }

    setDialogOpen(false);

    // Synchroniser après modification
    try {
      console.log("Synchronisation après sauvegarde d'exigence");
      await syncWithServer();
    } catch (error) {
      console.error("Erreur de synchronisation après sauvegarde:", error);
    }
  }, [exigences, handleAddExigence, handleSaveExigence, setDialogOpen, syncWithServer]);

  return {
    handleSaveExigenceWithSync
  };
};
