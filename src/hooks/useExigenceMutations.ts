import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { useToast } from '@/hooks/use-toast';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

export const useExigenceMutations = (
  exigences: Exigence[],
  setExigences: React.Dispatch<React.SetStateAction<Exigence[]>>,
  groups: ExigenceGroup[],
  setGroups: React.Dispatch<React.SetStateAction<ExigenceGroup[]>>
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const currentUserId = getDatabaseConnectionCurrentUser() || 'default';

  // Fonction pour créer une nouvelle exigence
  const createExigence = useCallback(
    (exigence: Omit<Exigence, 'id' | 'date_creation' | 'date_modification'>) => {
      setIsLoading(true);
      try {
        const now = new Date();
        const newExigence: Exigence = {
          id: uuidv4(),
          ...exigence,
          date_creation: now,
          date_modification: now,
          userId: currentUserId // Ajouter l'userId
        };

        setExigences((prev) => [...prev, newExigence]);

        toast({
          title: 'Exigence créée',
          description: `L'exigence ${exigence.nom} a été créée avec succès.`,
        });

        return newExigence;
      } catch (error) {
        console.error('Erreur lors de la création de l\'exigence:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la création de l\'exigence.',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setExigences, toast, currentUserId]
  );

  // Fonction pour mettre à jour une exigence
  const updateExigence = useCallback(
    (id: string, exigenceData: Partial<Exigence>) => {
      setIsLoading(true);
      try {
        setExigences((prev) =>
          prev.map((exigence) =>
            exigence.id === id
              ? {
                  ...exigence,
                  ...exigenceData,
                  date_modification: new Date(),
                  userId: exigence.userId || currentUserId // Conserver ou ajouter l'userId
                }
              : exigence
          )
        );

        toast({
          title: 'Exigence mise à jour',
          description: 'L\'exigence a été mise à jour avec succès.',
        });
        return true;
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'exigence:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la mise à jour de l\'exigence.',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setExigences, toast, currentUserId]
  );

  // Fonction pour supprimer une exigence
  const deleteExigence = useCallback(
    (id: string) => {
      setIsLoading(true);
      try {
        setExigences((prev) => prev.filter((exigence) => exigence.id !== id));
        toast({
          title: 'Exigence supprimée',
          description: 'L\'exigence a été supprimée avec succès.',
        });
        return true;
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'exigence:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la suppression de l\'exigence.',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setExigences, toast]
  );

  // Fonction pour créer un nouveau groupe d'exigences
  const createGroup = useCallback(
    (name: string) => {
      const newGroup: ExigenceGroup = {
        id: uuidv4(),
        name,
        expanded: true,
        items: [],
        userId: currentUserId // Ajouter l'userId
      };

      setGroups((prev) => [...prev, newGroup]);
      toast({
        title: 'Groupe créé',
        description: `Le groupe ${name} a été créé avec succès.`,
      });
      return newGroup;
    },
    [setGroups, toast, currentUserId]
  );

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
    createExigence,
    updateExigence,
    deleteExigence,
    createGroup,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleSaveExigence,
    handleDelete,
    handleAddExigence,
    isLoading
  };
};

export default useExigenceMutations;
