
import React, { useState, useEffect } from 'react';
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
import { syncMembresWithServer } from '@/services/membres/membresService';

const RessourcesHumaines = () => {
  const { toast } = useToast();
  const { membres, setMembres, loading, refreshMembres } = useMembres();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMembre, setCurrentMembre] = useState<Membre>({
    id: '',
    nom: '',
    prenom: '',
    fonction: '',
    initiales: '',
    date_creation: new Date(),
    mot_de_passe: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Synchroniser avec le serveur au chargement
  useEffect(() => {
    const syncWithServer = async () => {
      if (membres.length > 0 && !loading) {
        setIsSyncing(true);
        const currentUser = localStorage.getItem('currentUser') || 
                           localStorage.getItem('userEmail') || 
                           'default_user';
                           
        try {
          await syncMembresWithServer(membres, currentUser);
        } catch (error) {
          console.error("Erreur lors de la synchronisation initiale:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    syncWithServer();
  }, [membres, loading]);

  // Handler pour rafraîchir les données
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMembres();
      toast({
        title: "Données rafraîchies",
        description: "La liste des membres a été mise à jour",
      });
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler for edit action
  const handleEdit = (id: string) => {
    const membre = membres.find(m => m.id === id);
    if (membre) {
      setCurrentMembre({ ...membre });
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  // Handler for delete action
  const handleDelete = (id: string) => {
    setMembres(prev => prev.filter(membre => membre.id !== id));
    toast({
      title: "Suppression",
      description: `Le membre ${id} a été supprimé`,
    });
  };

  // Handler for adding a new member
  const handleAddMember = () => {
    // Generate a new ID for the new member - convert to string
    const newId = membres.length > 0 
      ? String(Math.max(...membres.map(membre => parseInt(membre.id))) + 1)
      : '1';
    
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

  // Handler for input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMembre({
      ...currentMembre,
      [name]: value
    });
  };

  // Handler for saving member (add or update)
  const handleSaveMember = () => {
    if (currentMembre.nom.trim() === '' || currentMembre.prenom.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom et le prénom sont requis",
        variant: "destructive",
      });
      return;
    }

    // Calculate initials if not provided
    if (currentMembre.initiales.trim() === '') {
      const initiales = `${currentMembre.prenom.charAt(0)}${currentMembre.nom.charAt(0)}`;
      currentMembre.initiales = initiales.toUpperCase();
    }

    if (isEditing) {
      // Update existing member
      setMembres(prev => 
        prev.map(membre => membre.id === currentMembre.id ? currentMembre : membre)
      );
      toast({
        title: "Modification",
        description: `Le membre ${currentMembre.nom} ${currentMembre.prenom} a été modifié`,
      });
    } else {
      // Add new member
      setMembres(prev => [...prev, currentMembre]);
      toast({
        title: "Ajout",
        description: `Le membre ${currentMembre.nom} ${currentMembre.prenom} a été ajouté`,
      });
    }
    
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-blue mb-4"></div>
            <p className="text-app-blue">Chargement des membres...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
          <p className="text-gray-600">Collaborateurs/trices du projet</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <FileText className="text-red-500 h-6 w-6" />
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden mt-6">
        <MemberList 
          membres={membres} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      </div>

      <div className="flex justify-end mt-4">
        <button 
          className="btn-primary flex items-center"
          onClick={handleAddMember}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un membre
        </button>
      </div>

      {/* Modal pour ajouter/modifier un membre */}
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
    </div>
  );
};

export default RessourcesHumaines;
