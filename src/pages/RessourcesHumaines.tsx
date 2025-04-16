
import React, { useState } from 'react';
import { Pencil, Trash, FileText, UserPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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

  // Add handlers for edit and delete actions
  const handleEdit = (id: number) => {
    toast({
      title: "Modification",
      description: `Édition du membre ${id}`,
    });
    // Implementation of edit functionality would go here
  };

  const handleDelete = (id: number) => {
    setMembres(prev => prev.filter(membre => membre.id !== id));
    toast({
      title: "Suppression",
      description: `Le membre ${id} a été supprimé`,
    });
  };

  const handleAddMember = () => {
    toast({
      title: "Nouveau membre",
      description: "Ajout d'un nouveau membre",
    });
    // Implementation of add functionality would go here
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
    </div>
  );
};

export default RessourcesHumaines;
