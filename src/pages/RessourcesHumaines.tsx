import React, { useEffect, useCallback } from 'react';
import { FileText, UserPlus, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMembres } from '@/contexts/MembresContext';
import MemberList from '@/components/ressources-humaines/MemberList';
import MemberForm from '@/components/ressources-humaines/MemberForm';
import { Membre } from '@/types/membres';
import { exportAllCollaborateursToPdf } from '@/services/collaborateurExport';
import { useSyncContext } from '@/hooks/useSyncContext';
import SyncIndicator from '@/components/ui/SyncIndicator';

const RessourcesHumaines = () => {
  const { toast } = useToast();
  const { 
    membres, 
    setMembres, 
    isLoading,
    refreshMembres
  } = useMembres();
  
  // Configurer la synchronisation avec des paramètres optimisés
  const { 
    syncTable,
    isOnline
  } = useSyncContext();
  
  // Create local implementation for missing functions
  const syncWithServer = useCallback(async (data: any, additionalData?: any, userId?: string) => {
    try {
      console.log(`RessourcesHumaines: Manually syncing data`);
      return await syncTable('ressourceshumaines', data);
    } catch (error) {
      console.error('RessourcesHumaines: Sync error:', error);
      return false;
    }
  }, [syncTable]);
  
  const notifyChanges = useCallback(() => {
    console.log('RessourcesHumaines: Notifying data changes');
    
    // Dispatch an event that can be caught by other components
    window.dispatchEvent(new CustomEvent('ressourceshumaines-data-changed', {
      detail: { timestamp: Date.now() }
    }));
  }, []);
  
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncFailed, setSyncFailed] = React.useState(false);
  const [lastSynced, setLastSynced] = React.useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [currentMembre, setCurrentMembre] = React.useState<Membre>({
    id: '',
    nom: '',
    prenom: '',
    fonction: '',
    initiales: '',
    date_creation: new Date(),
    mot_de_passe: '' 
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Synchroniser immédiatement à chaque changement de membres
  useEffect(() => {
    if (membres.length > 0 && !isLoading) {
      console.log("RessourcesHumaines: Synchronisation automatique des membres après changement", membres.length);
      notifyChanges();
    }
  }, [membres, notifyChanges, isLoading]);
  
  // Forcer une synchronisation au chargement de la page
  useEffect(() => {
    const syncOnLoad = async () => {
      if (membres.length > 0 && isOnline) {
        setIsSyncing(true);
        try {
          console.log("RessourcesHumaines: Forcer la synchronisation au chargement de la page");
          // Pass the membres data to syncWithServer
          const success = await syncWithServer(membres);
          if (success) {
            setLastSynced(new Date());
            setSyncFailed(false);
          } else {
            setSyncFailed(true);
          }
        } catch (err) {
          console.error("Erreur de synchronisation initiale:", err);
          setSyncFailed(true);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    syncOnLoad();
  }, [membres.length, isOnline, syncWithServer]);

  const handleEdit = (id: string) => {
    const membre = membres.find(m => m.id === id);
    if (membre) {
      setCurrentMembre({ ...membre });
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    const updatedMembres = membres.filter(membre => membre.id !== id);
    setMembres(updatedMembres);
    
    toast({
      title: "Suppression",
      description: `Le membre ${id} a été supprimé`,
    });
    
    // Force une notification de changement immédiat
    notifyChanges();
  };

  const handleAddMember = () => {
    // Générer un ID plus unique avec un préfixe pour éviter les collisions
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const newId = `mem-${timestamp}-${randomSuffix}`;
    
    setCurrentMembre({
      id: newId,
      nom: '',
      prenom: '',
      fonction: '',
      initiales: '',
      date_creation: new Date(),
      mot_de_passe: '' 
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleExportMember = (id: string) => {
    console.log(`Exporting member with id: ${id}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMembre({
      ...currentMembre,
      [name]: value
    });
  };

  const handleSaveMember = () => {
    if (currentMembre.nom.trim() === '' || currentMembre.prenom.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom et le prénom sont requis",
        variant: "destructive",
      });
      return;
    }

    if (currentMembre.initiales.trim() === '') {
      const initiales = `${currentMembre.prenom.charAt(0)}${currentMembre.nom.charAt(0)}`;
      currentMembre.initiales = initiales.toUpperCase();
    }

    const updatedMembres = isEditing
      ? membres.map(membre => membre.id === currentMembre.id ? currentMembre : membre)
      : [...membres, currentMembre];

    setMembres(updatedMembres);
    
    toast({
      title: isEditing ? "Modification" : "Ajout",
      description: `Le membre ${currentMembre.nom} ${currentMembre.prenom} a été ${isEditing ? 'modifié' : 'ajouté'}`,
    });
    
    setIsDialogOpen(false);
    
    // Synchroniser immédiatement après la sauvegarde
    setTimeout(() => {
      notifyChanges();
      // Synchonisation forcée avec animation
      setIsSyncing(true);
      syncWithServer(updatedMembres)
        .then(success => {
          if (success) {
            setLastSynced(new Date());
            setSyncFailed(false);
          } else {
            setSyncFailed(true);
          }
        })
        .catch(err => {
          console.error("Erreur de synchronisation après sauvegarde:", err);
          setSyncFailed(true);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }, 100);
  };

  const handleExportAllToPdf = () => {
    try {
      exportAllCollaborateursToPdf(membres);
      toast({
        title: "Export PDF",
        description: "La liste des collaborateurs a été exportée",
      });
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast({
        title: "Erreur",
        description: `Erreur lors de l'export PDF: ${error}`,
        variant: "destructive",
      });
    }
  };
  
  // Fonction pour rafraîchir manuellement la liste des membres
  const handleRefresh = async () => {
    setRefreshing(true);
    setIsSyncing(true);
    try {
      await refreshMembres();
      if (membres.length > 0) {
        await syncWithServer(membres);
      }
      setLastSynced(new Date());
      setSyncFailed(false);
      toast({
        title: "Rafraîchissement",
        description: "La liste des membres a été mise à jour",
      });
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      setSyncFailed(true);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir la liste des membres",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
      setIsSyncing(false);
    }
  };

  // Fonction spécifique pour forcer une synchronisation
  const handleForceSync = async () => {
    if (isSyncing || membres.length === 0) return;
    
    setIsSyncing(true);
    try {
      const success = await syncWithServer(membres);
      if (success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        toast({
          title: "Synchronisation réussie",
          description: "Les membres ont été synchronisés avec le serveur",
        });
      } else {
        setSyncFailed(true);
        toast({
          title: "Échec de la synchronisation",
          description: "Impossible de synchroniser les membres",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation forcée:", error);
      setSyncFailed(true);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la synchronisation",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={refreshing}
            title="Rafraîchir la liste"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <button 
            onClick={handleExportAllToPdf}
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
          onSync={handleForceSync}
          showOnlyErrors={false}
          tableName="ressourceshumaines"
        />
      </div>

      {isLoading || refreshing ? (
        <div className="bg-white rounded-md shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md shadow overflow-hidden mt-6">
            {membres.length > 0 ? (
              <MemberList 
                membres={membres} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onExport={handleExportMember} 
              />
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Aucun membre à afficher.</p>
                <p className="text-sm mt-2">Cliquez sur "Ajouter un membre" pour commencer.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4 gap-4">
            <Button 
              className="flex items-center"
              onClick={handleAddMember}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Modifier le membre" : "Ajouter un membre"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing 
                    ? "Modifiez les informations du membre ci-dessous." 
                    : "Remplissez les informations pour ajouter un nouveau membre."}
                </DialogDescription>
              </DialogHeader>
              
              <MemberForm 
                currentMembre={currentMembre}
                isEditing={isEditing}
                onInputChange={handleInputChange}
                onSave={handleSaveMember}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default RessourcesHumaines;
