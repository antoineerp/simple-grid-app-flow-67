
// Page Ressources Humaines corrigée
import React from 'react';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function RessourcesHumaines() {
  const { 
    members, 
    isLoading, 
    createMember, 
    updateMember, 
    deleteMember,
    isCreating,
    isUpdating,
    isDeleting
  } = useMembers();

  const handleAddMember = () => {
    const newMember = {
      nom: 'Nouveau',
      prenom: 'Membre',
      email: 'nouveau@exemple.com',
      fonction: 'Fonction',
      initiales: 'NM'
    };
    createMember(newMember);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      deleteMember(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Ressources Humaines</h1>
        <div className="text-center py-8">
          <p>Chargement des membres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Ressources Humaines</h1>
        <Button onClick={handleAddMember} disabled={isCreating}>
          <UserPlus className="w-4 h-4 mr-2" />
          {isCreating ? 'Ajout...' : 'Ajouter un membre'}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fonction</TableHead>
              <TableHead>Initiales</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.nom}</TableCell>
                <TableCell>{member.prenom}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.fonction}</TableCell>
                <TableCell>{member.initiales}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteMember(member.id)}
                    disabled={isDeleting}
                  >
                    Supprimer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {members.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun membre trouvé.</p>
        </div>
      )}
    </div>
  );
}
