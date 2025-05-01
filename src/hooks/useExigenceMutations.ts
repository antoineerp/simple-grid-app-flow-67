
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { useToast } from '@/hooks/use-toast';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

export const useExigenceMutations = () => {
  const { toast } = useToast();
  const currentUserId = getDatabaseConnectionCurrentUser() || 'default';
  
  // État de l'exigence en cours d'édition
  const [editingExigence, setEditingExigence] = useState<Exigence>({
    id: '',
    nom: '',
    responsabilites: { r: [], a: [], c: [], i: [] },
    exclusion: false,
    atteinte: null,
    date_creation: new Date(),
    date_modification: new Date(),
    userId: currentUserId // Assurer que userId est toujours défini
  });
  
  // État du groupe en cours d'édition
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  
  // État des dialogues
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  
  // Fonction pour mettre à jour l'exigence en cours d'édition
  const setCurrentExigence = useCallback((exigence: Exigence | null) => {
    if (exigence) {
      setEditingExigence({
        ...exigence,
        userId: exigence.userId || currentUserId // S'assurer que userId est défini
      });
    } else {
      // Réinitialiser avec une nouvelle exigence vide avec userId
      setEditingExigence({
        id: '',
        nom: '',
        responsabilites: { r: [], a: [], c: [], i: [] },
        exclusion: false,
        atteinte: null,
        date_creation: new Date(),
        date_modification: new Date(),
        userId: currentUserId
      });
    }
  }, [currentUserId]);
  
  // Fonction pour gérer le début de l'édition d'une exigence
  const handleEditExigence = useCallback((exigence: Exigence) => {
    setCurrentExigence(exigence);
    setDialogOpen(true);
  }, [setCurrentExigence]);
  
  // Fonction pour gérer le début de l'ajout d'une exigence
  const handleAddExigence = useCallback(() => {
    setCurrentExigence(null); // Réinitialise avec une exigence vide
    setDialogOpen(true);
  }, [setCurrentExigence]);
  
  // Fonction pour gérer la sauvegarde d'une exigence (ajout ou mise à jour)
  const handleSaveExigence = useCallback((exigence: Exigence) => {
    const now = new Date();
    const updatedExigence = {
      ...exigence,
      userId: exigence.userId || currentUserId, // S'assurer que userId est défini
      date_modification: now,
    };
    
    // Si l'exigence existe déjà, la mettre à jour
    if (exigence.id) {
      // Cette fonction nécessite l'état exigences et setExigences qui proviennent du hook parent
      // On délègue donc l'exécution réelle au hook parent en passant l'exigence à mettre à jour
      toast({
        title: "Exigence mise à jour",
        description: `L'exigence "${exigence.nom}" a été mise à jour avec succès`,
      });
    } 
    // Sinon, ajouter une nouvelle exigence
    else {
      const newExigence = {
        ...updatedExigence,
        id: uuidv4(),
        date_creation: now,
      };
      
      toast({
        title: "Exigence ajoutée",
        description: `L'exigence "${newExigence.nom}" a été ajoutée avec succès`,
      });
      
      return newExigence;
    }
    
    return updatedExigence;
  }, [toast, currentUserId]);
  
  // Fonction pour gérer la suppression d'une exigence
  const handleDeleteExigence = useCallback((id: string, exigences: Exigence[], setExigences: React.Dispatch<React.SetStateAction<Exigence[]>>) => {
    setExigences(prev => prev.filter(e => e.id !== id));
    
    toast({
      title: "Exigence supprimée",
      description: "L'exigence a été supprimée avec succès",
    });
  }, [toast]);
  
  // Nouvelle fonction pour créer une exigence vierge
  const createNewExigence = useCallback((): Exigence => {
    return {
      id: uuidv4(),
      nom: 'Nouvelle exigence',
      responsabilites: { r: [], a: [], c: [], i: [] },
      exclusion: false,
      atteinte: null,
      date_creation: new Date(),
      date_modification: new Date(),
      userId: currentUserId // Assurer que userId est toujours défini
    };
  }, [currentUserId]);
  
  return {
    editingExigence,
    dialogOpen,
    setDialogOpen,
    handleEditExigence,
    handleAddExigence,
    handleSaveExigence,
    handleDeleteExigence,
    createNewExigence
  };
};
