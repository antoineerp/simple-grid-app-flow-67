
import React, { useState } from 'react';
import { Pencil, Trash, FileText, UserPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Membre {
  id: number;
  nom: string;
  prenom: string;
  fonction: string;
  initiales: string;
}

const RessourcesHumaines = () => {
  const { toast } = useToast();
  const [membres, setMembres] = useState<Membre[]>([
    { 
      id: 1, 
      nom: 'BONNET', 
      prenom: 'RICHARD', 
      fonction: 'DXDXD', 
      initiales: 'RB' 
    },
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMembre, setCurrentMembre] = useState<Membre>({
    id: 0,
    nom: '',
    prenom: '',
    fonction: '',
    initiales: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Handler for edit action
  const handleEdit = (id: number) => {
    const membre = membres.find(m => m.id === id);
    if (membre) {
      setCurrentMembre({ ...membre });
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  // Handler for delete action
  const handleDelete = (id: number) => {
    setMembres(prev => prev.filter(membre => membre.id !== id));
    toast({
      title: "Suppression",
      description: `Le membre ${id} a été supprimé`,
    });
  };

  // Handler for adding a new member
  const handleAddMember = () => {
    // Generate a new ID for the new member
    const newId = membres.length > 0 
      ? Math.max(...membres.map(membre => membre.id)) + 1 
      : 1;
    
    setCurrentMembre({
      id: newId,
      nom: '',
      prenom: '',
      fonction: '',
      initiales: ''
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
        description: `Le membre ${currentMembre.id} a été modifié`,
      });
    } else {
      // Add new member
      setMembres(prev => [...prev, currentMembre]);
      toast({
        title: "Ajout",
        description: `Le membre ${currentMembre.id} a été ajouté`,
      });
    }
    
    setIsDialogOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
          <p className="text-gray-600">Collaborateurs/trices du projet</p>
        </div>
        <FileText className="text-red-500 h-6 w-6" />
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden mt-6">
        <table className="w-full">
          <thead>
            <tr className="bg-app-light-blue text-left">
              <th className="py-3 px-4 text-app-blue font-semibold">Nom</th>
              <th className="py-3 px-4 text-app-blue font-semibold">Prénom</th>
              <th className="py-3 px-4 text-app-blue font-semibold">Fonction</th>
              <th className="py-3 px-4 text-app-blue font-semibold">Initiales</th>
              <th className="py-3 px-4 text-app-blue font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {membres.map((membre) => (
              <tr key={membre.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{membre.nom}</td>
                <td className="py-3 px-4">{membre.prenom}</td>
                <td className="py-3 px-4">{membre.fonction}</td>
                <td className="py-3 px-4">{membre.initiales}</td>
                <td className="py-3 px-4 text-right">
                  <button 
                    className="text-gray-600 hover:text-app-blue mr-3"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent any event bubbling
                      handleEdit(membre.id);
                    }}
                  >
                    <Pencil className="h-5 w-5 inline-block" />
                  </button>
                  <button 
                    className="text-gray-600 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent any event bubbling
                      handleDelete(membre.id);
                    }}
                  >
                    <Trash className="h-5 w-5 inline-block" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Nom
              </Label>
              <Input
                id="nom"
                name="nom"
                className="col-span-3"
                value={currentMembre.nom}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prenom" className="text-right">
                Prénom
              </Label>
              <Input
                id="prenom"
                name="prenom"
                className="col-span-3"
                value={currentMembre.prenom}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fonction" className="text-right">
                Fonction
              </Label>
              <Input
                id="fonction"
                name="fonction"
                className="col-span-3"
                value={currentMembre.fonction}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initiales" className="text-right">
                Initiales
              </Label>
              <Input
                id="initiales"
                name="initiales"
                className="col-span-3"
                value={currentMembre.initiales}
                onChange={handleInputChange}
                placeholder="Laisser vide pour générer automatiquement"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveMember}>
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RessourcesHumaines;
