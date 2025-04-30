
import React from 'react';
import { Pencil, Trash, GripVertical, Link as LinkIcon } from 'lucide-react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Document } from '@/types/bibliotheque';

interface BibliothequeDocumentRowProps {
  document: Document;
  onEdit: (document: Document | null, group?: any) => void;
  onDelete: (id: string, isGroup?: boolean) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
  groupId?: string;
}

export const BibliothequeDocumentRow: React.FC<BibliothequeDocumentRowProps> = ({ 
  document,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  groupId
}) => {
  // Handle case where document might be incomplete
  const docName = document?.name || 'Document sans nom';
  const docLink = document?.link || '';
  const docId = document?.id || '';
  
  return (
    <TableRow 
      className="hover:bg-gray-50 border-b"
      draggable 
      onDragStart={(e) => onDragStart(e, docId, groupId)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, docId, groupId)}
      onDragEnd={onDragEnd}
      data-sync-id={docId}
      data-sync-type="document"
      data-sync-table="collaboration"
      data-sync-owner={document.userId || "default"}
    >
      <TableCell className="py-3 px-2 w-10">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </TableCell>
      <TableCell className="py-3 px-4 w-full text-left">
        <div className="flex items-center">
          <span className="text-sm text-app-blue">{docName}</span>
          {docLink && (
            <a href={docLink} target="_blank" rel="noopener noreferrer" className="ml-2">
              <LinkIcon className="h-4 w-4 text-gray-400" />
            </a>
          )}
        </div>
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
          onClick={() => onDelete(docId)}
        >
          <Trash className="h-5 w-5 inline-block" />
        </button>
      </TableCell>
    </TableRow>
  );
};
