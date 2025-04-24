
import React from 'react';
import { Pencil, Trash } from 'lucide-react';
import { Membre } from '@/types/membres';

interface MemberListProps {
  membres: Membre[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MemberList = ({ membres, onEdit, onDelete }: MemberListProps) => {
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-app-light-blue text-left">
          <th className="py-3 px-4 text-app-blue font-medium text-sm">Nom</th>
          <th className="py-3 px-4 text-app-blue font-medium text-sm">Prénom</th>
          <th className="py-3 px-4 text-app-blue font-medium text-sm">Fonction</th>
          <th className="py-3 px-4 text-app-blue font-medium text-sm">Initiales</th>
          <th className="py-3 px-4 text-app-blue font-medium text-sm text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {membres.map((membre) => (
          <tr key={membre.id} className="border-b hover:bg-gray-50">
            <td className="py-3 px-4 text-sm">{membre.nom}</td>
            <td className="py-3 px-4 text-sm">{membre.prenom}</td>
            <td className="py-3 px-4 text-sm">{membre.fonction}</td>
            <td className="py-3 px-4 text-sm">{membre.initiales}</td>
            <td className="py-3 px-4 text-right">
              <button 
                className="text-gray-600 hover:text-app-blue mr-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(membre.id);
                }}
              >
                <Pencil className="h-5 w-5 inline-block" />
              </button>
              <button 
                className="text-gray-600 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(membre.id);
                }}
              >
                <Trash className="h-5 w-5 inline-block" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MemberList;
