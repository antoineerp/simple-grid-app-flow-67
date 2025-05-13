
import { useState } from 'react';
import { Exigence } from '@/types/exigences';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

export const useExigenceMutations = (
  exigences: Exigence[],
  setExigences: React.Dispatch<React.SetStateAction<Exigence[]>>
) => {
  const { toast } = useToast();
  const currentUser = getCurrentUser()?.identifiant_technique || 'system';

  const handleResponsabiliteChange = (exigenceId: string, type: 'r' | 'a' | 'c' | 'i', value: string[]) => {
    setExigences(prev => prev.map(e =>
      e.id === exigenceId
        ? {
          ...e,
          responsabilites: {
            ...e.responsabilites,
            [type]: value
          },
          date_modification: new Date()
        }
        : e
    ));

    toast({
      title: "Responsabilités mises à jour",
      description: `Les responsabilités de l'exigence ${exigenceId} ont été mises à jour`,
    });
  };

  const handleAtteinteChange = (exigenceId: string, value: 'NC' | 'PC' | 'C' | null) => {
    setExigences(prev => prev.map(e =>
      e.id === exigenceId
        ? { ...e, atteinte: value, date_modification: new Date() }
        : e
    ));

    toast({
      title: "Niveau d'atteinte mis à jour",
      description: `L'atteinte de l'exigence ${exigenceId} a été mise à jour`,
    });
  };

  const handleExclusionChange = (exigenceId: string, value: boolean) => {
    setExigences(prev => prev.map(e =>
      e.id === exigenceId
        ? { ...e, exclusion: value, date_modification: new Date() }
        : e
    ));

    toast({
      title: value ? "Exigence exclue" : "Exclusion retirée",
      description: `L'exigence ${exigenceId} ${value ? 'a été exclue' : "n'est plus exclue"}`,
    });
  };

  const handleSaveExigence = (exigence: Exigence) => {
    if (exigences.some(e => e.id === exigence.id)) {
      setExigences(prev => prev.map(e =>
        e.id === exigence.id ? { ...exigence, date_modification: new Date() } : e
      ));
    } else {
      const newExigence: Exigence = {
        id: exigence.id || `exigence_${Date.now()}`,
        nom: exigence.nom || 'Nouvelle exigence',
        responsabilites: exigence.responsabilites || { r: [], a: [], c: [], i: [] },
        exclusion: exigence.exclusion || false,
        atteinte: exigence.atteinte || null,
        date_creation: new Date(),
        date_modification: new Date(),
        userId: exigence.userId || currentUser
      };
      setExigences(prev => [...prev, newExigence]);
    }
  };

  const handleDelete = (exigenceId: string) => {
    setExigences(prev => prev.filter(e => e.id !== exigenceId));
    toast({
      title: "Exigence supprimée",
      description: `L'exigence ${exigenceId} a été supprimée`,
    });
  };

  const handleAddExigence = () => {
    const randomId = Math.random().toString(36).substring(2, 11);
    const newExigence: Exigence = {
      id: randomId,
      nom: `Nouvelle exigence ${randomId.substring(0, 4)}`,
      responsabilites: { r: [], a: [], c: [], i: [] },
      exclusion: false,
      atteinte: null,
      date_creation: new Date(),
      date_modification: new Date(),
      userId: currentUser
    };

    setExigences(prev => [...prev, newExigence]);
    toast({
      title: "Nouvelle exigence",
      description: `Une nouvelle exigence a été ajoutée avec l'ID ${randomId}`,
    });
  };

  return {
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleSaveExigence,
    handleDelete,
    handleAddExigence
  };
};
