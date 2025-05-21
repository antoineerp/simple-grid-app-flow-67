
import React from 'react';
import { Pencil, Trash, FileDown, GripVertical } from 'lucide-react';
import { Membre } from '@/types/membres';
import { Button } from "@/components/ui/button";
import { useDragAndDropTable } from '@/hooks/useDragAndDropTable';

interface MemberListProps {
  membres: Membre[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExport?: (id: string) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
}

const MemberList = ({ membres, onEdit, onDelete, onExport, onReorder = () => {} }: MemberListProps) => {
  const {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useDragAndDropTable(membres, onReorder);

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
        {membres.map((membre, index) => (
          <tr 
            key={membre.id} 
            className="border-b hover:bg-gray-50"
            draggable
            onDragStart={(e) => handleDragStart(e, membre.id, index)}
            onDragOver={(e) => handleDragOver(e)}
            onDragLeave={(e) => handleDragLeave(e)}
            onDrop={(e) => handleDrop(e, membre.id, index)}
            onDragEnd={(e) => handleDragEnd(e)}
          >
            <td className="py-3 px-4 text-sm">
              <div className="flex items-center">
                <GripVertical className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 cursor-move" />
                <span className="font-bold">{membre.nom}</span>
              </div>
            </td>
            <td className="py-3 px-4 text-sm">{membre.prenom}</td>
            <td className="py-3 px-4 text-sm">{membre.fonction}</td>
            <td className="py-3 px-4 text-sm">{membre.initiales}</td>
            <td className="py-3 px-4 text-right flex justify-end gap-2">
              {onExport && (
                <Button 
                  size="icon"
                  variant="ghost"
                  className="text-gray-600 hover:text-app-blue h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(membre.id);
                  }}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
              )}
              <Button 
                size="icon"
                variant="ghost"
                className="text-gray-600 hover:text-app-blue h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(membre.id);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                size="icon"
                variant="ghost"
                className="text-gray-600 hover:text-red-500 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(membre.id);
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MemberList;
