
import React from 'react';
import { Document } from '@/types/bibliotheque';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, ExternalLink, GripVertical } from "lucide-react";

interface BibliothequeDocumentRowProps {
  document: Document;
  index: number;
  groupId?: string;
  indented?: boolean;
  onEdit: (document: Document) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string, index?: number) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
}

export const BibliothequeDocumentRow: React.FC<BibliothequeDocumentRowProps> = ({
  document,
  index,
  groupId,
  indented = false,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ajouter le protocole si nécessaire
    let url = link;
    if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
      url = `https://${link}`;
    }
    
    window.open(url, '_blank');
  };

  return (
    <TableRow 
      className="hover:bg-gray-50 border-b"
      draggable
      onDragStart={(e) => onDragStart(e, document.id, groupId, index)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, document.id, groupId)}
      onDragEnd={onDragEnd}
    >
      <TableCell className="w-10">
        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
      </TableCell>
      <TableCell className={`py-2 ${indented ? 'pl-10' : ''}`}>
        {document.name}
      </TableCell>
      <TableCell className="py-2">
        {document.link ? (
          <a 
            href={document.link}
            onClick={(e) => handleLinkClick(e, document.link!)}
            className="text-app-blue hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Voir le document</span>
          </a>
        ) : (
          <span className="text-gray-400">Aucun lien</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-600 hover:text-app-blue"
            onClick={() => onEdit(document)}
            title="Modifier le document"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-600 hover:text-red-600"
            onClick={() => onDelete(document.id)}
            title="Supprimer le document"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
