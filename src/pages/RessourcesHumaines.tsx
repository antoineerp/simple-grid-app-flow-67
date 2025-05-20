
import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import MemberList from '@/components/ressources-humaines/MemberList';
import { getMembres } from '@/services/users/membresService';
import SyncIndicator from '@/components/common/SyncIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';

const RessourcesHumaines = () => {
  const [membres, setMembres] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [syncFailed, setSyncFailed] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [lastSynced, setLastSynced] = React.useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState({
    id: '',
    nom: '',
    prenom: '',
    fonction: '',
    email: '',
    telephone: ''
  });
  
  const { toast } = useToast();

  const loadMembres = async () => {
    try {
      setIsLoading(true);
      const data = await getMembres(true);
      setMembres(data);
      setIsLoading(false);
      setSyncFailed(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      setIsLoading(false);
      setSyncFailed(true);
    }
  };

  React.useEffect(() => {
    loadMembres();
    
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleExportPdf = () => {
    toast({
      title: "Export PDF",
      description: "La fonctionnalité d'export sera disponible prochainement",
    });
  };

  const handleAddMember = () => {
    setCurrentMember({
      id: '',
      nom: '',
      prenom: '',
      fonction: '',
      email: '',
      telephone: ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveMember = () => {
    const newMember = {
      ...currentMember,
      id: currentMember.id || uuidv4()
    };
    
    if (currentMember.id) {
      // Update existing member
      setMembres(prev => prev.map(m => m.id === newMember.id ? newMember : m));
    } else {
      // Add new member
      setMembres(prev => [...prev, newMember]);
    }
    
    setIsDialogOpen(false);
    toast({
      title: "Membre enregistré",
      description: `Le membre ${newMember.prenom} ${newMember.nom} a été ${currentMember.id ? 'mis à jour' : 'ajouté'}.`
    });
  };

  // Create a wrapper function that returns Promise<void> for SyncIndicator
  const handleSync = async () => {
    await loadMembres();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
        </div>
        <div className="flex space-x-2">
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
          isSyncing={isLoading}
          isOnline={isOnline}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={handleSync}
          showOnlyErrors={true}
        />
      </div>

      {syncFailed && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur de synchronisation</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>Une erreur est survenue lors de la synchronisation des membres</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              className="ml-4"
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Chargement des membres...</p>
        </div>
      ) : membres.length > 0 ? (
        <MemberList membres={membres} onEdit={(member) => {
          setCurrentMember(member);
          setIsDialogOpen(true);
        }} onDelete={(id) => {
          setMembres(prev => prev.filter(m => m.id !== id));
          toast({
            title: "Membre supprimé",
            description: "Le membre a été supprimé avec succès."
          });
        }} />
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucun membre trouvé. Cliquez sur "Ajouter un membre" pour commencer.</p>
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <Button 
          variant="default"
          onClick={handleAddMember}
        >
          <Plus className="h-5 w-5 mr-2" />
          Ajouter un membre
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentMember.id ? 'Modifier' : 'Ajouter'} un membre</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  id="nom"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={currentMember.nom}
                  onChange={e => setCurrentMember({...currentMember, nom: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
                <input
                  id="prenom"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={currentMember.prenom}
                  onChange={e => setCurrentMember({...currentMember, prenom: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label htmlFor="fonction" className="block text-sm font-medium text-gray-700">Fonction</label>
              <input
                id="fonction"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentMember.fonction}
                onChange={e => setCurrentMember({...currentMember, fonction: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={currentMember.email}
                  onChange={e => setCurrentMember({...currentMember, email: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  id="telephone"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={currentMember.telephone}
                  onChange={e => setCurrentMember({...currentMember, telephone: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveMember}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RessourcesHumaines;
