
import React from 'react';
import { Pencil, Trash, GripVertical } from 'lucide-react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Document } from '@/types/bibliotheque';

interface BibliothequeDocumentRowProps {
  document: Document;
  groupId?: string;
  onEdit: (document: Document | null, group?: any) => void;
  onDelete: (id: string, isGroup?: boolean) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
}

export const BibliothequeDocumentRow: React.FC<BibliothequeDocumentRowProps> = ({
  document,
  groupId,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) => {
  return (
    <TableRow
      className={`border-b hover:bg-gray-50 ${groupId ? 'bg-gray-50' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, document.id, groupId)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, document.id, groupId)}
      onDragEnd={onDragEnd}
    >
      <TableCell className="py-3 px-2 w-10">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </TableCell>
      <TableCell className="py-3 px-4">
        {document.name}
      </TableCell>
      <TableCell className="py-3 px-4">
        {document.link && (
          <a
            href={document.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-blue hover:underline"
          >
            {document.link}
          </a>
        )}
      </TableCell>
      <TableCell className="py-3 px-4 text-right">
        <button
          className="text-gray-600 hover:text-app-blue mr-3"
          onClick={() => onEdit(document)}
        >
          <Pencil className="h-5 w-5 inline-block" />
        </button>
        <button
          className="text-gray-600 hover:text-red-500"
          onClick={() => onDelete(document.id)}
        >
          <Trash className="h-5 w-5 inline-block" />
        </button>
      </TableCell>
    </TableRow>
  );
};
