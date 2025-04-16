
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Exigence, ExigenceStats } from '@/types/exigences';

export const useExigences = () => {
  const { toast } = useToast();
  
  const [exigences, setExigences] = useState<Exigence[]>(() => {
    const storedExigences = localStorage.getItem('exigences');
    return storedExigences ? JSON.parse(storedExigences) : [
      { 
        id: 1, 
        nom: 'Levée du courrier', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        exclusion: false,
        atteinte: null
      },
      { 
        id: 2, 
        nom: 'Ouverture du courrier', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        exclusion: false,
        atteinte: null
      },
    ];
  });

  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState<ExigenceStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });

  useEffect(() => {
    localStorage.setItem('exigences', JSON.stringify(exigences));
  }, [exigences]);

  useEffect(() => {
    const newStats = {
      exclusion: exigences.filter(e => e.exclusion).length,
      nonConforme: exigences.filter(e => e.atteinte === 'NC').length,
      partiellementConforme: exigences.filter(e => e.atteinte === 'PC').length,
      conforme: exigences.filter(e => e.atteinte === 'C').length,
      total: exigences.length
    };
    setStats(newStats);
  }, [exigences]);

  const handleResponsabiliteChange = (id: number, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { 
              ...exigence, 
              responsabilites: { 
                ...exigence.responsabilites, 
                [type]: values
              } 
            } 
          : exigence
      )
    );
  };

  const handleAtteinteChange = (id: number, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { ...exigence, atteinte } 
          : exigence
      )
    );
  };

  const handleExclusionChange = (id: number) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { ...exigence, exclusion: !exigence.exclusion } 
          : exigence
      )
    );
  };

  const handleEdit = (id: number) => {
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
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === updatedExigence.id ? updatedExigence : exigence
      )
    );
    toast({
      title: "Exigence mise à jour",
      description: `L'exigence ${updatedExigence.id} a été mise à jour avec succès`
    });
  };

  const handleDelete = (id: number) => {
    setExigences(prev => prev.filter(exigence => exigence.id !== id));
    toast({
      title: "Suppression",
      description: `L'exigence ${id} a été supprimée`,
    });
  };

  const handleAddExigence = () => {
    const newId = exigences.length > 0 
      ? Math.max(...exigences.map(e => e.id)) + 1 
      : 1;
    
    const newExigence: Exigence = {
      id: newId,
      nom: `Nouvelle exigence ${newId}`,
      responsabilites: { r: [], a: [], c: [], i: [] },
      exclusion: false,
      atteinte: null
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

  return {
    exigences,
    stats,
    editingExigence,
    dialogOpen,
    setDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveExigence,
    handleDelete,
    handleAddExigence,
    handleReorder
  };
};
