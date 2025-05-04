
import { useState, useEffect, useCallback } from 'react';
import { getUserSelections, updateSelection, bulkUpdateSelections, Checkbox } from '@/services/selections/userSelectionsService';
import { useToast } from '@/hooks/use-toast';

export const useUserSelections = () => {
  const [checkboxes, setCheckboxes] = useState<Checkbox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Chargement initial des sélections
  const loadSelections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const selections = await getUserSelections();
      setCheckboxes(selections);
    } catch (err) {
      console.error('Erreur lors du chargement des sélections:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des sélections');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos sélections. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Chargement initial au montage du composant
  useEffect(() => {
    loadSelections();
  }, [loadSelections]);

  // Mise à jour d'une sélection
  const handleToggle = useCallback(async (checkboxId: number, newValue: boolean) => {
    try {
      // Optimistic update
      setCheckboxes(prev => 
        prev.map(checkbox => 
          checkbox.id === checkboxId 
            ? { ...checkbox, isSelected: newValue } 
            : checkbox
        )
      );

      const result = await updateSelection(checkboxId, newValue);
      
      if (!result.success) {
        // Revenir à l'état précédent en cas d'erreur
        setCheckboxes(prev => 
          prev.map(checkbox => 
            checkbox.id === checkboxId 
              ? { ...checkbox, isSelected: !newValue } 
              : checkbox
          )
        );
        
        throw new Error(result.error || 'Mise à jour échouée');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la sélection:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder votre sélection. Veuillez réessayer.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Mise à jour en masse des sélections
  const handleBulkUpdate = useCallback(async (selectedIds: number[]) => {
    try {
      // Optimistic update
      setCheckboxes(prev => 
        prev.map(checkbox => ({
          ...checkbox,
          isSelected: selectedIds.includes(checkbox.id)
        }))
      );

      const result = await bulkUpdateSelections(selectedIds);
      
      if (!result.success) {
        // Recharger les données en cas d'erreur pour rétablir l'état correct
        await loadSelections();
        throw new Error(result.error || 'Mise à jour en masse échouée');
      }
      
      toast({
        title: 'Succès',
        description: 'Toutes vos sélections ont été sauvegardées.',
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour en masse:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder vos sélections. Veuillez réessayer.',
        variant: 'destructive',
      });
    }
  }, [loadSelections, toast]);

  // Fonction pour sélectionner/désélectionner toutes les checkboxes d'une catégorie
  const toggleCategory = useCallback((category: string, selectAll: boolean) => {
    const updatedCheckboxes = checkboxes.map(checkbox => 
      checkbox.category === category 
        ? { ...checkbox, isSelected: selectAll } 
        : checkbox
    );
    
    setCheckboxes(updatedCheckboxes);
    
    // Récupérer les IDs des checkboxes sélectionnées
    const selectedIds = updatedCheckboxes
      .filter(checkbox => checkbox.isSelected)
      .map(checkbox => checkbox.id);
    
    // Mettre à jour en masse
    handleBulkUpdate(selectedIds);
  }, [checkboxes, handleBulkUpdate]);

  // Regrouper les checkboxes par catégorie
  const checkboxesByCategory = checkboxes.reduce((acc, checkbox) => {
    if (!acc[checkbox.category]) {
      acc[checkbox.category] = [];
    }
    acc[checkbox.category].push(checkbox);
    return acc;
  }, {} as Record<string, Checkbox[]>);

  return {
    checkboxes,
    checkboxesByCategory,
    isLoading,
    error,
    handleToggle,
    toggleCategory,
    refresh: loadSelections,
    handleBulkUpdate
  };
};
