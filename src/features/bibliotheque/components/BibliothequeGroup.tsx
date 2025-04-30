
import React from 'react';
import { Pencil, Trash, GripVertical, ChevronDown } from 'lucide-react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { BibliothequeDocumentRow } from './BibliothequeDocumentRow';

interface BibliothequeGroupProps {
  group: DocumentGroup;
  onEdit: (document: Document | null, group?: DocumentGroup) => void;
  onDelete: (id: string, isGroup?: boolean) => void;
  onToggleGroup: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onGroupDragStart: (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => void;
  onGroupDrop: (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => void;
}

export const BibliothequeGroup: React.FC<BibliothequeGroupProps> = ({ 
  group,
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
    <React.Fragment>
      <TableRow 
        className="border-b hover:bg-gray-50 cursor-pointer" 
        onClick={() => onToggleGroup(group.id)}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onGroupDragStart(e, group.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragOver(e);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          onDragLeave(e);
        }}
        onDrop={(e) => {
          e.stopPropagation();
          onGroupDrop(e, group.id);
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onDragEnd(e);
        }}
        data-sync-id={group.id}
        data-sync-type="group"
        data-sync-table="collaboration"
        data-sync-owner={group.userId || "default"}
      >
        <TableCell className="py-3 px-2 w-10">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </TableCell>
        <TableCell className="py-3 px-4 w-full text-left" colSpan={2}>
          <div className="flex items-center">
            <ChevronDown 
              className={`h-4 w-4 mr-2 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} 
            />
            <span className="font-bold text-app-blue text-sm">{group.name}</span>
          </div>
        </TableCell>
        <TableCell className="py-3 px-4 text-right">
          <button 
            className="text-gray-600 hover:text-app-blue mr-3"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(null, group);
            }}
          >
            <Pencil className="h-5 w-5 inline-block" />
          </button>
          <button 
            className="text-gray-600 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(group.id, true);
            }}
          >
            <Trash className="h-5 w-5 inline-block" />
          </button>
        </TableCell>
      </TableRow>
      
      {group.expanded && group.items && group.items.map((docId) => {
        // Construire un objet Document à partir de l'identifiant
        const docItem: Document = {
          id: docId,
          name: `Document ${docId}`, // Nom par défaut
          groupId: group.id
        };
        
        return (
          <BibliothequeDocumentRow
            key={docId}
            document={docItem}
            onEdit={onEdit}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            groupId={group.id}
          />
        );
      })}
    </React.Fragment>
  );
};
