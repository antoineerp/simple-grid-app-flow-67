
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Document, DocumentGroup } from '@/hooks/useBibliotheque';

interface BibliothequeTableProps {
  isLoading?: boolean;
  documents: Document[];
  groups: DocumentGroup[];
  onGroupEdit: (group: DocumentGroup) => void;
  onGroupDelete: (groupId: string | number) => void;
  onDocumentEdit: (document: Document) => void;
  onDocumentDelete: (documentId: string | number) => void;
}

export const BibliothequeTable: React.FC<BibliothequeTableProps> = ({
  isLoading,
  documents,
  groups,
  onGroupEdit,
  onGroupDelete,
  onDocumentEdit,
  onDocumentDelete
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-600 mb-2">Aucun document trouvé</p>
        <p className="text-sm text-gray-500">Créez votre premier document en cliquant sur "Nouveau Document"</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Titre</TableHead>
          <TableHead>Groupe</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">{doc.title}</TableCell>
            <TableCell>
              {groups.find(g => g.id === doc.groupId)?.name || 'Sans groupe'}
            </TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                doc.status === 'validated' ? 'bg-green-100 text-green-800' : 
                doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {doc.status === 'validated' ? 'Validé' : 
                 doc.status === 'pending' ? 'En attente' : 'Brouillon'}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDocumentEdit(doc)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Modifier</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDocumentDelete(doc.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
