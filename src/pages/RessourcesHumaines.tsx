
import React, { useState, useEffect } from 'react';
import { FileText, Plus, UserPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import MemberList from '@/components/ressources-humaines/MemberList';
import { getMembres } from '@/services/users/membresService';
import SyncIndicator from '@/components/common/SyncIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { v4 as uuidv4 } from 'uuid';
import { useDragAndDropTable } from '@/hooks/useDragAndDropTable';

const RessourcesHumaines = () => {
  const [membres, setMembres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncFailed, setSyncFailed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState({
    id: '',
    nom: '',
    prenom: '',
    fonction: '',
    initiales: ''
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

  useEffect(() => {
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
      initiales: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditMember = (id) => {
    const memberToEdit = membres.find(m => m.id === id);
    if (memberToEdit) {
      setCurrentMember({
        id: memberToEdit.id || '',
        nom: memberToEdit.nom || '',
        prenom: memberToEdit.prenom || '',
        fonction: memberToEdit.fonction || '',
        initiales: memberToEdit.initiales || ''
      });
      setIsDialogOpen(true);
    }
  };

  // Fonction pour gérer le réordonnancement des membres
  const handleReorder = (startIndex, endIndex) => {
    // Créer une copie de la liste des membres
    const updatedMembres = [...membres];
    // Retirer l'élément de sa position d'origine
    const [removed] = updatedMembres.splice(startIndex, 1);
    // L'insérer à sa nouvelle position
    updatedMembres.splice(endIndex, 0, removed);
    // Mettre à jour la liste
    setMembres(updatedMembres);
    
    toast({
      title: "Ordre mis à jour",
      description: "L'ordre des membres a été mis à jour avec succès"
    });
  };

  const generateInitiales = (prenom, nom) => {
    const prenomInitial = prenom ? prenom.charAt(0).toUpperCase() : '';
    const nomInitial = nom ? nom.charAt(0).toUpperCase() : '';
    return prenomInitial + nomInitial;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMember(prev => ({
      ...prev,
      [name]: value
    }));

    // Générer automatiquement les initiales si le nom ou prénom change
    if (name === 'nom' || name === 'prenom') {
      const prenom = name === 'prenom' ? value : currentMember.prenom;
      const nom = name === 'nom' ? value : currentMember.nom;
      
      // Ne mettre à jour les initiales que si elles n'ont pas été modifiées manuellement
      if (!currentMember.initiales || 
          currentMember.initiales === generateInitiales(currentMember.prenom, currentMember.nom)) {
        setCurrentMember(prev => ({
          ...prev,
          initiales: generateInitiales(prenom, nom)
        }));
      }
    }
  };

  const handleSaveMember = () => {
    // Vérifier que les champs obligatoires sont remplis
    if (!currentMember.nom || !currentMember.prenom || !currentMember.fonction) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires (nom, prénom, fonction)."
      });
      return;
    }
    
    // Générer les initiales si champ vide
    const initiales = currentMember.initiales || generateInitiales(currentMember.prenom, currentMember.nom);
    
    const newMember = {
      ...currentMember,
      initiales,
      id: currentMember.id || uuidv4(),
      date_creation: new Date()
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
        <MemberList 
          membres={membres} 
          onEdit={handleEditMember} 
          onDelete={(id) => {
            setMembres(prev => prev.filter(m => m.id !== id));
            toast({
              title: "Membre supprimé",
              description: "Le membre a été supprimé avec succès."
            });
          }} 
          onReorder={handleReorder}
        />
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucun membre trouvé. Cliquez sur "Ajouter un membre" pour commencer.</p>
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <Button 
          variant="default"
          onClick={handleAddMember}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Ajouter un collaborateur
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentMember.id ? 'Modifier' : 'Ajouter'} un collaborateur</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Nom*
              </Label>
              <Input
                id="nom"
                name="nom"
                className="col-span-3"
                value={currentMember.nom}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prenom" className="text-right">
                Prénom*
              </Label>
              <Input
                id="prenom"
                name="prenom"
                className="col-span-3"
                value={currentMember.prenom}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fonction" className="text-right">
                Fonction*
              </Label>
              <Input
                id="fonction"
                name="fonction"
                className="col-span-3"
                value={currentMember.fonction}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initiales" className="text-right">
                Initiales
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="initiales"
                  name="initiales"
                  className="col-span-3"
                  value={currentMember.initiales}
                  onChange={handleInputChange}
                  placeholder="Générées automatiquement"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500">Laissez vide pour générer automatiquement</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveMember}>
              {currentMember.id ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RessourcesHumaines;
