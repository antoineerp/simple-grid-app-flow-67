
import React from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { Folder, File, Pencil, Trash, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BibliothequeTableProps {
  documents: Document[];
  groups: DocumentGroup[];
  onEdit: (document: Document, group?: DocumentGroup) => void;
  onDelete: (id: string, isGroup: boolean) => void;
  onReorder: (startIndex: number, endIndex: number, targetGroupId?: string) => void;
  onGroupReorder: (startIndex: number, endIndex: number) => void;
  onToggleGroup: (id: string) => void;
}

export const BibliothequeTable: React.FC<BibliothequeTableProps> = ({
  documents,
  groups,
  onEdit,
  onDelete,
  onReorder,
  onGroupReorder,
  onToggleGroup
}) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nom
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Affichage des groupes */}
          {groups.map((group) => (
            <React.Fragment key={group.id}>
              {/* Ligne du groupe */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 mr-2 h-6 w-6"
                    onClick={() => onToggleGroup(group.id)}
                  >
                    {group.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <Folder className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium">{group.name}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(null as any, group)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Éditer</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-600"
                    onClick={() => onDelete(group.id, true)}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </td>
              </tr>
              
              {/* Documents du groupe si le groupe est déplié */}
              {group.expanded && documents
                .filter((doc) => doc.groupId === group.id)
                .map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 bg-gray-50/50">
                    <td className="px-4 py-3 pl-12 flex items-center">
                      <File className="h-5 w-5 text-gray-500 mr-2" />
                      <span>{doc.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(doc, group)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Éditer</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() => onDelete(doc.id, false)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
          
          {/* Documents sans groupe */}
          {documents
            .filter((doc) => !doc.groupId)
            .map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center">
                  <File className="h-5 w-5 text-gray-500 mr-2" />
                  <span>{doc.name}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(doc)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Éditer</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-600"
                    onClick={() => onDelete(doc.id, false)}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </td>
              </tr>
            ))}
          
          {documents.length === 0 && groups.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-3 text-center text-gray-500">
                Aucun document ou groupe à afficher
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
