
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
