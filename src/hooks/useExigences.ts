
import { useState, useCallback, useEffect } from 'react';
import { Exigence, ExigenceGroup, ExigenceStats } from '@/types/exigences';
import { useExigenceMutations } from '@/hooks/useExigenceMutations';
import { useExigenceGroups } from '@/hooks/useExigenceGroups';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { loadExigencesFromServer, syncExigencesWithServer } from '@/services/exigences/exigenceSyncService';

export const useExigences = () => {
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [groups, setGroups] = useState<ExigenceGroup[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { toast } = useToast();

  const exigenceMutations = useExigenceMutations(exigences, setExigences);
  const groupOperations = useExigenceGroups(groups, setGroups, setExigences);

  // Load exigences from server when component mounts
  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const userId = typeof currentUser === 'object' ? 
          (currentUser.identifiant_technique || '') : currentUser;
        
        if (userId) {
          try {
            const loadedData = await loadExigencesFromServer(userId);
            if (loadedData && loadedData.exigences && loadedData.exigences.length > 0) {
              setExigences(loadedData.exigences);
              if (loadedData.groups && loadedData.groups.length > 0) {
                setGroups(loadedData.groups);
              }
              toast({
                title: "Exigences chargées",
                description: `${loadedData.exigences.length} exigences chargées depuis le serveur`,
              });
              setLastSynced(new Date());
            }
          } catch (error) {
            console.error("Erreur lors du chargement des exigences:", error);
            toast({
              title: "Erreur de chargement",
              description: "Impossible de charger vos exigences depuis le serveur",
              variant: "destructive"
            });
          }
        }
      }
    };
    
    loadData();
  }, [toast]);

  // Sync exigences with server
  const syncWithServer = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Erreur de synchronisation",
        description: "Vous devez être connecté pour synchroniser vos exigences",
        variant: "destructive"
      });
      return;
    }

    const userId = typeof currentUser === 'object' ? 
      (currentUser.identifiant_technique || '') : currentUser;
    
    if (!userId) {
      toast({
        title: "Erreur de synchronisation",
        description: "Identifiant utilisateur invalide",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const success = await syncExigencesWithServer(exigences, userId, groups);
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Vos exigences ont été enregistrées sur le serveur",
        });
      } else {
        throw new Error("La synchronisation a échoué");
      }
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Impossible de synchroniser vos exigences",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [exigences, groups, toast]);

  // Calculate exigence statistics
  const stats: ExigenceStats = {
    total: exigences.length,
    conforme: exigences.filter(e => e.atteinte === 'C').length,
    partiellementConforme: exigences.filter(e => e.atteinte === 'PC').length,
    nonConforme: exigences.filter(e => e.atteinte === 'NC').length,
    exclusion: exigences.filter(e => e.exclusion).length
  };

  // Handle exigence editing
  const handleEdit = useCallback((id: string) => {
    const exigence = exigences.find(e => e.id === id);
    if (exigence) {
      setEditingExigence(exigence);
      setDialogOpen(true);
    }
  }, [exigences]);

  // Handle exigence adding - sans paramètre
  const handleAddExigence = useCallback(() => {
    const newExigence: Exigence = {
      id: crypto.randomUUID(),
      code: '',
      titre: '',
      nom: '',
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
      date_creation: new Date(),
      date_modification: new Date()
    };
    setEditingExigence(newExigence);
    setDialogOpen(true);
  }, [selectedNiveau]);

  // Handle exigence save
  const handleSaveExigence = useCallback((exigence: Exigence) => {
    const isNew = !exigences.some(e => e.id === exigence.id);

    if (isNew) {
      exigenceMutations.handleAddExigence(exigence);
    } else {
      exigenceMutations.handleSaveExigence(exigence);
    }

    setDialogOpen(false);
    
    // Sync with server after saving
    syncWithServer();
  }, [exigences, exigenceMutations, syncWithServer]);

  // Réorganisation des exigences
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    console.log('Reorder exigences:', startIndex, endIndex, targetGroupId);
  }, []);

  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    console.log('Reorder groups:', startIndex, endIndex);
  }, []);

  // Fonction pour ajouter un groupe
  const handleAddGroup = useCallback(() => {
    const newGroup: ExigenceGroup = {
      id: crypto.randomUUID(),
      name: 'Nouveau groupe',
      expanded: false,
      items: []
    };
    setEditingGroup(newGroup);
    setGroupDialogOpen(true);
  }, []);

  // Fonction pour éditer un groupe
  const handleEditGroup = useCallback((group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  return {
    exigences,
    groups,
    selectedNiveau,
    stats,
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    lastSynced,
    setSelectedNiveau,
    setDialogOpen,
    setGroupDialogOpen,
    handleEdit,
    handleDelete: exigenceMutations.handleDelete,
    handleAddExigence,
    handleSaveExigence,
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup: groupOperations.handleSaveGroup,
    handleDeleteGroup: groupOperations.handleDeleteGroup,
    handleToggleGroup: groupOperations.handleToggleGroup,
    handleReorder,
    handleGroupReorder,
    syncWithServer,
    ...exigenceMutations
  };
};
