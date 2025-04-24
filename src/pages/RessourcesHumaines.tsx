import React, { useState } from 'react';
import { FileText, UserPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMembres } from '@/contexts/MembresContext';
import MemberList from '@/components/ressources-humaines/MemberList';
import MemberForm from '@/components/ressources-humaines/MemberForm';
import { Membre } from '@/types/membres';

const RessourcesHumaines = () => {
  const { toast } = useToast();
  const { membres, setMembres } = useMembres();
  
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
        </div>
        <FileText className="text-red-500 h-6 w-6" />
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
