
import React, { useEffect } from 'react';
import { FileText, FolderPlus } from 'lucide-react';
import { MembresProvider } from '@/contexts/MembresContext';
import ExigenceForm from '@/components/exigences/ExigenceForm';
import ExigenceStats from '@/components/exigences/ExigenceStats';
import ExigenceTable from '@/components/exigences/ExigenceTable';
import { ExigenceGroupDialog } from '@/components/exigences/ExigenceGroupDialog';
import { useSyncedData } from '@/hooks/useSyncedData';
import { exportExigencesToPdf } from '@/services/pdfExport';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SyncIndicator from '@/components/common/SyncIndicator';
import { getDeviceId } from '@/services/core/userService';
import { Exigence, ExigenceGroup, ExigenceStats as ExigenceStatsType } from '@/types/exigences';
import { useState } from 'react';

const ExigencesContent = () => {
  const { toast } = useToast();
  const [editingExigence, setEditingExigence] = useState<Exigence | null>(null);
  const [editingGroup, setEditingGroup] = useState<ExigenceGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExigenceStatsType>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });

  // Utilisation du hook useSyncedData pour les exigences
  const {
    data: exigences,
    updateData: setExigences,
    isSyncing: isSyncingExigences,
    isOnline,
    lastSynced,
    forceReload: forceReloadExigences,
    repairSync: repairSyncExigences,
    currentUser
  } = useSyncedData<Exigence>(
    'exigences',
    [],
    async (userId) => {
      try {
        console.log("Chargement des exigences pour", userId);
        const storedData = localStorage.getItem(`exigences_${userId}`);
        if (storedData) {
          return JSON.parse(storedData);
        }
        return [];
      } catch (error) {
        console.error("Erreur lors du chargement des exigences:", error);
        setLoadError("Impossible de charger les exigences. Veuillez réessayer.");
        return [];
      }
    },
    async (data, userId) => {
      try {
        console.log("Sauvegarde des exigences pour", userId);
        localStorage.setItem(`exigences_${userId}`, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des exigences:", error);
        return false;
      }
    }
  );

  // Utilisation du hook useSyncedData pour les groupes d'exigences
  const {
    data: groups,
    updateData: setGroups,
    isSyncing: isSyncingGroups,
    forceReload: forceReloadGroups,
    repairSync: repairSyncGroups
  } = useSyncedData<ExigenceGroup>(
    'exigence_groups',
    [],
    async (userId) => {
      try {
        console.log("Chargement des groupes d'exigences pour", userId);
        const storedData = localStorage.getItem(`exigence_groups_${userId}`);
        if (storedData) {
          return JSON.parse(storedData);
        }
        return [];
      } catch (error) {
        console.error("Erreur lors du chargement des groupes d'exigences:", error);
        return [];
      }
    },
    async (data, userId) => {
      try {
        console.log("Sauvegarde des groupes d'exigences pour", userId);
        localStorage.setItem(`exigence_groups_${userId}`, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des groupes d'exigences:", error);
        return false;
      }
    }
  );

  // Variable qui indique si une synchronisation est en cours (exigences ou groupes)
  const isSyncing = isSyncingExigences || isSyncingGroups;
  
  // Variable qui indique si une erreur de synchronisation est survenue
  const syncFailed = loadError !== null;

  // Calcul des statistiques chaque fois que les exigences changent
  useEffect(() => {
    const newStats = calculateStats(exigences);
    setStats(newStats);
  }, [exigences]);

  // Fonction pour calculer les statistiques
  const calculateStats = (exigences: Exigence[]): ExigenceStatsType => {
    const stats = {
      exclusion: 0,
      nonConforme: 0,
      partiellementConforme: 0,
      conforme: 0,
      total: exigences.length
    };

    exigences.forEach(exigence => {
      if (exigence.exclusion) {
        stats.exclusion++;
      } else if (exigence.atteinte === 'NC') {
        stats.nonConforme++;
      } else if (exigence.atteinte === 'PC') {
        stats.partiellementConforme++;
      } else if (exigence.atteinte === 'C') {
        stats.conforme++;
      }
    });

    return stats;
  };

  // Fonction pour synchroniser les données
  const handleSync = async () => {
    setLoadError(null);
    try {
      await Promise.all([
        forceReloadExigences(),
        forceReloadGroups()
      ]);
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setLoadError("Échec de la synchronisation. Veuillez réessayer.");
    }
  };

  // Fonctions de gestion des exigences
  const handleResponsabiliteChange = (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    const updatedExigences = exigences.map(exigence => {
      if (exigence.id === id) {
        return {
          ...exigence,
          responsabilites: {
            ...exigence.responsabilites,
            [type]: values
          }
        };
      }
      return exigence;
    });
    
    setExigences(updatedExigences);
  };

  const handleAtteinteChange = (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    const updatedExigences = exigences.map(exigence => {
      if (exigence.id === id) {
        return {
          ...exigence,
          atteinte
        };
      }
      return exigence;
    });
    
    setExigences(updatedExigences);
  };

  const handleExclusionChange = (id: string, exclusion: boolean) => {
    const updatedExigences = exigences.map(exigence => {
      if (exigence.id === id) {
        return {
          ...exigence,
          exclusion
        };
      }
      return exigence;
    });
    
    setExigences(updatedExigences);
  };

  const handleEdit = (exigence: Exigence) => {
    setEditingExigence(exigence);
    setDialogOpen(true);
  };

  const handleSaveExigence = (exigence: Exigence) => {
    if (editingExigence) {
      // Mise à jour d'une exigence existante
      const updatedExigences = exigences.map(e => 
        e.id === exigence.id ? exigence : e
      );
      setExigences(updatedExigences);
    } else {
      // Ajout d'une nouvelle exigence
      const newExigence = {
        ...exigence,
        id: String(Date.now()),
        date_creation: new Date(),
        date_modification: new Date(),
        userId: currentUser
      };
      setExigences([...exigences, newExigence]);
    }
    
    setDialogOpen(false);
    setEditingExigence(null);
  };

  const handleDelete = (id: string) => {
    const updatedExigences = exigences.filter(e => e.id !== id);
    setExigences(updatedExigences);
  };

  const handleAddExigence = () => {
    setEditingExigence(null);
    setDialogOpen(true);
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    const result = Array.from(exigences);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setExigences(result);
  };

  // Fonctions de gestion des groupes
  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: ExigenceGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = (group: ExigenceGroup) => {
    if (editingGroup) {
      // Mise à jour d'un groupe existant
      const updatedGroups = groups.map(g => 
        g.id === group.id ? group : g
      );
      setGroups(updatedGroups);
    } else {
      // Ajout d'un nouveau groupe
      const newGroup = {
        ...group,
        id: String(Date.now()),
        userId: currentUser,
        expanded: true,
        items: []
      };
      setGroups([...groups, newGroup]);
    }
    
    setGroupDialogOpen(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (id: string) => {
    // Supprimer le groupe
    const updatedGroups = groups.filter(g => g.id !== id);
    setGroups(updatedGroups);
    
    // Retirer les références au groupe dans les exigences
    const updatedExigences = exigences.map(e => {
      if (e.groupId === id) {
        return { ...e, groupId: undefined };
      }
      return e;
    });
    
    setExigences(updatedExigences);
  };

  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    const result = Array.from(groups);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setGroups(result);
  };

  const handleToggleGroup = (id: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id === id) {
        return { ...group, expanded: !group.expanded };
      }
      return group;
    });
    
    setGroups(updatedGroups);
  };

  const handleExportPdf = () => {
    exportExigencesToPdf(exigences, groups);
    toast({
      title: "Export PDF réussi",
      description: "Le document a été généré et téléchargé",
    });
  };

  // Adapter for handleExclusionChange to match the expected signature in ExigenceTable
  const handleExclusionChangeAdapter = (id: string) => {
    const exigence = exigences.find(e => e.id === id);
    if (exigence) {
      handleExclusionChange(id, !exigence.exclusion);
    }
  };

  // Adapter for handleEdit to match the expected signature in ExigenceTable
  const handleEditAdapter = (id: string) => {
    const exigenceToEdit = exigences.find(e => e.id === id);
    if (exigenceToEdit) {
      handleEdit(exigenceToEdit);
    }
  };

  // Récupérer l'ID de l'appareil actuel
  const deviceId = getDeviceId();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Exigences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos exigences et leurs conformités
          </p>
        </div>
        <div className="flex space-x-2 items-center">
          <Button 
            variant="outline"
            size="sm"
            title="Synchroniser maintenant"
            onClick={() => handleSync()}
            disabled={isSyncing || !isOnline}
            className="mr-2"
          >
            <span className="mr-2">Synchroniser</span>
          </Button>
          <button 
            onClick={handleExportPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SyncIndicator 
          isSyncing={isSyncing}
          isOnline={isOnline}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={handleSync}
          showOnlyErrors={false}
          tableName="exigences"
          deviceId={deviceId}
        />
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>{loadError}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSync()}
              className="ml-4"
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ExigenceStats stats={stats} />

      {exigences.length > 0 ? (
        <ExigenceTable 
          exigences={exigences}
          groups={groups}
          onResponsabiliteChange={handleResponsabiliteChange}
          onAtteinteChange={handleAtteinteChange}
          onExclusionChange={handleExclusionChangeAdapter}
          onEdit={handleEditAdapter}
          onDelete={handleDelete}
          onReorder={handleReorder}
          onGroupReorder={handleGroupReorder}
          onToggleGroup={handleToggleGroup}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      ) : loadError ? (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Impossible de charger les exigences.</p>
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucune exigence trouvée. Cliquez sur "Ajouter une exigence" pour commencer.</p>
        </div>
      )}

      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline"
          onClick={handleAddGroup}
          className="hover:bg-gray-100 transition-colors mr-2"
          title="Nouveau groupe"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Nouveau groupe
        </Button>
        <Button 
          variant="default"
          onClick={handleAddExigence}
        >
          Ajouter une exigence
        </Button>
      </div>

      <ExigenceForm 
        exigence={editingExigence}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveExigence}
      />

      <ExigenceGroupDialog
        group={editingGroup}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSave={handleSaveGroup}
        isEditing={!!editingGroup}
      />
    </div>
  );
};

const Exigences = () => (
  <MembresProvider>
    <ExigencesContent />
  </MembresProvider>
);

export default Exigences;

