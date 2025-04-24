import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Exigence, ExigenceStats } from '@/types/exigences';
import { 
  loadExigencesFromStorage, 
  saveExigencesToStorage, 
  calculateExigenceStats,
  syncExigencesWithServer
} from '@/services/exigences/exigencesService';
import { getCurrentUserId } from '@/services/core/syncService';

export const useExigences = () => {
  const { toast } = useToast();
  const currentUser = getCurrentUserId();
  
  const [exigences, setExigences] = useState<Exigence[]>(() => loadExigencesFromStorage(currentUser));
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState<ExigenceStats>(calculateExigenceStats(exigences));
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setStats(calculateExigenceStats(exigences));
  }, [exigences]);

  useEffect(() => {
    saveExigencesToStorage(exigences, currentUser);
  }, [exigences, currentUser]);

  useEffect(() => {
    const syncWithServer = async () => {
      if (exigences.length > 0) {
        setIsSyncing(true);
        try {
          await syncExigencesWithServer(exigences, currentUser);
        } catch (error) {
          console.error("Erreur lors de la synchronisation initiale:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    syncWithServer();
  }, [exigences.length]);

  const handleResponsabiliteChange = (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { 
              ...exigence, 
              responsabilites: { 
                ...exigence.responsabilites, 
                [type]: values
              },
              date_modification: new Date()
            } 
          : exigence
      )
    );
  };

  const handleAtteinteChange = (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { 
              ...exigence, 
              atteinte,
              date_modification: new Date()
            } 
          : exigence
      )
    );
  };

  const handleExclusionChange = (id: string) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { 
              ...exigence, 
              exclusion: !exigence.exclusion,
              date_modification: new Date()
            } 
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
    const newExigence = {
      ...updatedExigence,
      date_modification: new Date()
    };
    
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === newExigence.id ? newExigence : exigence
      )
    );
    toast({
      title: "Exigence mise à jour",
      description: `L'exigence ${newExigence.id} a été mise à jour avec succès`
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

  const handleReorder = (startIndex: number, endIndex: number) => {
    setExigences(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des exigences a été mis à jour",
    });
  };

  const syncWithServer = async () => {
    setIsSyncing(true);
    
    const success = await syncExigencesWithServer(exigences, currentUser);
    
    if (success) {
      toast({
        title: "Synchronisation réussie",
        description: "Vos exigences ont été synchronisées avec le serveur",
      });
    } else {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser vos exigences",
        variant: "destructive"
      });
    }
    
    setIsSyncing(false);
    return success;
  };

  return {
    exigences,
    stats,
    editingExigence,
    dialogOpen,
    isSyncing,
    setDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveExigence,
    handleDelete,
    handleAddExigence,
    handleReorder,
    syncWithServer
  };
};
