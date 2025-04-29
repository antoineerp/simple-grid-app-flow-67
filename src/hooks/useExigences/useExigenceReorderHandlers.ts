
import { useCallback } from 'react';
import { Exigence } from '@/types/exigences';

export const useExigenceReorderHandlers = (
  exigences: Exigence[],
  setExigences: React.Dispatch<React.SetStateAction<Exigence[]>>,
  syncWithServer: () => Promise<boolean>
) => {
  // Gestion du réordonnancement
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    const newExigences = [...exigences];
    const [removed] = newExigences.splice(startIndex, 1);
    const updated = { ...removed, groupId: targetGroupId };
    newExigences.splice(endIndex, 0, updated);
    setExigences(newExigences);
    
    // Synchroniser après réorganisation
    syncWithServer().catch(err => console.error("Erreur lors de la synchronisation après réorganisation:", err));
  }, [exigences, setExigences, syncWithServer]);

  return {
    handleReorder
  };
};
