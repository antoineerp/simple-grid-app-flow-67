
import React from 'react';
import { FileText, UserPlus } from 'lucide-react';
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

const RessourcesHumaines = () => {
  const { toast } = useToast();
  const { 
    membres, 
    setMembres, 
    isLoading, 
    error 
  } = useMembres();
  
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

  const handleEdit = (id: string) => {
    const membre = membres.find(m => m.id === id);
    if (membre) {
      setCurrentMembre({ ...membre });
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    setMembres(prev => prev.filter(membre => membre.id !== id));
    toast({
      title: "Suppression",
      description: `Le membre ${id} a été supprimé`,
    });
  };

  const handleAddMember = () => {
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

    if (isEditing) {
      setMembres(prev => 
        prev.map(membre => membre.id === currentMembre.id ? currentMembre : membre)
      );
      toast({
        title: "Modification",
        description: `Le membre ${currentMembre.id} a été modifié`,
      });
    } else {
      setMembres(prev => [...prev, currentMembre]);
      toast({
        title: "Ajout",
        description: `Le membre ${currentMembre.id} a été ajouté`,
      });
    }
    
    setIsDialogOpen(false);
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportAllToPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {isLoading ? (
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
