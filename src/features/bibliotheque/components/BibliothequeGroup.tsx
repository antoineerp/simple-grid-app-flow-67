
import React from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { BibliothequeDocumentRow } from './BibliothequeDocumentRow';

interface BibliothequeGroupProps {
  group: DocumentGroup;
  groupIndex: number;
  documents: Document[];
  onEdit: (document: Document | null, group?: DocumentGroup) => void;
  onDelete: (id: string, isGroup?: boolean) => void;
  onToggleGroup: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string, index?: number) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onGroupDragStart: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onGroupDrop: (e: React.DragEvent<HTMLTableRowElement>) => void;
}

export const BibliothequeGroup: React.FC<BibliothequeGroupProps> = ({
  group,
  groupIndex,
  documents,
  onEdit,
  onDelete,
  onToggleGroup,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onGroupDragStart,
  onGroupDrop
}) => {
  return (
    <>
      <TableRow 
        className="hover:bg-gray-100 border-b"
        draggable={true}
        onDragStart={onGroupDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onGroupDrop(e)}
        onDragEnd={onDragEnd}
      >
        <TableCell className="w-10">
          <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
        </TableCell>
        <TableCell className="py-2">
          <div className="flex items-center gap-1">
            <button 
              className="p-1 hover:bg-gray-200 rounded-full"
              onClick={() => onToggleGroup(group.id)}
            >
              {group.expanded ? 
                <ChevronDown className="h-5 w-5 text-gray-700" /> : 
                <ChevronRight className="h-5 w-5 text-gray-700" />
              }
            </button>
            <span className="font-medium text-gray-900">{group.name}</span>
          </div>
        </TableCell>
        <TableCell></TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-600 hover:text-app-blue"
              onClick={() => onEdit(null, group)}
              title="Modifier le groupe"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-600 hover:text-red-600"
              onClick={() => onDelete(group.id, true)}
              title="Supprimer le groupe"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      
      {group.expanded && documents && documents.map((doc, index) => (
        <BibliothequeDocumentRow
          key={doc.id}
          document={doc}
          index={index}
          groupId={group.id} 
          indented={true}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
        />
      ))}
    </>
  );
};
